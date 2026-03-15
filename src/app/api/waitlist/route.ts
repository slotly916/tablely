import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL!,
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: "Unbekannter Fehler." },
      { status: 500 }
    );
  }
}