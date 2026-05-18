import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { restaurantName, email, phone, address } = await req.json();

  await resend.emails.send({
    from: "Tablely <noreply@send.tablely.at>",
    to: "michael@tablely.at",
    subject: `🆕 Neue Registrierung: ${restaurantName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:24px;font-weight:700;color:#1A1A2E;font-family:Georgia,serif;">table<span style="color:#FF5C35;">ly</span></span>
    </div>
    <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #F0EBE3;">
      <div style="display:inline-block;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.2);border-radius:20px;padding:4px 14px;margin-bottom:16px;">
        <span style="font-size:12px;color:#34D399;font-weight:600;">🆕 Neue Registrierung</span>
      </div>
      <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1A1A2E;margin:0 0 20px;">
        ${restaurantName}
      </h1>
      <div style="background:#F5F0EB;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        ${[
          ["Restaurant", restaurantName],
          ["E-Mail", email],
          ["Telefon", phone || "—"],
          ["Adresse", address || "—"],
        ].map(([l,v]) => `
        <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #EDE8E3;font-size:14px;">
          <span style="color:#6B6B80;">${l}</span>
          <span style="font-weight:500;color:#1A1A2E;">${v}</span>
        </div>`).join("")}
      </div>
      <a href="https://www.tablely.at/admin" style="display:block;background:#FF5C35;color:#fff;text-align:center;padding:12px;border-radius:10px;font-size:14px;font-weight:500;text-decoration:none;">
        Im Admin Panel ansehen →
      </a>
    </div>
    <p style="font-size:12px;color:#6B6B80;text-align:center;margin-top:16px;">© 2026 Tablely</p>
  </div>
</body>
</html>`,
  });

  return NextResponse.json({ ok: true });
}