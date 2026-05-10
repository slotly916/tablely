import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, name, restaurantName } = await req.json();

  await resend.emails.send({
    from: "Tablely <noreply@send.tablely.at>",
    to: email,
    subject: `Willkommen bei Tablely, ${name}!`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:700;color:#1A1A2E;font-family:Georgia,serif;">table<span style="color:#FF5C35;">ly</span></span>
    </div>
    <div style="background:#fff;border-radius:20px;padding:40px;border:1px solid #F0EBE3;">
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1A1A2E;margin:0 0 8px;letter-spacing:-0.5px;">Willkommen, ${name}!</h1>
      <p style="font-size:15px;color:#6B6B80;margin:0 0 28px;line-height:1.6;font-weight:300;">${restaurantName} ist jetzt bei Tablely. Deine 30-tägige Testphase hat begonnen.</p>
      <div style="background:#F5F0EB;border-radius:12px;padding:16px 20px;margin-bottom:28px;border:1px solid #F0EBE3;">
        <div style="font-size:11px;font-weight:600;color:#FF5C35;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Dein Testpaket</div>
        <div style="font-size:20px;font-weight:700;color:#1A1A2E;margin-bottom:4px;">30 Tage kostenlos</div>
        <div style="font-size:13px;color:#6B6B80;">Alle Funktionen freigeschaltet — außer KI Telefon</div>
      </div>
      <div style="margin-bottom:28px;">
        <div style="padding:8px 0;border-bottom:1px solid #F5F0EB;font-size:14px;color:#1A1A2E;">✓ Online Buchungsseite</div>
        <div style="padding:8px 0;border-bottom:1px solid #F5F0EB;font-size:14px;color:#1A1A2E;">✓ WhatsApp KI</div>
        <div style="padding:8px 0;border-bottom:1px solid #F5F0EB;font-size:14px;color:#1A1A2E;">✓ Automatische Erinnerungen</div>
        <div style="padding:8px 0;border-bottom:1px solid #F5F0EB;font-size:14px;color:#1A1A2E;">✓ Dashboard & Tischverwaltung</div>
        <div style="padding:8px 0;font-size:14px;color:#1A1A2E;">✓ Walk-in Assistent</div>
      </div>
      <a href="https://www.tablely.at/dashboard" style="display:block;background:#FF5C35;color:#fff;text-align:center;padding:14px;border-radius:10px;font-size:15px;font-weight:500;text-decoration:none;margin-bottom:20px;">Zum Dashboard →</a>
      <p style="font-size:12px;color:#6B6B80;text-align:center;margin:0;line-height:1.6;">Nach der Testphase kannst du zwischen verschiedenen Paketen wählen.<br/>Als einer der ersten 10 Restaurants bekommst du dauerhaft <strong>10% Rabatt</strong>.</p>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:12px;color:#6B6B80;margin:0;">© 2026 Tablely · Michael Kleinlercher e.U.</p>
    </div>
  </div>
</body>
</html>`,
  });

  return NextResponse.json({ ok: true });
}