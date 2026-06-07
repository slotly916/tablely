import { NextResponse } from "next/server";

// Diese Route gibt Twilio das TwiML zurück, das den Anruf an den
// ConversationRelay-WebSocket (Railway Voice-Server) verbindet.
// In Twilio: Phone Number -> Voice -> "A call comes in" -> Webhook ->
//   https://www.tablely.at/api/voice  (HTTP POST)

export async function POST() {
  const wsUrl = process.env.VOICE_WS_URL; // z.B. wss://tablely-voice-production.up.railway.app

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay
      url="${wsUrl}"
      welcomeGreeting="Grüß Gott, schön dass Sie anrufen. Ich helfe Ihnen gerne bei Ihrer Reservierung. Für wann möchten Sie einen Tisch?"
      language="de-AT"
      ttsProvider="ElevenLabs"
      voice="ruSJRhA64v8HAqiqKXVw"
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