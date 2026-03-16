import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET(req: Request) {
  // Sicherheits-Check — nur Vercel Cron darf aufrufen
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const format = (d: Date) => d.toISOString().split("T")[0];
  const formatTime = (d: Date) => d.toTimeString().slice(0, 5);

  let sent24h = 0;
  let sent2h = 0;

  // 24h Erinnerungen
  const { data: res24h } = await supabase
    .from("reservations")
    .select("*, restaurants(name, phone)")
    .eq("date", format(in24h))
    .eq("reminder_24h_sent", false)
    .eq("status", "confirmed")
    .not("guest_email", "is", null);

  for (const res of res24h || []) {
    try {
      await resend.emails.send({
        from: "Tablely <noreply@send.tablely.at>",
        to: res.guest_email,
        subject: `Erinnerung: Deine Reservierung morgen bei ${res.restaurants?.name}`,
        html: reminderEmail({
          guestName: res.guest_name,
          restaurantName: res.restaurants?.name || "",
          restaurantPhone: res.restaurants?.phone || "",
          date: res.date,
          time: res.time,
          partySize: res.party_size,
          hoursAhead: 24,
        }),
      });

      await supabase
        .from("reservations")
        .update({ reminder_24h_sent: true })
        .eq("id", res.id);

      sent24h++;
    } catch (e) {
      console.error("24h reminder error:", e);
    }
  }

  // 2h Erinnerungen
  const { data: res2h } = await supabase
    .from("reservations")
    .select("*, restaurants(name, phone)")
    .eq("date", format(in2h))
    .eq("reminder_2h_sent", false)
    .eq("status", "confirmed")
    .not("guest_email", "is", null);

  for (const res of res2h || []) {
    const resTime = res.time.slice(0, 5);
    const targetTime = formatTime(in2h);

    // Nur wenn Uhrzeit innerhalb 30 Minuten
    const diff = Math.abs(
      parseInt(resTime.split(":")[0]) * 60 + parseInt(resTime.split(":")[1]) -
      parseInt(targetTime.split(":")[0]) * 60 - parseInt(targetTime.split(":")[1])
    );
    if (diff > 30) continue;

    try {
      await resend.emails.send({
        from: "Tablely <noreply@send.tablely.at>",
        to: res.guest_email,
        subject: `Heute in 2 Stunden: Deine Reservierung bei ${res.restaurants?.name}`,
        html: reminderEmail({
          guestName: res.guest_name,
          restaurantName: res.restaurants?.name || "",
          restaurantPhone: res.restaurants?.phone || "",
          date: res.date,
          time: res.time,
          partySize: res.party_size,
          hoursAhead: 2,
        }),
      });

      await supabase
        .from("reservations")
        .update({ reminder_2h_sent: true })
        .eq("id", res.id);

      sent2h++;
    } catch (e) {
      console.error("2h reminder error:", e);
    }
  }

  return NextResponse.json({
    success: true,
    sent24h,
    sent2h,
    timestamp: now.toISOString(),
  });
}

function reminderEmail({ guestName, restaurantName, restaurantPhone, date, time, partySize, hoursAhead }: {
  guestName: string;
  restaurantName: string;
  restaurantPhone: string;
  date: string;
  time: string;
  partySize: number;
  hoursAhead: number;
}) {
  const dateFormatted = new Date(date).toLocaleDateString("de-AT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#F0EBE3;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE3;padding:40px 16px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

            <tr>
              <td style="background:#1A1A2E;border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
                <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#FFFAF5;">
                  table<span style="color:#FF5C35;">ly</span>
                </div>
              </td>
            </tr>

            <tr>
              <td style="background:#FFFAF5;padding:36px 40px;">
                <div style="display:inline-block;background:#FFF0EB;color:#FF5C35;font-family:sans-serif;font-size:12px;font-weight:600;padding:5px 12px;border-radius:20px;margin-bottom:20px;border:1px solid rgba(255,92,53,0.2);">
                  ${hoursAhead === 24 ? "⏰ Erinnerung — Morgen" : "⏰ Erinnerung — Heute in 2 Stunden"}
                </div>

                <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#1A1A2E;letter-spacing:-0.5px;line-height:1.2;margin:0 0 12px;">
                  Hallo ${guestName},<br/>wir freuen uns auf dich!
                </h1>

                <p style="font-family:sans-serif;font-size:15px;color:#6B6B80;line-height:1.7;margin:0 0 28px;font-weight:300;">
                  ${hoursAhead === 24
                    ? `Deine Reservierung bei <strong style="color:#1A1A2E;">${restaurantName}</strong> ist morgen.`
                    : `Deine Reservierung bei <strong style="color:#1A1A2E;">${restaurantName}</strong> ist in ca. 2 Stunden.`
                  }
                </p>

                <div style="background:#FFF0EB;border-radius:12px;padding:20px 24px;margin-bottom:28px;border:1px solid rgba(255,92,53,0.15);">
                  <div style="font-family:sans-serif;font-size:11px;font-weight:600;color:#FF5C35;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:14px;">Deine Reservierung</div>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="font-family:sans-serif;font-size:13px;color:#6B6B80;padding:5px 0;border-bottom:1px solid rgba(255,92,53,0.1);">Restaurant</td><td style="font-family:sans-serif;font-size:13px;color:#1A1A2E;font-weight:500;padding:5px 0;border-bottom:1px solid rgba(255,92,53,0.1);text-align:right;">${restaurantName}</td></tr>
                    <tr><td style="font-family:sans-serif;font-size:13px;color:#6B6B80;padding:5px 0;border-bottom:1px solid rgba(255,92,53,0.1);">Datum</td><td style="font-family:sans-serif;font-size:13px;color:#1A1A2E;font-weight:500;padding:5px 0;border-bottom:1px solid rgba(255,92,53,0.1);text-align:right;">${dateFormatted}</td></tr>
                    <tr><td style="font-family:sans-serif;font-size:13px;color:#6B6B80;padding:5px 0;border-bottom:1px solid rgba(255,92,53,0.1);">Uhrzeit</td><td style="font-family:sans-serif;font-size:13px;color:#1A1A2E;font-weight:500;padding:5px 0;border-bottom:1px solid rgba(255,92,53,0.1);text-align:right;">${time.slice(0,5)} Uhr</td></tr>
                    <tr><td style="font-family:sans-serif;font-size:13px;color:#6B6B80;padding:5px 0;">Personen</td><td style="font-family:sans-serif;font-size:13px;color:#1A1A2E;font-weight:500;padding:5px 0;text-align:right;">${partySize} ${partySize === 1 ? "Person" : "Personen"}</td></tr>
                  </table>
                </div>

                ${restaurantPhone ? `<p style="font-family:sans-serif;font-size:13px;color:#6B6B80;margin:0;">Bei Fragen erreichst du uns unter <strong style="color:#1A1A2E;">${restaurantPhone}</strong></p>` : ""}
              </td>
            </tr>

            <tr>
              <td style="background:#1A1A2E;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
                <p style="font-family:sans-serif;font-size:12px;color:rgba(255,255,255,0.35);margin:0;">
                  © 2026 Tablely · <a href="https://tablely.at" style="color:#FF5C35;text-decoration:none;">tablely.at</a>
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}