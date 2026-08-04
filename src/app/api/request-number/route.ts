import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, phone, restaurantName } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "Name und Telefon erforderlich" }, { status: 400 });
    }

    await resend.emails.send({
      from: "Tablely <noreply@send.tablely.at>",
      to: "info@tablely.at",
      subject: `Neue Nummer-Anfrage: ${name}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #F0EBE3;">
      <div style="font-size:11px;font-weight:700;color:#FF5C35;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">Neue WhatsApp-Nummer-Anfrage</div>
      <h1 style="font-size:22px;font-weight:700;color:#1A1A2E;margin:0 0 20px;">Ein Restaurant möchte eine Nummer</h1>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #F5F0EB;font-size:13px;color:#6B6B80;width:120px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #F5F0EB;font-size:14px;color:#1A1A2E;font-weight:600;">${name}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #F5F0EB;font-size:13px;color:#6B6B80;">Telefon</td><td style="padding:10px 0;border-bottom:1px solid #F5F0EB;font-size:14px;color:#1A1A2E;font-weight:600;">${phone}</td></tr>
        <tr><td style="padding:10px 0;font-size:13px;color:#6B6B80;">Restaurant</td><td style="padding:10px 0;font-size:14px;color:#1A1A2E;font-weight:600;">${restaurantName || "—"}</td></tr>
      </table>
      <p style="font-size:13px;color:#6B6B80;line-height:1.6;margin:20px 0 0;">Meld dich bei diesem Restaurant, um die WhatsApp Business Nummer einzurichten.</p>
    </div>
  </div>
</body>
</html>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Senden fehlgeschlagen" }, { status: 500 });
  }
}