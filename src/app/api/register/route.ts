import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { full_name: name },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tablely.at";

  // Willkommensmail an den neuen Nutzer
  try {
    await fetch(`${base}/api/welcome-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, restaurantName: "dein Restaurant" }),
    });
  } catch {}

  // NEU: Admin-Benachrichtigung sofort bei Registrierung
  // (vorher nur beim Onboarding-Abschluss -> Anmeldungen ohne Onboarding blieben unbemerkt)
  try {
    await fetch(`${base}/api/notify-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantName: name || "Unbekannt",
        email,
        phone: "",
        address: "",
        event: "Neue Registrierung (noch kein Onboarding)",
      }),
    });
  } catch {}

  return NextResponse.json({ ok: true });
}