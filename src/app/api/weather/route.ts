import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { geocodeAddress } from "@/lib/geocode";

/**
 * Wetter für ein Restaurant: aktuell + Stundenverlauf + 7 Tage.
 *
 * Quelle: Open-Meteo (kostenlos, kein API-Key).
 *
 * Koordinaten stehen in restaurants.latitude/longitude. Fehlen sie (das ist bei
 * allen Bestandsrestaurants der Fall, weil das Geocoding urspruenglich nur beim
 * Speichern der Adresse lief), wird hier einmalig serverseitig geokodiert und
 * das Ergebnis am Restaurant gespeichert — Lazy-Backfill.
 *
 * Die Antwort ist immer 200 mit { available: boolean }. Bei available:false
 * sagt "reason", ob es am Standort liegt (dann zeigt das Dashboard einen
 * Hinweis auf die Adresse) oder an einer Stoerung.
 */

export const dynamic = "force-dynamic";

// Regen-Definition (identisch zur Anzeige im Dashboard).
const RAIN_PROBABILITY = 60; // Prozent
const RAIN_AMOUNT = 2;       // Millimeter

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Stunde

export type WeatherDay = {
  date: string;
  precipitation_probability_max: number;
  precipitation_sum: number;
  weathercode: number;
  is_rainy: boolean;
};

export type WeatherHour = {
  time: string;
  temperature: number;
  precipitation_probability: number;
  weathercode: number;
};

export type WeatherCurrent = {
  temperature: number;
  weathercode: number;
  is_day: boolean;
};

type CacheEntry = {
  at: number;
  current: WeatherCurrent | null;
  hourly: WeatherHour[];
  days: WeatherDay[];
};

// Einfacher In-Memory-Cache pro Restaurant (1h). Auch Fehlschlaege werden
// gecacht, damit ein Restaurant ohne auffindbare Adresse nicht bei jedem
// Dashboard-Reload erneut geokodiert wird.
const cache = new Map<string, CacheEntry>();
const failCache = new Map<string, { at: number; reason: string }>();

