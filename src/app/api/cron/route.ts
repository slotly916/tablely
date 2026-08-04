import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET(req: Request) {
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
  let sentFeedback = 0;
  // Fehler werden gesammelt und im Response zurueckgegeben, damit ein stiller
  // Ausfall der Erinnerungen im Vercel-Cron-Log sichtbar wird.
  const errors: string[] = [];

  // 24h Erinnerungen
  const { data: res24h, error: err24h } = await supabase
    .from("reservations")
    .select("*, restaurants(name, phone)")
    .eq("date", format(in24h))
    .eq("reminder_24h_sent", false)
    .eq("status", "confirmed")
    .not("guest_email", "is", null);

  if (err24h) {
    console.error("24h-Erinnerungen laden fehlgeschlagen:", err24h);
    errors.push(`24h laden: ${err24h.message}`);
  }

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

      // Wenn das Flag nicht gesetzt werden kann, bekommt der Gast beim
      // naechsten Lauf dieselbe Mail nochmal — das muss sichtbar sein.
      const { error: flagErr } = await supabase
        .from("reservations")
        .update({ reminder_24h_sent: true })
        .eq("id", res.id);

      if (flagErr) {
        console.error("24h-Flag setzen fehlgeschlagen:", flagErr);
        errors.push(`24h Flag ${res.id}: ${flagErr.message}`);
        continue;
      }

      sent24h++;
    } catch (e) {
      console.error("24h reminder error:", e);
      errors.push(`24h Mail ${res.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 2h Erinnerungen
  const { data: res2h, error: err2h } = await supabase
    .from("reservations")
    .select("*, restaurants(name, phone)")
    .eq("date", format(in2h))
    .eq("reminder_2h_sent", false)
    .eq("status", "confirmed")
    .not("guest_email", "is", null);

  if (err2h) {
    console.error("2h-Erinnerungen laden fehlgeschlagen:", err2h);
    errors.push(`2h laden: ${err2h.message}`);
  }

  for (const res of res2h || []) {
    const resTime = res.time.slice(0, 5);
    const targetTime = formatTime(in2h);

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

      const { error: flagErr } = await supabase
        .from("reservations")
        .update({ reminder_2h_sent: true })
        .eq("id", res.id);

      if (flagErr) {
        console.error("2h-Flag setzen fehlgeschlagen:", flagErr);
        errors.push(`2h Flag ${res.id}: ${flagErr.message}`);
        continue;
      }

      sent2h++;
    } catch (e) {
      console.error("2h reminder error:", e);
      errors.push(`2h Mail ${res.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // FEEDBACK MAILS — 2h NACH Reservierungsende
  const yesterdayStr = format(new Date(now.getTime() - 48 * 60 * 60 * 1000));
  const todayStr = format(now);

  const { data: feedbackCandidates, error: fbErr } = await supabase
    .from("reservations")
    .select("id, guest_name, guest_email, time, date, restaurant_id, restaurants(name, google_place_id, google_review_url, stay_duration)")
    .in("status", ["confirmed", "completed"])
    .eq("feedback_sent", false)
    .not("guest_email", "is", null)
    .gte("date", yesterdayStr)
    .lte("date", todayStr);

  if (fbErr) {
    console.error("Feedback-Kandidaten laden fehlgeschlagen:", fbErr);
    errors.push(`Feedback laden: ${fbErr.message}`);
  }

  for (const res of feedbackCandidates || []) {
    if (!res.guest_email) continue;

    const restaurantData = Array.isArray(res.restaurants) ? res.restaurants[0] : res.restaurants;
    const restaurant = restaurantData as { name: string; google_place_id?: string; google_review_url?: string; stay_duration?: number } | null;
    if (!restaurant) continue;

    const stayDuration = restaurant.stay_duration || 150;
    const resDate = new Date(res.date + "T" + res.time);
    const resEnd = new Date(resDate.getTime() + stayDuration * 60 * 1000);
    const hoursSinceEnd = (now.getTime() - resEnd.getTime()) / (1000 * 60 * 60);

    // Nur 2-24h nach Ende
    if (hoursSinceEnd < 2 || hoursSinceEnd > 24) continue;

    let googleReviewUrl = restaurant.google_review_url || "";
    if (!googleReviewUrl && restaurant.google_place_id) {
      googleReviewUrl = `https://search.google.com/local/writereview?placeid=${restaurant.google_place_id}`;
    }

    try {
      const mailRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://tablely.at"}/api/feedback-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: res.guest_email,
          guestName: res.guest_name,
          restaurantName: restaurant.name,
          reservationId: res.id,
          googleReviewUrl,
        }),
      });

      // fetch wirft bei 4xx/5xx nicht — sonst wuerde feedback_sent gesetzt
      // obwohl gar keine Mail rausging.
      if (!mailRes.ok) {
        console.error("Feedback-Mail fehlgeschlagen:", mailRes.status);
        errors.push(`Feedback Mail ${res.id}: HTTP ${mailRes.status}`);
        continue;
      }

      const { error: flagErr } = await supabase
        .from("reservations")
        .update({ feedback_sent: true })
        .eq("id", res.id);

      if (flagErr) {
        console.error("Feedback-Flag setzen fehlgeschlagen:", flagErr);
        errors.push(`Feedback Flag ${res.id}: ${flagErr.message}`);
        continue;
      }

      sentFeedback++;
    } catch (e) {
      console.error("Feedback email error:", e);
      errors.push(`Feedback ${res.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    sent24h,
    sent2h,
    sentFeedback,
    errorCount: errors.length,
    errors,
    timestamp: now.toISOString(),
  }, { status: errors.length > 0 ? 500 : 200 });
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