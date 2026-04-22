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
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  console.log("WA BODY:", JSON.stringify(body));

  // Status updates ignorieren
  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  // Nur echte eingehende Nachrichten verarbeiten
  if (!value?.messages || value.messages.length === 0) {
    console.log("No messages in payload, skipping");
    return NextResponse.json({ ok: true });
  }

  const message = value.messages[0];
  console.log("MESSAGE TYPE:", message?.type, "MESSAGE:", JSON.stringify(message));

  // Nur Text-Nachrichten verarbeiten
  if (!message || message.type !== "text") {
    console.log("Not a text message, type:", message?.type);
    return NextResponse.json({ ok: true });
  }

  const from = message.from;
  const text = message.text.body;
  const phoneNumberId = change?.value?.metadata?.phone_number_id;

  console.log("FROM:", from, "TEXT:", text, "PHONE_ID:", phoneNumberId);

  // Restaurant anhand der Phone Number ID finden
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("whatsapp_phone_id", phoneNumberId)
    .single();

  // Fallback: erstes Restaurant
  let activeRestaurant = restaurant;
  if (!activeRestaurant) {
    const { data: fallback } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    activeRestaurant = fallback;
  }

  console.log("RESTAURANT:", activeRestaurant?.name);

  if (!activeRestaurant) {
    await sendWhatsApp(from, "Entschuldigung, dieses Restaurant konnte nicht gefunden werden.");
    return NextResponse.json({ ok: true });
  }

  // Öffnungszeiten laden
  const { data: hours } = await supabase
    .from("opening_hours")
    .select("*")
    .eq("restaurant_id", activeRestaurant.id);

  const hoursText = hours?.map(h => {
    const days = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
    return h.is_closed ? `${days[h.day_of_week]}: Geschlossen` : `${days[h.day_of_week]}: ${h.open_time} - ${h.close_time}`;
  }).join(", ") || "";

  const today = new Date().toLocaleDateString("de-AT", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  console.log("Calling Groq...");

  const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Du bist der freundliche Reservierungsassistent von "${activeRestaurant.name}" in Österreich.
Heute ist ${today}.
Öffnungszeiten: ${hoursText}

Deine Aufgabe:
1. Wenn der Gast eine Reservierung möchte, frage nach: Datum, Uhrzeit, Personenzahl und Name (falls noch nicht angegeben)
2. Wenn du alle Infos hast (Datum, Uhrzeit, Personen, Name), antworte mit einem JSON-Block am Ende:
   RESERVATION_DATA:{"name":"...","date":"YYYY-MM-DD","time":"HH:MM","party_size":N}
3. Sei freundlich, kurz und auf Deutsch.
4. Prüfe ob das Restaurant an dem gewünschten Tag geöffnet ist.
5. Bestätige die Reservierung herzlich wenn du alle Daten hast.`
        },
        { role: "user", content: text }
      ],
      max_tokens: 300,
    }),
  });

  const aiData = await aiResponse.json();
  console.log("GROQ STATUS:", aiResponse.status, "DATA:", JSON.stringify(aiData));

  const aiMessage = aiData.choices?.[0]?.message?.content || "Entschuldigung, ich konnte deine Anfrage nicht verstehen. Bitte versuch es nochmal.";

  const reservationMatch = aiMessage.match(/RESERVATION_DATA:(\{[^}]+\})/);

  if (reservationMatch) {
    try {
      const resData = JSON.parse(reservationMatch[1]);
      await supabase.from("reservations").insert([{
        restaurant_id: activeRestaurant.id,
        guest_name: resData.name,
        guest_phone: from,
        party_size: resData.party_size,
        date: resData.date,
        time: resData.time,
        channel: "whatsapp",
        status: "confirmed",
      }]);
      const cleanMessage = aiMessage.replace(/RESERVATION_DATA:\{[^}]+\}/, "").trim();
      await sendWhatsApp(from, cleanMessage);
    } catch {
      await sendWhatsApp(from, aiMessage.replace(/RESERVATION_DATA:\{[^}]+\}/, "").trim());
    }
  } else {
    await sendWhatsApp(from, aiMessage);
  }

  return NextResponse.json({ ok: true });
}

async function sendWhatsApp(to: string, message: string) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
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
  console.log("WA SEND STATUS:", res.status);
}