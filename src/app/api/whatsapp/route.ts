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

// ===== KI-KENNZEICHNUNG (EU AI Act Art. 50 Abs. 1) =====
// Wer mit diesem Dienst schreibt, muss bei der ERSTEN Interaktion erfahren,
// dass er mit einem KI-System schreibt. Die Pflicht darf nicht davon abhaengen,
// ob das Sprachmodell eine Prompt-Regel befolgt oder welchen Antwortpfad der
// Gast zufaellig trifft — deshalb laeuft JEDE ausgehende Nachricht durch reply()
// bzw. traegt den generischen Hinweis.

// Erkennt, ob eine Nachricht die Kennzeichnung bereits enthaelt (dann wird sie
// nicht doppelt vorangestellt). \S* deckt Zusammensetzungen wie
// "digitaler Reservierungsassistent" mit ab.
const SELF_ID = /digitale[rn]?\s+\S*assistent|künstliche[rn]?\s+intelligenz|\bKI\b/i;

// Fuer Antworten, die faellig werden bevor (oder weil) das Restaurant nicht
// geladen werden konnte. Ohne Namen, weil es keinen gibt.
const GENERIC_DISCLOSURE = "Hallo, ich bin ein digitaler Reservierungsassistent.";

// Meldet sich ein Gast nach dieser Zeit wieder, beginnt praktisch eine neue
// Unterhaltung und bekommt die Kennzeichnung erneut.
const RE_DISCLOSE_AFTER_HOURS = 24;

