import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { name, restaurant, email } = await req.json();

    if (!name || !restaurant || !email) {
      return NextResponse.json(
        { error: "Bitte alle Felder ausfüllen." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("waitlist")
      .insert([{ name, restaurant, email }]);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Fehler beim Speichern." },
        { status: 500 }
      );
    }

    // Mail an dich (Benachrichtigung)
    await resend.emails.send({
      from: "Tablely <noreply@send.tablely.at>",
      to: process.env.NOTIFY_EMAIL!,
      subject: `🍽️ Neue Warteliste Anmeldung — ${restaurant}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #FFFAF5; border-radius: 12px;">
          <h2 style="color: #1A1A2E; font-size: 20px; margin-bottom: 24px;">Neue Anmeldung auf der Tablely Warteliste</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #6B6B80; font-size: 14px; border-bottom: 1px solid #F0EBE3;">Name</td>
              <td style="padding: 10px 0; color: #1A1A2E; font-size: 14px; font-weight: 600; border-bottom: 1px solid #F0EBE3;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6B6B80; font-size: 14px; border-bottom: 1px solid #F0EBE3;">Restaurant</td>
              <td style="padding: 10px 0; color: #1A1A2E; font-size: 14px; font-weight: 600; border-bottom: 1px solid #F0EBE3;">${restaurant}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6B6B80; font-size: 14px;">E-Mail</td>
              <td style="padding: 10px 0; color: #FF5C35; font-size: 14px; font-weight: 600;">${email}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; font-size: 13px; color: #6B6B80;">Tablely · tablely.at</p>
        </div>
      `,
    });

    // Bestätigungsmail an den Nutzer
    await resend.emails.send({
      from: "Tablely <noreply@send.tablely.at>",
      to: email,
      subject: "Du bist auf der Warteliste 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#F0EBE3;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE3;padding:40px 16px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

                  <!-- HEADER -->
                  <tr>
                    <td style="background:#1A1A2E;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
                      <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#FFFAF5;letter-spacing:-0.5px;">
                        table<span style="color:#FF5C35;">ly</span>
                      </div>
                      <div style="margin-top:8px;font-family:sans-serif;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:1px;text-transform:uppercase;">tablely.at</div>
                    </td>
                  </tr>

                  <!-- BODY -->
                  <tr>
                    <td style="background:#FFFAF5;padding:40px 40px 32px;">

                      <!-- Badge -->
                      <div style="display:inline-block;background:#FFF0EB;color:#FF5C35;font-family:sans-serif;font-size:12px;font-weight:600;padding:6px 14px;border-radius:20px;margin-bottom:24px;border:1px solid rgba(255,92,53,0.2);">
                        ✓ Warteliste bestätigt
                      </div>

                      <h1 style="font-family:Georgia,serif;font-size:30px;font-weight:700;color:#1A1A2E;letter-spacing:-0.5px;line-height:1.2;margin:0 0 16px;">
                        Hallo ${name},<br>du bist dabei!
                      </h1>

                      <p style="font-family:sans-serif;font-size:16px;color:#6B6B80;line-height:1.7;margin:0 0 24px;font-weight:300;">
                        Wir haben dich und <strong style="color:#1A1A2E;font-weight:500;">${restaurant}</strong> erfolgreich auf der Tablely Warteliste eingetragen.
                      </p>

                      <p style="font-family:sans-serif;font-size:16px;color:#6B6B80;line-height:1.7;margin:0 0 32px;font-weight:300;">
                        Sobald Tablely für den Test bereit ist, melden wir uns persönlich bei dir — mit allem was du brauchst um direkt loszulegen.
                      </p>

                      <!-- Info Box -->
                      <div style="background:#FFF0EB;border-radius:12px;padding:20px 24px;margin-bottom:32px;border:1px solid rgba(255,92,53,0.15);">
                        <div style="font-family:sans-serif;font-size:11px;font-weight:600;color:#FF5C35;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:14px;">Deine Anmeldung</div>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-family:sans-serif;font-size:13px;color:#6B6B80;padding:5px 0;border-bottom:1px solid rgba(255,92,53,0.1);">Name</td>
                            <td style="font-family:sans-serif;font-size:13px;color:#1A1A2E;font-weight:500;padding:5px 0;border-bottom:1px solid rgba(255,92,53,0.1);text-align:right;">${name}</td>
                          </tr>
                          <tr>
                            <td style="font-family:sans-serif;font-size:13px;color:#6B6B80;padding:5px 0;border-bottom:1px solid rgba(255,92,53,0.1);">Restaurant</td>
                            <td style="font-family:sans-serif;font-size:13px;color:#1A1A2E;font-weight:500;padding:5px 0;border-bottom:1px solid rgba(255,92,53,0.1);text-align:right;">${restaurant}</td>
                          </tr>
                          <tr>
                            <td style="font-family:sans-serif;font-size:13px;color:#6B6B80;padding:5px 0;">E-Mail</td>
                            <td style="font-family:sans-serif;font-size:13px;color:#FF5C35;font-weight:500;padding:5px 0;text-align:right;">${email}</td>
                          </tr>
                        </table>
                      </div>

                      <!-- Was dich erwartet -->
                      <div style="margin-bottom:32px;">
                        <div style="font-family:sans-serif;font-size:13px;font-weight:600;color:#1A1A2E;margin-bottom:14px;">Was dich erwartet:</div>
                        ${[
                          ['WhatsApp KI', 'Gäste buchen automatisch per WhatsApp'],
                          ['KI Telefon', 'Kein Anruf geht mehr verloren'],
                          ['Online Buchung', 'Reservierungen rund um die Uhr'],
                          ['Automatische Erinnerungen', 'No-Shows sinken auf nahezu null'],
                        ].map(([title, desc]) => `
                          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
                            <div style="width:20px;height:20px;border-radius:50%;background:#FFF0EB;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">
                              <div style="width:6px;height:6px;border-radius:50%;background:#FF5C35;"></div>
                            </div>
                            <div>
                              <span style="font-family:sans-serif;font-size:13px;font-weight:500;color:#1A1A2E;">${title}</span>
                              <span style="font-family:sans-serif;font-size:13px;color:#6B6B80;"> — ${desc}</span>
                            </div>
                          </div>
                        `).join('')}
                      </div>

                      <p style="font-family:sans-serif;font-size:15px;color:#1A1A2E;margin:0 0 4px;font-weight:500;">Bis bald,</p>
                      <p style="font-family:Georgia,serif;font-size:17px;color:#FF5C35;margin:0;font-weight:600;">Michael — Gründer von Tablely</p>
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background:#1A1A2E;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
                      <p style="font-family:sans-serif;font-size:12px;color:rgba(255,255,255,0.35);margin:0;">
                        © 2026 Tablely · <a href="https://tablely.at" style="color:#FF5C35;text-decoration:none;">tablely.at</a> · Ein Produkt aus Österreich
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Unbekannter Fehler." },
      { status: 500 }
    );
  }
}