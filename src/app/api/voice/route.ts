import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Diese Route gibt Twilio das TwiML zurück, das den Anruf an den
// ConversationRelay-WebSocket (Railway Voice-Server) verbindet.
// In Twilio: Phone Number -> Voice -> "A call comes in" -> Webhook ->
//   https://www.tablely.at/api/voice  (HTTP POST)

/** Pflicht für XML-Attribute — Namen wie "Gasthof Müller & Sohn" würden das TwiML sonst zerlegen. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function POST(req: Request) {
  const wsUrl = process.env.VOICE_WS_URL; // z.B. wss://tablely-voice-production.up.railway.app

  // Restaurantname über die angerufene Nummer ermitteln, damit sich der
  // Assistent namentlich vorstellt. Schlägt das fehl, begrüßt er generisch —
  // der Anruf muss auf jeden Fall zustande kommen.
  let restaurantName = "";
  try {
    const form = await req.formData();
    const calledNumber = String(form.get("To") || "").trim();
    if (calledNumber) {
      // Client bewusst lazy im Handler (nicht top-level) — sonst bricht der Build.
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      const { data, error } = await supabase
        .from("restaurants")
        .select("name")
        .eq("twilio_phone", calledNumber)
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) {
        console.error("Restaurant zur Telefonnummer laden fehlgeschlagen:", error);
      } else if (data && data.length > 0) {
        restaurantName = data[0].name || "";
      }
    }
  } catch (e) {
    console.error("Twilio-Request konnte nicht gelesen werden:", e);
  }

  // EU AI Act Art. 50: Der Anrufer muss von der ersten Sekunde an wissen,
  // dass er mit einem digitalen Assistenten spricht.
  const welcomeGreeting = restaurantName
    ? `Grüß Gott, hier ist der digitale Telefonassistent vom ${restaurantName}. Ich helfe Ihnen gerne bei Ihrer Reservierung. Für wann möchten Sie einen Tisch?`
    : "Grüß Gott, hier ist der digitale Telefonassistent des Restaurants. Ich helfe Ihnen gerne bei Ihrer Reservierung. Für wann möchten Sie einen Tisch?";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay
      url="${wsUrl}"
      welcomeGreeting="${escapeXml(welcomeGreeting)}"
      language="de-AT"
      ttsProvider="ElevenLabs"
      voice="vTJTqNHBdjAKhdigDXCC"
      transcriptionProvider="Deepgram"
      speechModel="nova-2-general"
    />
  </Connect>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
