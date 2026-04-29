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
const MAX_AUTO_PARTY = 14;

type RestaurantRow = {
  id: string;
  name: string;
  stay_duration: number;
};

type ReservationRow = {
  table_id: string | null;
  time: string;
};

type TableRow = {
  id: string;
  capacity: number;
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

  const systemPrompt = `Du bist der Reservierungsassistent von "${rest.name}" in Österreich.
Heute ist ${todayStr} (${today.toISOString().split("T")[0]}).

Öffnungszeiten:
${hoursText}

WICHTIGE REGELN:
1. Du brauchst IMMER alle 4 Infos bevor du bestätigst: Name, Datum, Uhrzeit, Personenzahl.
2. Wenn eine Info fehlt, frage NUR nach der fehlenden Info — eine Frage pro Nachricht.
3. Nutze den bisherigen Gesprächsverlauf — vergiss nie was der Gast bereits gesagt hat.
4. Berechne den Wochentag IMMER aus dem echten Datum — nie raten.
5. Bei mehr als ${MAX_AUTO_PARTY} Personen: Leite ans Team weiter und schreibe am Ende: LARGE_GROUP:{"name":"...","date":"YYYY-MM-DD","time":"HH:MM","party_size":N}
6. Wenn du ALLE 4 Infos hast: Bestätige herzlich und schreibe am Ende: RESERVATION_DATA:{"name":"...","date":"YYYY-MM-DD","time":"HH:MM","party_size":N}
7. Antworte immer auf Deutsch, kurz und freundlich — max 3 Sätze.
8. Schreibe RESERVATION_DATA und LARGE_GROUP immer exakt so — niemals auf Deutsch.`;

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
      }]);
      // Feste Nachricht — KI bestätigt NICHT, Team meldet sich
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

      // Freien Tisch finden
      const { data: existingRes } = await supabase
        .from("reservations")
        .select("table_id, time")
        .eq("restaurant_id", rest.id)
        .eq("date", resData.date)
        .neq("status", "cancelled");

      const { data: allTables } = await supabase
        .from("tables")
        .select("id, capacity")
        .eq("restaurant_id", rest.id)
        .gte("capacity", resData.party_size)
        .order("capacity", { ascending: true });

      const reqStart = parseInt(resData.time.split(":")[0]) * 60 + parseInt(resData.time.split(":")[1]);
      const reqEnd = reqStart + stayDuration;

      const freeTable = (allTables as TableRow[] || []).find((t: TableRow) => {
        return !(existingRes as ReservationRow[] || []).some((r: ReservationRow) => {
          if (r.table_id !== t.id) return false;
          const rStart = parseInt(r.time.split(":")[0]) * 60 + parseInt(r.time.split(":")[1]);
          const rEnd = rStart + stayDuration;
          return reqStart < rEnd && reqEnd > rStart;
        });
      });

      await supabase.from("reservations").insert([{
        restaurant_id: rest.id,
        guest_name: resData.name,
        guest_phone: from,
        party_size: resData.party_size,
        date: resData.date,
        time: resData.time,
        table_id: freeTable?.id || null,
        channel: "whatsapp",
        status: "confirmed",
      }]);

      await sendWhatsApp(from, aiMessage.replace(/RESERVATION_DATA:\s*\{[^}]+\}/i, "").trim());
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