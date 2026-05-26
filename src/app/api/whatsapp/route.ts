import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
const WA_TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const GROQ_KEY = process.env.GROQ_API_KEY!;

type RestaurantRow = {
  id: string;
  name: string;
  stay_duration: number;
  large_group_threshold: number;
};

type ReservationRow = {
  table_id: string | null;
  table_ids: string[] | null;
  time: string;
};

type TableRow = {
  id: string;
  name: string;
  capacity: number;
  combinable_with: string[];
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value?.messages || value.messages.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const message = value.messages[0];
  if (!message || message.type !== "text") {
    return NextResponse.json({ ok: true });
  }

  const from: string = message.from;
  const text: string = message.text.body;
  const phoneNumberId: string = change?.value?.metadata?.phone_number_id;

  // Restaurant finden
  let { data: restaurant } = await supabase
    .from("restaurants").select("*").eq("whatsapp_phone_id", phoneNumberId).single();

  if (!restaurant) {
    const { data: fallback } = await supabase
      .from("restaurants").select("*").order("created_at", { ascending: true }).limit(1).single();
    restaurant = fallback;
  }

  if (!restaurant) {
    await sendWhatsApp(from, "Entschuldigung, dieses Restaurant konnte nicht gefunden werden.");
    return NextResponse.json({ ok: true });
  }

  const rest = restaurant as RestaurantRow;
  const largeGroupThreshold = rest.large_group_threshold || 15;

  // Konversationshistorie laden
  const { data: conv } = await supabase
    .from("whatsapp_conversations")
    .select("*").eq("phone", from).eq("restaurant_id", rest.id).single();

  const history: { role: string; content: string }[] = conv?.messages || [];

  // Öffnungszeiten
  const { data: hours } = await supabase
    .from("opening_hours").select("*").eq("restaurant_id", rest.id);

  const hoursText = (hours || []).map((h: { is_closed: boolean; day_of_week: number; open_time: string; close_time: string }) => {
    const days = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
    return h.is_closed
      ? `${days[h.day_of_week]}: Geschlossen`
      : `${days[h.day_of_week]}: ${h.open_time} - ${h.close_time}`;
  }).join("\n") || "Keine Öffnungszeiten hinterlegt";

  const today = new Date();
  const todayStr = today.toLocaleDateString("de-AT", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  const systemPrompt = `Du bist der freundliche Reservierungsassistent von "${rest.name}" in Österreich.
Heute ist ${todayStr} (${today.toISOString().split("T")[0]}).

Öffnungszeiten:
${hoursText}

DEINE AUFGABE:
Du sammelst alle 4 wichtigen Infos vom Gast: Name, Datum, Uhrzeit, Personenzahl.
Verstehe auch unklare oder unvollständige Nachrichten und frage höflich nach was fehlt.

VERSTÄNDNIS-REGELN:
- Wenn jemand "morgen", "übermorgen", "Samstag" schreibt — rechne das in ein konkretes Datum um.
- Wenn jemand "abends", "zum Mittagessen", "spät" schreibt — frag nach der genauen Uhrzeit.
- Wenn jemand "für uns", "zu zweit", "mit der Familie" schreibt — frag wie viele Personen genau.
- Wenn jemand undeutlich schreibt oder Tippfehler hat — versuche es zu verstehen, frag im Zweifel nach.
- Wenn jemand "Hallo" oder ähnlich schreibt — begrüße zurück und frage was er möchte.

WICHTIGE REGELN:
1. Frage IMMER nach fehlenden Infos — eine Frage pro Nachricht.
2. Nutze den bisherigen Gesprächsverlauf — vergiss nie was der Gast bereits gesagt hat.
3. Berechne den Wochentag IMMER aus dem echten Datum — nie raten.

KRITISCH — PERSONENZAHL PRÜFEN:
- Wenn Personenzahl MEHR ALS ODER GLEICH ${largeGroupThreshold} ist: Schreibe dem Gast dass sich das Team meldet. Schreibe am Ende NUR: LARGE_GROUP:{"name":"...","date":"YYYY-MM-DD","time":"HH:MM","party_size":N}
- Wenn Personenzahl WENIGER ALS ${largeGroupThreshold} ist: Bestätige die Reservierung herzlich. Schreibe am Ende NUR: RESERVATION_DATA:{"name":"...","date":"YYYY-MM-DD","time":"HH:MM","party_size":N}
- NIEMALS RESERVATION_DATA bei ${largeGroupThreshold} oder mehr Personen verwenden!
- NIEMALS LARGE_GROUP bei weniger als ${largeGroupThreshold} Personen verwenden!

4. Antworte immer auf Deutsch, kurz und freundlich — max 3 Sätze.
5. Schreibe RESERVATION_DATA und LARGE_GROUP immer exakt so — niemals auf Deutsch übersetzen.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: text }
  ];

  const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, max_tokens: 400 }),
  });

  const aiData = await aiResponse.json();
  const aiMessage: string = aiData.choices?.[0]?.message?.content || "Entschuldigung, bitte versuch es nochmal.";

  // History aktualisieren
  const newHistory = [
    ...history,
    { role: "user", content: text },
    { role: "assistant", content: aiMessage }
  ].slice(-20);

  if (conv) {
    await supabase.from("whatsapp_conversations")
      .update({ messages: newHistory, updated_at: new Date().toISOString() })
      .eq("id", conv.id);
  } else {
    await supabase.from("whatsapp_conversations")
      .insert([{ phone: from, restaurant_id: rest.id, messages: newHistory }]);
  }

  // Große Gruppe
  const largeGroupMatch = aiMessage.match(/LARGE_GROUP:\s*(\{[^}]+\})/i);
  if (largeGroupMatch) {
    try {
      const resData = JSON.parse(largeGroupMatch[1]);
      await supabase.from("reservations").insert([{
        restaurant_id: rest.id,
        guest_name: resData.name,
        guest_phone: from,
        party_size: resData.party_size,
        date: resData.date,
        time: resData.time,
        channel: "whatsapp",
        status: "pending",
        notes: "Großgruppe — manuelle Prüfung erforderlich",
        table_ids: [],
      }]);
      await sendWhatsApp(from, `Vielen Dank für deine Anfrage, ${resData.name}! 🙏\n\nFür Gruppen ab ${resData.party_size} Personen meldet sich unser Team persönlich bei dir — wir prüfen die Verfügbarkeit und bestätigen deinen Wunschtermin so schnell wie möglich.\n\nWir freuen uns auf euch! 🍽️`);
    } catch {
      await sendWhatsApp(from, "Vielen Dank für deine Anfrage! Für Großgruppen meldet sich unser Team persönlich bei dir.");
    }
    return NextResponse.json({ ok: true });
  }

  // Normale Reservierung
  const reservationMatch = aiMessage.match(/RESERVATION_DATA:\s*(\{[^}]+\})/i);
  if (reservationMatch) {
    try {
      const resData = JSON.parse(reservationMatch[1]);
      const stayDuration: number = rest.stay_duration || 150;
      const party: number = resData.party_size;

      // Alle Reservierungen für das Datum laden
      const { data: existingRes } = await supabase
        .from("reservations")
        .select("table_id, table_ids, time")
        .eq("restaurant_id", rest.id)
        .eq("date", resData.date)
        .neq("status", "cancelled");

      // Alle Tische laden mit combinable_with
      const { data: allTables } = await supabase
        .from("tables")
        .select("id, name, capacity, combinable_with")
        .eq("restaurant_id", rest.id);

      const reqStart = parseInt(resData.time.split(":")[0]) * 60 + parseInt(resData.time.split(":")[1]);
      const reqEnd = reqStart + stayDuration;

      function isTableOccupied(tableId: string): boolean {
        return (existingRes as ReservationRow[] || []).some((r: ReservationRow) => {
          const blockedIds = (r.table_ids && r.table_ids.length > 0) ? r.table_ids : (r.table_id ? [r.table_id] : []);
          if (!blockedIds.includes(tableId)) return false;
          const rStart = parseInt(r.time.split(":")[0]) * 60 + parseInt(r.time.split(":")[1]);
          const rEnd = rStart + stayDuration;
          return reqStart < rEnd && reqEnd > rStart;
        });
      }

      const tables = (allTables as TableRow[] || []);

      // 1. Kleinsten passenden Einzeltisch finden
      let assignedTableIds: string[] = [];
      let assignedTableNames: string[] = [];

      const singleTable = tables
        .filter(t => t.capacity >= party && !isTableOccupied(t.id))
        .sort((a, b) => a.capacity - b.capacity)[0];

      if (singleTable) {
        assignedTableIds = [singleTable.id];
        assignedTableNames = [singleTable.name];
      } else {
        // 2. Tischkombination versuchen
        for (const t of tables) {
          if (!t.combinable_with || t.combinable_with.length === 0) continue;
          if (isTableOccupied(t.id)) continue;
          const combinableTables = t.combinable_with
            .map(id => tables.find(tab => tab.id === id))
            .filter(Boolean) as TableRow[];
          const allFree = combinableTables.every(ct => !isTableOccupied(ct.id));
          if (!allFree) continue;
          const totalCapacity = t.capacity + combinableTables.reduce((sum, ct) => sum + ct.capacity, 0);
          if (totalCapacity >= party) {
            assignedTableIds = [t.id, ...combinableTables.map(ct => ct.id)];
            assignedTableNames = [t.name, ...combinableTables.map(ct => ct.name)];
            break;
          }
        }
      }

      // Reservierung speichern
      if (assignedTableIds.length === 0) {
        // Kein Tisch verfügbar — Pending Status
        await supabase.from("reservations").insert([{
          restaurant_id: rest.id,
          guest_name: resData.name,
          guest_phone: from,
          party_size: party,
          date: resData.date,
          time: resData.time,
          channel: "whatsapp",
          status: "pending",
          notes: "Kein passender Tisch — manuelle Prüfung",
          table_ids: [],
        }]);
        await sendWhatsApp(from, `Hallo ${resData.name}! 🙏\n\nLeider sind zu dieser Zeit keine passenden Tische frei. Unser Team prüft das und meldet sich bei dir mit Alternativen.\n\nVielen Dank für deine Geduld!`);
      } else {
        // Tisch(e) zuweisen — confirmed
        await supabase.from("reservations").insert([{
          restaurant_id: rest.id,
          guest_name: resData.name,
          guest_phone: from,
          party_size: party,
          date: resData.date,
          time: resData.time,
          table_id: assignedTableIds[0],
          table_ids: assignedTableIds,
          channel: "whatsapp",
          status: "confirmed",
        }]);
        await sendWhatsApp(from, aiMessage.replace(/RESERVATION_DATA:\s*\{[^}]+\}/i, "").trim());
      }
    } catch {
      await sendWhatsApp(from, aiMessage.replace(/RESERVATION_DATA:\s*\{[^}]+\}/i, "").trim());
    }
    return NextResponse.json({ ok: true });
  }

  await sendWhatsApp(from, aiMessage);
  return NextResponse.json({ ok: true });
}

async function sendWhatsApp(to: string, message: string) {
  await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${WA_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  });
}