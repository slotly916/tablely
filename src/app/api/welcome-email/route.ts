import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, name, restaurantName } = await req.json();

  await resend.emails.send({
    from: "Butlery <noreply@send.tablely.at>",
    to: email,
    subject: `Glückwunsch ${name} — du bist dabei!`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:700;color:#1A1A2E;font-family:Georgia,serif;">Butlery</span>
    </div>
    <div style="background:#fff;border-radius:20px;padding:40px;border:1px solid #F0EBE3;">
      <div style="display:inline-block;background:rgba(255,92,53,0.1);border-radius:100px;padding:5px 14px;margin-bottom:18px;">
        <span style="font-size:11px;font-weight:700;color:#FF5C35;text-transform:uppercase;letter-spacing:1px;">Pilotprogramm · einer von 3</span>
      </div>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1A1A2E;margin:0 0 12px;letter-spacing:-0.5px;">Glückwunsch, ${name}!</h1>
      <p style="font-size:15px;color:#6B6B80;margin:0 0 28px;line-height:1.7;font-weight:300;">Du hast die Chance ergattert: ${restaurantName} gehört zu den ersten 3 Restaurants im Butlery-Pilotprogramm. Das bedeutet 3 Monate komplett kostenlos — und ich kümmere mich persönlich um deine Einrichtung.</p>
      <div style="background:#1A1A2E;border-radius:14px;padding:24px;margin-bottom:28px;">
        <div style="font-size:11px;font-weight:600;color:#FF5C35;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Dein Pilot-Paket</div>
        <div style="font-size:24px;font-weight:700;color:#FFFAF5;margin-bottom:6px;font-family:Georgia,serif;">3 Monate kostenlos</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;">Alle Funktionen freigeschaltet — außer KI Telefon. Plus persönliche Betreuung und Einrichtung österreichweit, direkt von mir.</div>
      </div>
      <div style="margin-bottom:28px;">
        <div style="padding:9px 0;border-bottom:1px solid #F5F0EB;font-size:14px;color:#1A1A2E;">✓ Online Buchungsseite</div>
        <div style="padding:9px 0;border-bottom:1px solid #F5F0EB;font-size:14px;color:#1A1A2E;">✓ WhatsApp KI</div>
        <div style="padding:9px 0;border-bottom:1px solid #F5F0EB;font-size:14px;color:#1A1A2E;">✓ Automatische Erinnerungen</div>
        <div style="padding:9px 0;border-bottom:1px solid #F5F0EB;font-size:14px;color:#1A1A2E;">✓ Dashboard & Tischverwaltung</div>
        <div style="padding:9px 0;font-size:14px;color:#1A1A2E;">✓ Walk-in Assistent</div>
      </div>
      <a href="https://www.tablely.at/dashboard" style="display:block;background:#FF5C35;color:#fff;text-align:center;padding:15px;border-radius:100px;font-size:15px;font-weight:500;text-decoration:none;margin-bottom:24px;">Zum Dashboard →</a>
      <div style="background:#F5F0EB;border-radius:12px;padding:18px 20px;">
        <div style="font-size:13px;font-weight:600;color:#1A1A2E;margin-bottom:6px;">Wie es weitergeht</div>
        <p style="font-size:13px;color:#6B6B80;margin:0;line-height:1.7;font-weight:300;">Ich melde mich persönlich bei dir, um alles für ${restaurantName} einzurichten — Tische, Öffnungszeiten, deine WhatsApp-Nummer. Du musst dich um nichts kümmern. Bei Fragen einfach direkt auf diese Mail antworten.</p>
      </div>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:12px;color:#6B6B80;margin:0 0 4px;">Michael Kleinlercher · Gründer von Butlery</p>
      <p style="font-size:12px;color:#6B6B80;margin:0;">© 2026 Butlery · Michael Kleinlercher e.U.</p>
    </div>
  </div>
</body>
</html>`,
  });

  return NextResponse.json({ ok: true });
}