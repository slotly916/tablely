import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.json();
  const { email, guestName, restaurantName, reservationId, googleReviewUrl } = body;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tablely.at";

  // Star Links: 1-3 Sterne -> internes Feedback, 4-5 Sterne -> Google
  function starLink(rating: number): string {
    if (rating >= 4 && googleReviewUrl) {
      return googleReviewUrl;
    }
    return baseUrl + "/feedback/" + reservationId + "?rating=" + rating;
  }

  const subject = "Wie war's bei " + restaurantName + "? - Wir freuen uns auf dein Feedback";

  const html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;background:#F5F0EB;font-family:Arial,sans-serif;">' +
    '<div style="max-width:560px;margin:0 auto;padding:40px 20px;">' +
    '<div style="text-align:center;margin-bottom:32px;"><span style="font-size:28px;font-weight:700;color:#1A1A2E;font-family:Georgia,serif;">table<span style="color:#FF5C35;">ly</span></span></div>' +
    '<div style="background:#fff;border-radius:20px;padding:40px;border:1px solid #F0EBE3;text-align:center;">' +
    '<div style="font-size:42px;margin-bottom:18px;">🙏</div>' +
    '<h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1A1A2E;margin:0 0 14px;">Hallo ' + guestName + '!</h1>' +
    '<p style="font-size:15px;color:#6B6B80;margin:0 0 8px;line-height:1.7;font-weight:300;">Vielen Dank für deinen Besuch bei <strong style="color:#1A1A2E;">' + restaurantName + '</strong>.</p>' +
    '<p style="font-size:15px;color:#6B6B80;margin:0 0 32px;line-height:1.7;font-weight:300;">Wir hoffen es hat dir geschmeckt und du hattest eine schöne Zeit bei uns!</p>' +
    '<div style="background:#FFF0EB;border:1px solid rgba(255,92,53,0.15);border-radius:14px;padding:24px 20px;margin-bottom:24px;">' +
    '<div style="font-size:13px;font-weight:600;color:#1A1A2E;margin-bottom:14px;">Wie war dein Besuch?</div>' +
    '<div style="font-size:11px;color:#6B6B80;margin-bottom:18px;">Klicke auf die Sterne um zu bewerten</div>' +
    '<div style="text-align:center;line-height:1;">' +
    '<a href="' + starLink(1) + '" style="text-decoration:none;font-size:38px;margin:0 4px;display:inline-block;">⭐</a>' +
    '<a href="' + starLink(2) + '" style="text-decoration:none;font-size:38px;margin:0 4px;display:inline-block;">⭐</a>' +
    '<a href="' + starLink(3) + '" style="text-decoration:none;font-size:38px;margin:0 4px;display:inline-block;">⭐</a>' +
    '<a href="' + starLink(4) + '" style="text-decoration:none;font-size:38px;margin:0 4px;display:inline-block;">⭐</a>' +
    '<a href="' + starLink(5) + '" style="text-decoration:none;font-size:38px;margin:0 4px;display:inline-block;">⭐</a>' +
    '</div></div>' +
    '<p style="font-size:12px;color:#6B6B80;margin:20px 0 0;line-height:1.6;">Dein Feedback hilft uns besser zu werden und anderen Gästen bei der Entscheidung.</p>' +
    '</div>' +
    '<div style="text-align:center;margin-top:24px;"><p style="font-size:11px;color:#6B6B80;margin:0;">© 2026 Tablely · Michael Kleinlercher e.U.</p></div>' +
    '</div></body></html>';

  await resend.emails.send({
    from: "Tablely <noreply@send.tablely.at>",
    to: email,
    subject,
    html,
  });

  return NextResponse.json({ ok: true });
}