import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
const WA_TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const GROQ_KEY = process.env.GROQ_API_KEY!;

const MAX_AUTO_PARTY = 14; // Ab 15 Personen → manuelle Prüfung

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

  const from = message.from;
  const text = message.text.body;
  const phoneNumberId = change?.value?.metadata?.phone_number_id;

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

  // Konversationshistorie laden
  let { data: conv } = await supabase
    .from("whatsapp_conversations")
    .select("*").eq("phone", from).eq("restaurant_id", restaurant.id).single();

  const history: {role: string, content: string}[] = conv?.messages || [];

  // Öffnungszeiten
  const { data: hours } = await supabase
    .from("opening_hours").select("*").eq("restaurant_id", restaurant.id);

  const hoursText = hours?.map(h => {
    const days = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
    return h.is_closed ? `${days[h.day_of_week]}: Geschlossen` : `${days[h.day_of_week]}: ${h.open_time} - ${h.close_time}`;
  }).join("\n") || "Keine Öffnungszeiten hinterlegt";

  const today = new Date();
  const todayStr = today.toLocaleDateString("de-AT", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  // System Prompt
  const systemPrompt = `Du bist der Reservierungsassistent von "${restaurant.name}" in Österreich.
Heute ist ${todayStr} (${today.toISOString().split("T")[0]}).

Öffnungszeiten:
${hoursText}

REGELN:
1. Sammle alle nötigen Infos: Name, Datum, Uhrzeit, Personenzahl.
2. Berechne den Wochentag immer aus dem echten Datum — nie raten.
3. Bei mehr als ${MAX_AUTO_PARTY} Personen: Sage dem Gast dass du die Anfrage ans Team weiterleitest und sie sich melden werden. Schreibe dann am Ende: LARGE_GROUP:{"name":"...","date":"YYYY-MM-DD","time":"HH:MM","party_size":N}
4. Wenn du alle Infos für eine normale Gruppe hast: Bestätige herzlich und schreibe am Ende: RESERVATION_DATA:{"name":"...","date":"YYYY-MM-DD","time":"HH:MM","party_size":N}
5. Antworte immer auf Deutsch, kurz und freundlich.
6. Die JSON-Blöcke IMMER auf Englisch und in dieser exakten Form.
7. Du hast Zugriff auf den bisherigen Gesprächsverlauf — nutze ihn.`;

  // KI aufrufen mit History
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
  const aiMessage = aiData.choices?.[0]?.message?.content || "Entschuldigung, bitte versuch es nochmal.";

  // History aktualisieren
  const newHistory = [
    ...history,
    { role: "user", content: text },
    { role: "assistant", content: aiMessage }
  ].slice(-20); // Max 20 Nachrichten speichern

  if (conv) {
    await supabase.from("whatsapp_conversations")
      .update({ messages: newHistory, updated_at: new Date().toISOString() })
      .eq("id", conv.id);
  } else {
    await supabase.from("whatsapp_conversations")
      .insert([{ phone: from, restaurant_id: restaurant.id, messages: newHistory }]);
  }

  // Große Gruppe prüfen
  const largeGroupMatch = aiMessage.match(/LARGE_GROUP:\s*(\{[^}]+\})/i);
  if (largeGroupMatch) {
    try {
      const resData = JSON.parse(largeGroupMatch[1]);
      await supabase.from("reservations").insert([{
        restaurant_id: restaurant.id,
        guest_name: resData.name,
        guest_phone: from,
        party_size: resData.party_size,
        date: resData.date,
        time: resData.time,
        channel: "whatsapp",
        status: "pending", // Muss manuell bestätigt werden
        notes: `Großgruppe — manuelle Prüfung erforderlich`,
      }]);
      const cleanMsg = aiMessage.replace(/LARGE_GROUP:\s*\{[^}]+\}/i, "").trim();
      await sendWhatsApp(from, cleanMsg);
    } catch {
      await sendWhatsApp(from, aiMessage.replace(/LARGE_GROUP:\s*\{[^}]+\}/i, "").trim());
    }
    return NextResponse.json({ ok: true });
  }

  // Normale Reservierung
  const reservationMatch = aiMessage.match(/RESERVATION_DATA:\s*(\{[^}]+\})/i);
  if (reservationMatch) {
    try {
      const resData = JSON.parse(reservationMatch[1]);
      await supabase.from("reservations").insert([{
        restaurant_id: restaurant.id,
        guest_name: resData.name,
        guest_phone: from,
        party_size: resData.party_size,
        date: resData.date,
        time: resData.time,
        channel: "whatsapp",
        status: "confirmed",
      }]);
      const cleanMsg = aiMessage.replace(/RESERVATION_DATA:\s*\{[^}]+\}/i, "").trim();
      await sendWhatsApp(from, cleanMsg);
    } catch {
      await sendWhatsApp(from, aiMessage.replace(/RESERVATION_DATA:\s*\{[^}]+\}/i, "").trim());
    }
    return NextResponse.json({ ok: true });
  }

  // Normale Antwort
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