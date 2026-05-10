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

  // Willkommensmail
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.tablely.at"}/api/welcome-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, restaurantName: "dein Restaurant" }),
    });
  } catch {}

  return NextResponse.json({ ok: true });
}