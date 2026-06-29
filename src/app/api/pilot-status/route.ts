import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ===== EINSTELLUNGEN PILOTAKTION =====
const PILOT_TOTAL = 3;                          // wie viele Pilot-Plätze (6 Monate gratis)
const PILOT_START = "2026-06-29T04:00:00Z";     // ab diesem Datum zählen Anmeldungen (= 29.6.2026 06:00 Uhr Österreich). Alte Test-Restaurants davor zählen NICHT
const FLASH_HOURS = 48;                          // Dauer des 30-Tage-Blitzangebots nachdem die Plätze voll sind
// =====================================

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data, error } = await supabase
      .from("restaurants")
      .select("id, created_at")
      .gte("created_at", PILOT_START)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const count = data?.length || 0;
    const spotsLeft = Math.max(0, PILOT_TOTAL - count);

    let phase: "pilot" | "flash" | "normal" = "pilot";
    let deadline: string | null = null;

    if (count >= PILOT_TOTAL && data && data[PILOT_TOTAL - 1]) {
      // Zeitpunkt der 3. Anmeldung + 48h = Ende des Blitzangebots
      const thirdSignup = new Date(data[PILOT_TOTAL - 1].created_at).getTime();
      const end = thirdSignup + FLASH_HOURS * 60 * 60 * 1000;
      deadline = new Date(end).toISOString();
      phase = Date.now() < end ? "flash" : "normal";
    }

    return NextResponse.json({ count, spotsLeft, phase, deadline });
  } catch {
    return NextResponse.json({ error: "Status nicht verfügbar" }, { status: 500 });
  }
}