/** Aktuelle Zeit in der Restaurant-Zeitzone (Open-Meteo liefert lokale Zeiten). */
function viennaNow(): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vienna",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find(p => p.type === type)?.value || "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: parseInt(get("hour"), 10) || 0,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurant_id");

  if (!restaurantId) {
    return NextResponse.json({ available: false, reason: "missing_restaurant_id" }, { status: 400 });
  }

  const cached = cache.get(restaurantId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ available: true, cached: true, ...shape(cached) });
  }

  try {
    // Supabase-Client bewusst erst hier initialisieren (nicht top-level).
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Kein .single() — das wirft bei 0 Treffern.
    const { data: rows, error } = await supabase
      .from("restaurants")
      .select("id, address, latitude, longitude")
      .eq("id", restaurantId)
      .limit(1);

    if (error) {
      console.error("Restaurant für Wetter laden fehlgeschlagen:", error);
      return NextResponse.json({ available: false, reason: "restaurant_error" });
    }

    const rest = rows && rows.length > 0 ? rows[0] : null;
    if (!rest) return NextResponse.json({ available: false, reason: "restaurant_error" });

    let latitude: number | null = typeof rest.latitude === "number" ? rest.latitude : null;
    let longitude: number | null = typeof rest.longitude === "number" ? rest.longitude : null;

    // ===== LAZY-BACKFILL =====
    // Bestandsrestaurants haben noch keine Koordinaten. Einmalig nachholen.
    if (latitude === null || longitude === null) {
      const address: string = rest.address || "";
      if (!address.trim()) {
        return NextResponse.json({ available: false, reason: "no_address" });
      }

      // Der Fehlschlag-Cache bremst nur wiederholte Geocoding-Versuche. Die
      // Restaurant-Zeile lesen wir trotzdem jedes Mal — sobald in den
      // Einstellungen Koordinaten gespeichert wurden, wirkt das sofort.
      const failed = failCache.get(restaurantId);
      if (failed && Date.now() - failed.at < CACHE_TTL_MS) {
        return NextResponse.json({ available: false, reason: failed.reason });
      }

      const coords = await geocodeAddress(address);
      if (!coords) {
        return fail(restaurantId, "geocode_failed");
      }

      latitude = coords.latitude;
      longitude = coords.longitude;

      // Speichern, damit das Geocoding wirklich nur einmal laeuft. Ein Fehler
      // hier ist nicht schlimm — dann wird beim naechsten Mal neu geokodiert.
      const { error: saveErr } = await supabase
        .from("restaurants")
        .update({ latitude, longitude })
        .eq("id", restaurantId);
      if (saveErr) console.error("Koordinaten speichern fehlgeschlagen:", saveErr);
    }

    // ===== OPEN-METEO =====
    // Zwei Abfragen: Stundenverlauf braucht nur 2 Tage, die Tagesuebersicht 7.
    const base = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=Europe%2FVienna`;
    const [hourlyRes, dailyRes] = await Promise.all([
      fetch(`${base}&current_weather=true&hourly=temperature_2m,precipitation_probability,weathercode&forecast_days=2`),
      fetch(`${base}&daily=precipitation_probability_max,precipitation_sum,weathercode&forecast_days=7`),
    ]);

    if (!hourlyRes.ok || !dailyRes.ok) {
      console.error("Open-Meteo Antwort nicht ok:", hourlyRes.status, dailyRes.status);
      return NextResponse.json({ available: false, reason: "forecast_error" });
    }

    const hourlyData = await hourlyRes.json();
    const dailyData = await dailyRes.json();

    const dates: string[] = dailyData?.daily?.time || [];
    if (dates.length === 0) {
      return NextResponse.json({ available: false, reason: "forecast_empty" });
    }

    const days: WeatherDay[] = dates.map((date: string, i: number) => {
      const probability = Number(dailyData.daily.precipitation_probability_max?.[i] ?? 0) || 0;
      const amount = Number(dailyData.daily.precipitation_sum?.[i] ?? 0) || 0;
      return {
        date,
        precipitation_probability_max: probability,
        precipitation_sum: amount,
        weathercode: Number(dailyData.daily.weathercode?.[i] ?? 0) || 0,
        is_rainy: probability >= RAIN_PROBABILITY || amount >= RAIN_AMOUNT,
      };
    });

    const times: string[] = hourlyData?.hourly?.time || [];
    const hourly: WeatherHour[] = times.map((time: string, i: number) => ({
      time,
      temperature: Math.round(Number(hourlyData.hourly.temperature_2m?.[i] ?? 0) || 0),
      precipitation_probability: Number(hourlyData.hourly.precipitation_probability?.[i] ?? 0) || 0,
      weathercode: Number(hourlyData.hourly.weathercode?.[i] ?? 0) || 0,
    }));

    const cw = hourlyData?.current_weather;
    const current: WeatherCurrent | null = cw
      ? {
          temperature: Math.round(Number(cw.temperature ?? 0) || 0),
          weathercode: Number(cw.weathercode ?? 0) || 0,
          is_day: cw.is_day !== 0,
        }
      : null;

    const entry: CacheEntry = { at: Date.now(), current, hourly, days };
    cache.set(restaurantId, entry);
    failCache.delete(restaurantId);

    return NextResponse.json({ available: true, cached: false, ...shape(entry) });
  } catch (e) {
    console.error("Wetter laden fehlgeschlagen:", e);
    return NextResponse.json({ available: false, reason: "exception" });
  }
}

function fail(restaurantId: string, reason: string) {
  failCache.set(restaurantId, { at: Date.now(), reason });
  return NextResponse.json({ available: false, reason });
}

/**
 * Aus dem Cache-Eintrag die Antwort bauen. Der Stundenausschnitt und die erste
 * Regenstunde haengen von der aktuellen Uhrzeit ab und werden deshalb bei jeder
 * Anfrage neu berechnet — nicht beim Befuellen des Caches.
 */
function shape(entry: CacheEntry) {
  const now = viennaNow();

  // Nur die Stunden von jetzt bis Mitternacht.
  const hours = entry.hourly.filter(h =>
    h.time.slice(0, 10) === now.date && parseInt(h.time.slice(11, 13), 10) >= now.hour
  );

  // Erste Regenstunde je Tag — heute erst ab der aktuellen Stunde.
  const rainStart: Record<string, string> = {};
  for (const h of entry.hourly) {
    const date = h.time.slice(0, 10);
    if (rainStart[date]) continue;
    if (date === now.date && parseInt(h.time.slice(11, 13), 10) < now.hour) continue;
    if (h.precipitation_probability >= RAIN_PROBABILITY) rainStart[date] = h.time.slice(11, 16);
  }

  return {
    current: entry.current,
    hours,
    rain_start: rainStart,
    days: entry.days,
  };
}
