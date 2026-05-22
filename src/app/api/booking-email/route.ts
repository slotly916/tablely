import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();
  const { email, guestName, restaurantName, restaurantAddress, restaurantPhone, date, time, partySize, isLargeGroup, notes } = body;

  const formattedDate = new Date(date).toLocaleDateString("de-AT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const subject = isLargeGroup
    ? "Anfrage erhalten - " + restaurantName
    : "Reservierung bestätigt - " + restaurantName;

  const headerTitle = isLargeGroup ? "Anfrage erhalten" : "Reservierung bestätigt";
  const headerIcon = isLargeGroup ? "⏳" : "✓";
  const headerTextColor = isLargeGroup ? "#D97706" : "#059669";
  const headerBg = isLargeGroup ? "rgba(252,211,77,.1)" : "rgba(52,211,153,.1)";
  const introText = isLargeGroup
    ? "Vielen Dank für deine Reservierungsanfrage! Für Gruppen ab 15 Personen meldet sich das Team von " + restaurantName + " persönlich bei dir."
    : "Wir freuen uns auf deinen Besuch im " + restaurantName + "!";

  const html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;background:#F5F0EB;font-family:Arial,sans-serif;">' +
    '<div style="max-width:560px;margin:0 auto;padding:40px 20px;">' +
    '<div style="text-align:center;margin-bottom:32px;"><span style="font-size:28px;font-weight:700;color:#1A1A2E;font-family:Georgia,serif;">table<span style="color:#FF5C35;">ly</span></span></div>' +
    '<div style="background:#fff;border-radius:20px;padding:40px;border:1px solid #F0EBE3;">' +
    '<div style="display:inline-block;background:' + headerBg + ';border-radius:20px;padding:5px 14px;margin-bottom:18px;">' +
    '<span style="font-size:12px;color:' + headerTextColor + ';font-weight:600;">' + headerIcon + ' ' + headerTitle + '</span></div>' +
    '<h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1A1A2E;margin:0 0 10px;">Hallo ' + guestName + '!</h1>' +
    '<p style="font-size:15px;color:#6B6B80;margin:0 0 28px;line-height:1.7;font-weight:300;">' + introText + '</p>' +
    '<div style="background:#FFF0EB;border-radius:14px;padding:20px;margin-bottom:24px;">' +
    '<div style="font-size:11px;font-weight:600;color:#FF5C35;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:14px;">Reservierungsdetails</div>' +
    '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,92,53,.12);font-size:14px;"><span style="color:#6B6B80;">Restaurant</span><span style="font-weight:500;color:#1A1A2E;">' + restaurantName + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,92,53,.12);font-size:14px;"><span style="color:#6B6B80;">Datum</span><span style="font-weight:500;color:#1A1A2E;">' + formattedDate + '</span></div>' +
    '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,92,53,.12);font-size:14px;"><span style="color:#6B6B80;">Uhrzeit</span><span style="font-weight:500;color:#1A1A2E;">' + time + ' Uhr</span></div>' +
    '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;"><span style="color:#6B6B80;">Personen</span><span style="font-weight:500;color:#1A1A2E;">' + partySize + ' ' + (partySize === 1 ? "Person" : "Personen") + '</span></div>' +
    (restaurantAddress ? '<div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid rgba(255,92,53,.12);font-size:14px;"><span style="color:#6B6B80;">Adresse</span><span style="font-weight:500;color:#1A1A2E;text-align:right;">' + restaurantAddress + '</span></div>' : '') +
    (notes ? '<div style="padding:10px 0 0;font-size:14px;border-top:1px solid rgba(255,92,53,.12);margin-top:8px;"><div style="color:#6B6B80;margin-bottom:4px;">Sonderwünsche</div><div style="color:#1A1A2E;font-style:italic;">' + notes + '</div></div>' : '') +
    '</div>' +
    (!isLargeGroup ? '<div style="background:#F5F0EB;border-radius:12px;padding:14px 18px;margin-bottom:20px;"><div style="font-size:12px;font-weight:600;color:#1A1A2E;margin-bottom:4px;">Tipp</div><div style="font-size:13px;color:#6B6B80;line-height:1.6;">Wir erinnern dich 24 Stunden und 2 Stunden vor deiner Reservierung.</div></div>' : '') +
    (restaurantPhone ? '<p style="font-size:13px;color:#6B6B80;text-align:center;margin:0;">Bei Fragen: <strong style="color:#1A1A2E;">' + restaurantPhone + '</strong></p>' : '') +
    '</div>' +
    '<div style="text-align:center;margin-top:24px;"><p style="font-size:12px;color:#6B6B80;margin:0;">© 2026 Tablely · Michael Kleinlercher e.U.</p></div>' +
    '</div></body></html>';

  await resend.emails.send({
    from: "Tablely <noreply@send.tablely.at>",
    to: email,
    subject,
    html,
  });

  return NextResponse.json({ ok: true });
}