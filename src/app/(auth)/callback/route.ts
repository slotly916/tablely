import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Diese Route fängt den Google-OAuth-Rücksprung ab.
// Sie tauscht den ?code gegen eine echte Session (Cookie) und leitet dann weiter.
// Ohne diese Route landet man in einer Login-Schleife, weil die Middleware
// auf /onboarding bzw. /dashboard noch kein Session-Cookie findet.

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Ohne Session wuerde die Middleware direkt zurueck auf /login schicken —
      // der Nutzer landet in einer Schleife ohne zu wissen warum.
      console.error("OAuth-Callback fehlgeschlagen:", error);
      const target = new URL("/login", origin);
      target.searchParams.set("error", "Anmeldung über Google fehlgeschlagen. Bitte versuche es nochmal.");
      return NextResponse.redirect(target.toString());
    }
  } else {
    const target = new URL("/login", origin);
    target.searchParams.set("error", "Die Anmeldung wurde abgebrochen oder ist abgelaufen. Bitte versuche es nochmal.");
    return NextResponse.redirect(target.toString());
  }

  return NextResponse.redirect(`${origin}${next}`);
}