type RestaurantRow = {
  id: string;
  name: string;
  stay_duration: number;
  large_group_threshold: number;
  allow_pets: boolean | null;
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

  // Restaurant finden. PGRST116 = kein Treffer (erwartbar, dann Fallback);
  // jeder andere Fehler ist eine Stoerung und muss dem Gast gesagt werden,
  // damit er nicht glaubt seine Nachricht sei angekommen.
  const { data: restaurant0, error: restErr } = await supabase
    .from("restaurants").select("*").eq("whatsapp_phone_id", phoneNumberId).single();

  if (restErr && restErr.code !== "PGRST116") {
    console.error("Restaurant laden fehlgeschlagen:", restErr);
    await sendWhatsApp(from, `${GENERIC_DISCLOSURE}\n\nEntschuldigung, bei uns gibt es gerade eine technische Störung. Bitte versuch es in ein paar Minuten nochmal oder ruf uns direkt an.`);
    return NextResponse.json({ ok: true });
  }

  let restaurant = restaurant0;

  if (!restaurant) {
    const { data: fallback, error: fbErr } = await supabase
      .from("restaurants").select("*").order("created_at", { ascending: true }).limit(1).single();
    if (fbErr && fbErr.code !== "PGRST116") {
      console.error("Fallback-Restaurant laden fehlgeschlagen:", fbErr);
      await sendWhatsApp(from, `${GENERIC_DISCLOSURE}\n\nEntschuldigung, bei uns gibt es gerade eine technische Störung. Bitte versuch es in ein paar Minuten nochmal oder ruf uns direkt an.`);
      return NextResponse.json({ ok: true });
    }
    restaurant = fallback;
  }

  if (!restaurant) {
    await sendWhatsApp(from, `${GENERIC_DISCLOSURE}\n\nEntschuldigung, dieses Restaurant konnte nicht gefunden werden.`);
    return NextResponse.json({ ok: true });
  }

  const rest = restaurant as RestaurantRow;
  const largeGroupThreshold = rest.large_group_threshold || 15;

  // Konversationshistorie laden. Fehlt sie (PGRST116) ist das der normale Fall
  // beim ersten Kontakt. Bei einem echten Fehler machen wir ohne Historie weiter,
  // statt das Gespraech abzubrechen — der Gast merkt nur dass nachgefragt wird.
  const { data: conv, error: convErr } = await supabase
    .from("whatsapp_conversations")
    .select("*").eq("phone", from).eq("restaurant_id", rest.id).single();

  if (convErr && convErr.code !== "PGRST116") {
    console.error("Konversation laden fehlgeschlagen:", convErr);
  }

  const history: { role: string; content: string }[] = conv?.messages || [];

  // Neue Konversation = noch keine Historie zu dieser Nummer, oder der letzte
  // Kontakt liegt laenger als RE_DISCLOSE_AFTER_HOURS zurueck. Steuert die
  // KI-Kennzeichnung nach EU AI Act Art. 50. Fehlt der Zeitstempel, entscheidet
  // allein die Historie (NaN-Vergleich ist false, also kein Fehlalarm).
  const lastContact: string | null = conv?.updated_at || conv?.created_at || null;
  const hoursSinceLastContact = lastContact
    ? (Date.now() - new Date(lastContact).getTime()) / 3_600_000
    : 0;
  const isNewConversation = history.length === 0 || hoursSinceLastContact > RE_DISCLOSE_AFTER_HOURS;

  const AI_DISCLOSURE = `Hallo, ich bin der digitale Assistent von ${rest.name}.`;

  // EINZIGE Ausgangstuer fuer Nachrichten an den Gast ab hier. Bei der ersten
  // Interaktion traegt jede davon die Kennzeichnung — auch die fest verdrahteten
  // Bestaetigungs- und Fehlertexte weiter unten, die aiMessage gar nicht senden.
  // Hat das Modell sich schon selbst vorgestellt, erkennt SELF_ID das und der
  // Hinweis wird nicht doppelt gesetzt.
  async function reply(msg: string) {
    const out = isNewConversation && !SELF_ID.test(msg)
      ? `${AI_DISCLOSURE}\n\n${msg}`
      : msg;
    await sendWhatsApp(from, out);
  }

  // Öffnungszeiten
  const { data: hours, error: hoursErr } = await supabase
    .from("opening_hours").select("*").eq("restaurant_id", rest.id);

  if (hoursErr) {
    console.error("Öffnungszeiten laden fehlgeschlagen:", hoursErr);
    await reply("Entschuldigung, ich kann gerade nicht auf unsere Öffnungszeiten zugreifen. Bitte versuch es in ein paar Minuten nochmal oder ruf uns direkt an.");
    return NextResponse.json({ ok: true });
  }

  const hoursText = (hours || []).map((h: { is_closed: boolean; day_of_week: number; open_time: string; close_time: string }) => {
    const days = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
    return h.is_closed
      ? `${days[h.day_of_week]}: Geschlossen`
      : `${days[h.day_of_week]}: ${h.open_time} - ${h.close_time}`;
  }).join("\n") || "Keine Öffnungszeiten hinterlegt";

  const today = new Date();
  const todayStr = today.toLocaleDateString("de-AT", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  const petsText = rest.allow_pets
    ? "Haustiere erlaubt: ja — Gäste dürfen ihren Hund oder ein anderes Haustier mitbringen. Sag das freundlich zu, wenn jemand danach fragt."
    : "Haustiere erlaubt: nein — Haustiere können leider nicht mitgebracht werden (Assistenzhunde ausgenommen, das klärt das Team persönlich). Sag das höflich, wenn jemand danach fragt.";

  const systemPrompt = `Du bist der freundliche Reservierungsassistent von "${rest.name}" in Österreich.
Heute ist ${todayStr} (${today.toISOString().split("T")[0]}).

Öffnungszeiten:
${hoursText}

Haus-Info:
${petsText}

DEINE AUFGABE:
Du sammelst alle 4 wichtigen Infos vom Gast: Name, Datum, Uhrzeit, Personenzahl.
Verstehe auch unklare oder unvollständige Nachrichten und frage höflich nach was fehlt.
Du kannst auch bestehende Reservierungen STORNIEREN.

VERSTÄNDNIS-REGELN:
- Wenn jemand "morgen", "übermorgen", "Samstag" schreibt — rechne das in ein konkretes Datum um.
- Wenn jemand "abends", "zum Mittagessen", "spät" schreibt — frag nach der genauen Uhrzeit.
- Wenn jemand "für uns", "zu zweit", "mit der Familie" schreibt — frag wie viele Personen genau.
- Wenn jemand undeutlich schreibt oder Tippfehler hat — versuche es zu verstehen, frag im Zweifel nach.
- Wenn jemand "Hallo" oder ähnlich schreibt — begrüße zurück und frage was er möchte.

STORNIERUNG ERKENNEN:
- Wenn der Gast seine Reservierung absagen/stornieren/canceln will (z.B. "ich muss leider absagen", "bitte stornieren", "wir können doch nicht kommen", "Reservierung löschen") — bestätige freundlich dass du die Reservierung stornierst.
- Schreibe in diesem Fall am Ende NUR: CANCEL_RESERVATION:{"confirm":true}
- Frage NICHT nach Details — wir finden die Reservierung über die Telefonnummer automatisch.

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
5. Schreibe RESERVATION_DATA, LARGE_GROUP und CANCEL_RESERVATION immer exakt so — niemals auf Deutsch übersetzen.
6. Antworte NIE mit einer leeren Nachricht: schreibe immer auch einen Satz für den Gast, nicht nur den Marker.

KI-KENNZEICHNUNG (EU AI Act Art. 50 — verpflichtend):
${isNewConversation
  ? `- Das hier ist die ERSTE Nachricht dieser Unterhaltung. Beginne deine Antwort mit genau diesem Satz: "${AI_DISCLOSURE}" Danach gehst du normal auf das Anliegen ein.`
  : `- Du hast dich in dieser Unterhaltung bereits als digitaler Assistent vorgestellt. Stelle dich NICHT erneut vor.`}
- Gib dich niemals als Mensch aus. Fragt der Gast, ob er mit einem Menschen oder einer KI schreibt, sage ehrlich, dass du ein digitaler Assistent bist und das Restaurant persönlich erreichbar ist.`;

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

  // History bewusst OHNE vorangestellte Kennzeichnung speichern: sie ist reiner
  // Modell-Output. Die Kennzeichnung setzt reply() beim Senden, damit die
  // Leerprüfungen der Marker-Pfade unten nicht den Hinweis für Inhalt halten.
  const newHistory = [
    ...history,
    { role: "user", content: text },
    { role: "assistant", content: aiMessage }
  ].slice(-20);

  // Historie ist nur Gedaechtnis — schlaegt das Speichern fehl, laeuft die
  // Buchung trotzdem weiter. Nur loggen, den Gast nicht damit behelligen.
  // updated_at auch beim Insert setzen, sonst fehlt der Zeitstempel, an dem
  // die erneute Kennzeichnung nach 24h haengt.
  const { error: histErr } = conv
    ? await supabase.from("whatsapp_conversations")
        .update({ messages: newHistory, updated_at: new Date().toISOString() })
        .eq("id", conv.id)
    : await supabase.from("whatsapp_conversations")
        .insert([{ phone: from, restaurant_id: rest.id, messages: newHistory, updated_at: new Date().toISOString() }]);

  if (histErr) console.error("Konversation speichern fehlgeschlagen:", histErr);

  // ===== STORNIERUNG =====
  const cancelMatch = aiMessage.match(/CANCEL_RESERVATION:\s*(\{[^}]*\})/i);
  if (cancelMatch) {
    // Letzte aktive (nicht stornierte) Reservierung dieser Telefonnummer suchen
    const { data: activeRes, error: findErr } = await supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", rest.id)
      .eq("guest_phone", from)
      .neq("status", "cancelled")
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(1);

    // Kritisch: bei einem Fehler NICHT "keine Reservierung gefunden" sagen —
    // der Gast wuerde denken er sei storniert bzw. habe nie gebucht.
    if (findErr) {
      console.error("Reservierung zum Stornieren suchen fehlgeschlagen:", findErr);
      await reply("Entschuldigung, ich kann deine Reservierung gerade nicht abrufen. Deine Reservierung besteht weiterhin. Bitte ruf uns kurz an damit wir die Stornierung sicher erledigen.");
      return NextResponse.json({ ok: true });
    }

    const target = activeRes && activeRes.length > 0 ? activeRes[0] : null;

    if (target) {
      // Status auf cancelled setzen -> löst Dashboard-Popup aus (channel=whatsapp)
      const { error: cancelErr } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", target.id);

      if (cancelErr) {
        console.error("Stornieren fehlgeschlagen:", cancelErr);
        await reply("Entschuldigung, die Stornierung hat gerade nicht geklappt — deine Reservierung besteht also weiterhin. Bitte ruf uns kurz an, dann erledigen wir das sofort für dich.");
        return NextResponse.json({ ok: true });
      }

      const cleanMsg = aiMessage.replace(/CANCEL_RESERVATION:\s*\{[^}]*\}/i, "").trim();
      await reply(cleanMsg || `Deine Reservierung wurde storniert. Schade dass es diesmal nicht klappt — wir freuen uns auf deinen nächsten Besuch!`);
    } else {
      const cleanMsg = aiMessage.replace(/CANCEL_RESERVATION:\s*\{[^}]*\}/i, "").trim();
      await reply(cleanMsg || `Ich konnte leider keine aktive Reservierung unter dieser Nummer finden. Falls du mit einer anderen Nummer gebucht hast, melde dich bitte direkt bei uns.`);
    }
    return NextResponse.json({ ok: true });
  }

  // Große Gruppe
  const largeGroupMatch = aiMessage.match(/LARGE_GROUP:\s*(\{[^}]+\})/i);
  if (largeGroupMatch) {
    try {
      const resData = JSON.parse(largeGroupMatch[1]);
      const { error: insErr } = await supabase.from("reservations").insert([{
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
      if (insErr) {
        console.error("Großgruppen-Anfrage speichern fehlgeschlagen:", insErr);
        await reply("Entschuldigung, deine Anfrage konnte gerade nicht gespeichert werden. Bitte ruf uns kurz an oder versuch es in ein paar Minuten nochmal — sonst geht deine Anfrage verloren.");
        return NextResponse.json({ ok: true });
      }
      await reply(`Vielen Dank für deine Anfrage, ${resData.name}! 🙏\n\nFür Gruppen ab ${resData.party_size} Personen meldet sich unser Team persönlich bei dir — wir prüfen die Verfügbarkeit und bestätigen deinen Wunschtermin so schnell wie möglich.\n\nWir freuen uns auf euch! 🍽️`);
    } catch (e) {
      console.error("Großgruppen-Anfrage verarbeiten fehlgeschlagen:", e);
      await reply("Entschuldigung, deine Anfrage konnte gerade nicht gespeichert werden. Bitte ruf uns kurz an oder versuch es in ein paar Minuten nochmal — sonst geht deine Anfrage verloren.");
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

      // Alle Reservierungen für das Datum laden.
      // Ohne diese Daten duerfen wir KEINEN Tisch vergeben — sonst Doppelbuchung.
      const { data: existingRes, error: exErr } = await supabase
        .from("reservations")
        .select("table_id, table_ids, time")
        .eq("restaurant_id", rest.id)
        .eq("date", resData.date)
        .neq("status", "cancelled");

      if (exErr) {
        console.error("Belegung laden fehlgeschlagen:", exErr);
        await reply("Entschuldigung, ich kann die Tischverfügbarkeit gerade nicht prüfen. Bitte versuch es in ein paar Minuten nochmal oder ruf uns direkt an.");
        return NextResponse.json({ ok: true });
      }

      // Alle Tische laden mit combinable_with
      const { data: allTables, error: tblErr } = await supabase
        .from("tables")
        .select("id, name, capacity, combinable_with")
        .eq("restaurant_id", rest.id);

      if (tblErr) {
        console.error("Tische laden fehlgeschlagen:", tblErr);
        await reply("Entschuldigung, ich kann die Tischverfügbarkeit gerade nicht prüfen. Bitte versuch es in ein paar Minuten nochmal oder ruf uns direkt an.");
        return NextResponse.json({ ok: true });
      }

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
        const { error: pendErr } = await supabase.from("reservations").insert([{
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
        if (pendErr) {
          console.error("Pending-Reservierung speichern fehlgeschlagen:", pendErr);
          await reply("Entschuldigung, deine Anfrage konnte gerade nicht gespeichert werden. Bitte ruf uns kurz an oder versuch es in ein paar Minuten nochmal — sonst geht deine Anfrage verloren.");
          return NextResponse.json({ ok: true });
        }
        await reply(`Hallo ${resData.name}! 🙏\n\nLeider sind zu dieser Zeit keine passenden Tische frei. Unser Team prüft das und meldet sich bei dir mit Alternativen.\n\nVielen Dank für deine Geduld!`);
      } else {
        // Tisch(e) zuweisen — confirmed
        const { error: confErr } = await supabase.from("reservations").insert([{
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
        // Niemals die KI-Bestaetigung senden wenn nichts gespeichert wurde —
        // der Gast wuerde ohne Reservierung vor der Tuer stehen.
        if (confErr) {
          console.error("Reservierung speichern fehlgeschlagen:", confErr);
          await reply("Entschuldigung, deine Reservierung konnte gerade nicht gespeichert werden — sie ist also noch NICHT bestätigt. Bitte ruf uns kurz an oder versuch es in ein paar Minuten nochmal.");
          return NextResponse.json({ ok: true });
        }
        // Fallback, falls das Modell nur den Marker und keinen Satz geschrieben
        // hat: eine leere WhatsApp-Nachricht wird von der API abgelehnt, der
        // Gast bekaeme trotz gespeicherter Buchung gar nichts.
        const cleanMsg = aiMessage.replace(/RESERVATION_DATA:\s*\{[^}]+\}/i, "").trim();
        await reply(cleanMsg || `Deine Reservierung ist bestätigt: ${resData.date} um ${resData.time} Uhr für ${party} Personen. Wir freuen uns auf dich!`);
      }
    } catch (e) {
      // Vorher wurde hier die KI-Bestaetigung gesendet — obwohl gar nichts
      // gespeichert war. Der Gast muss wissen dass die Buchung offen ist.
      console.error("Reservierung verarbeiten fehlgeschlagen:", e);
      await reply("Entschuldigung, bei der Reservierung ist etwas schiefgelaufen — sie ist noch NICHT bestätigt. Bitte ruf uns kurz an oder versuch es in ein paar Minuten nochmal.");
    }
    return NextResponse.json({ ok: true });
  }

  await reply(aiMessage);
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
