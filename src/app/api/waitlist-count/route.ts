import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  const { count, error } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  if (error) {
    // Vorher wurde still 0 zurueckgegeben — die Landing Page zeigte dann
    // "0 Anmeldungen" statt zu merken dass die Zahl fehlt.
    console.error("Warteliste zählen fehlgeschlagen:", error);
    return NextResponse.json({ error: "Anzahl konnte nicht geladen werden." }, { status: 500 });
  }

  return NextResponse.json({ count: count || 0 });
}