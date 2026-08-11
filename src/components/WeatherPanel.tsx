"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { errorText } from "@/components/Toast";
import { RAIN_BAR_COLOR, WeatherIcon, weatherText } from "@/components/WeatherIcons";
import {
  BUFFER_CHANNEL,
  BUFFER_GUEST_NAME,
  BUFFER_NOTES,
  BufferHour,
  BufferReservation,
  BufferTable,
  bufferReservationsOn,
  bufferSlots,
  dismissKey,
  findIndoorBufferTables,
  openingHourFor,
  outdoorReservationsOn,
  tableIdsOf,
} from "@/lib/weatherBuffer";

type WeatherDay = {
  date: string;
  precipitation_probability_max: number;
  precipitation_sum: number;
  weathercode: number;
  is_rainy: boolean;
};

type WeatherHour = {
  time: string;
  temperature: number;
  precipitation_probability: number;
  weathercode: number;
};

type WeatherCurrent = {
  temperature: number;
  weathercode: number;
  is_day: boolean;
};

type Loaded = {
  status: "loading" | "ok" | "location" | "error";
  current: WeatherCurrent | null;
  hours: WeatherHour[];
  rainStart: Record<string, string>;
  days: WeatherDay[];
};

type Props = {
  restaurantId: string;
  tables: BufferTable[];
  reservations: BufferReservation[];
  openingHours: BufferHour[];
  stayDuration: number;
  onBufferChange: () => void | Promise<void>;
  onRemoveBuffer: (date: string) => Promise<void>;
  removingBuffer: boolean;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  /** Schmale Darstellung fuer die rechte Dashboard-Spalte. */
  compact?: boolean;
  /** Wird gesetzt, wenn das Panel ausgeblendet werden koennen soll. */
  onHide?: () => void;
};

// Marken-Token, gleich wie Dashboard und Landing.
const surface = "#FFFFFF";
const border = "#E6E8EC";
const text = "#1A1A2E";
const muted = "#5F5F73";
const accent = "#FF5C35";

// Standortbezogene Gruende: dann hilft ein Blick in die Einstellungen.
const LOCATION_REASONS = ["no_address", "geocode_failed", "no_coordinates"];

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString("de-AT", { weekday: "long", day: "numeric", month: "long" });
}

export default function WeatherPanel({
  restaurantId,
  tables,
  reservations,
  openingHours,
  stayDuration,
  onBufferChange,
  onRemoveBuffer,
  removingBuffer,
  showError,
  showSuccess,
  compact = false,
  onHide,
}: Props) {
  const [weather, setWeather] = useState<Loaded>({
    status: "loading", current: null, hours: [], rainStart: {}, days: [],
  });
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [savingDate, setSavingDate] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    let active = true;

    (async () => {
      try {
        const res = await fetch(`/api/weather?restaurant_id=${encodeURIComponent(restaurantId)}`);
        const data = res.ok ? await res.json() : null;
        if (!active) return;

        if (!data?.available) {
          // Kein Crash und kein leeres Loch: das Widget zeigt einen dezenten
          // Hinweis, damit klar ist warum kein Wetter da ist.
          setWeather({
            status: LOCATION_REASONS.includes(data?.reason) ? "location" : "error",
            current: null, hours: [], rainStart: {}, days: [],
          });
          return;
        }

        setWeather({
          status: "ok",
          current: data.current ?? null,
          hours: Array.isArray(data.hours) ? data.hours : [],
          rainStart: data.rain_start || {},
          days: Array.isArray(data.days) ? data.days : [],
        });

        // "Nein, danke" wird pro Tag im localStorage gemerkt.
        setDismissed(
          (data.days as WeatherDay[] || [])
            .map(d => d.date)
            .filter(date => {
              try { return window.localStorage.getItem(dismissKey(restaurantId, date)) === "1"; }
              catch { return false; }
            })
        );
      } catch (e) {
        console.error("Wetter laden fehlgeschlagen:", e);
        if (active) setWeather(prev => ({ ...prev, status: "error" }));
      }
    })();

    return () => { active = false; };
  }, [restaurantId]);

  const dismiss = useCallback((date: string) => {
    try { window.localStorage.setItem(dismissKey(restaurantId, date), "1"); } catch {}
    setDismissed(prev => (prev.includes(date) ? prev : [...prev, date]));
  }, [restaurantId]);

  async function holdTables(date: string, chosen: BufferTable[]) {
    const hour = openingHourFor(date, openingHours);
    if (!hour || hour.is_closed) {
      showError("Für diesen Tag sind keine Öffnungszeiten hinterlegt — es können keine Tische freigehalten werden.");
      return;
    }

    const slots = bufferSlots(hour, stayDuration);
    if (slots.length === 0) {
      showError("Die Öffnungszeiten dieses Tages ergeben keine blockierbaren Zeitfenster.");
      return;
    }

    const rows = chosen.flatMap(t =>
      slots.map(time => ({
        restaurant_id: restaurantId,
        table_id: t.id,
        table_ids: [t.id],
        guest_name: BUFFER_GUEST_NAME,
        guest_phone: null,
        party_size: t.capacity,
        date,
        time,
        channel: BUFFER_CHANNEL,
        status: "confirmed",
        notes: BUFFER_NOTES,
      }))
    );

    setSavingDate(date);
    const supabase = createClient();
    const { error } = await supabase.from("reservations").insert(rows);
    setSavingDate("");

    if (error) {
      console.error("Schlechtwetter-Puffer anlegen fehlgeschlagen:", error);
      showError(errorText("Die Tische konnten nicht freigehalten werden.", error));
      return;
    }

    showSuccess(`${chosen.map(t => t.name).join(", ")} freigehalten.`);
    await onBufferChange();
  }

  // Waehrend des Ladens noch nichts zeigen — danach ist das Widget immer da.
  if (weather.status === "loading") return null;

  const card: React.CSSProperties = {
    background: surface,
    border: `1px solid ${border}`,
    borderRadius: compact ? "14px" : "12px",
    marginBottom: compact ? 0 : "20px",
    overflow: "hidden",
  };

  // Kopfzeile mit Ausblenden-Schalter. Das Panel soll wegklappbar sein, ohne
  // dass man dafuer erst wissen muss, wo der Schalter sonst waere (§16 Agency).
  const header = onHide ? (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderBottom: `1px solid ${border}`, background: "#FAFBFC",
    }}>
      <span style={{ fontSize: "12px", fontWeight: 600, color: muted }}>Wetter</span>
      <button
        onClick={onHide}
        aria-label="Wetter ausblenden"
        title="Wetter ausblenden"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "24px", height: "24px", borderRadius: "7px",
          background: "transparent", border: `1px solid ${border}`,
          color: muted, cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  ) : null;

  if (weather.status !== "ok") {
    return (
      <div style={card}>
        {header}
        <div style={{ padding: "14px", fontSize: "12px", color: muted, lineHeight: 1.6 }}>
          {weather.status === "location"
            ? "Standort nicht gefunden — Adresse in den Einstellungen prüfen."
            : "Wetterdaten sind gerade nicht verfügbar."}
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  // Erster relevanter Regentag: Regen erwartet UND Gäste auf Außenplätzen.
  const relevant = weather.days
    .filter(d => d.is_rainy && d.date >= today && !dismissed.includes(d.date))
    .map(d => {
      const outdoorRes = outdoorReservationsOn(reservations, tables, d.date);
      const persons = outdoorRes.reduce((sum, r) => sum + (r.party_size || 0), 0);
      const buffer = bufferReservationsOn(reservations, d.date);
      const bufferNames = Array.from(new Set(buffer.flatMap(r => tableIdsOf(r))))
        .map(id => tables.find(t => t.id === id)?.name)
        .filter(Boolean) as string[];
      return {
        day: d,
        persons,
        bufferActive: buffer.length > 0,
        bufferNames,
        suggestion: buffer.length > 0 ? null : findIndoorBufferTables(tables, reservations, d.date, persons),
      };
    })
    .find(w => w.persons > 0);

  const currentCode = weather.current?.weathercode ?? weather.days[0]?.weathercode ?? 0;
  const isDay = weather.current?.is_day ?? true;

  return (
    <div style={card}>
      {header}

      {/* 1 — JETZT */}
      <div style={{ display: "flex", alignItems: "center", gap: compact ? "10px" : "12px", padding: compact ? "13px 14px" : "14px 16px" }}>
        <WeatherIcon code={currentCode} isDay={isDay} size={compact ? 28 : 34} />
        <div style={{ display: "flex", alignItems: "baseline", gap: "9px", flexWrap: "wrap", minWidth: 0 }}>
          {weather.current && (
            <span style={{ fontFamily: "var(--font-playfair),serif", fontSize: compact ? "23px" : "26px", fontWeight: 700, color: text, letterSpacing: "-0.02em" }}>
              {weather.current.temperature}°
            </span>
          )}
          <span style={{ fontSize: compact ? "12px" : "13px", color: muted }}>
            {weatherText(currentCode, isDay)}
          </span>
        </div>
      </div>

      {/* 2 — HEUTE-VERLAUF */}
      {weather.hours.length > 0 && (
        <div style={{ borderTop: `1px solid ${border}`, display: "flex", overflowX: "auto", padding: compact ? "10px 6px 8px" : "12px 8px 10px" }}>
          {weather.hours.map(h => {
            const pct = h.precipitation_probability;
            const barMax = compact ? 18 : 24;
            return (
              <div key={h.time} style={{
                flex: compact ? "0 0 42px" : "0 0 54px", display: "flex", flexDirection: "column",
                alignItems: "center", gap: "3px",
              }}>
                <div style={{ fontSize: compact ? "10px" : "11px", color: muted, fontVariantNumeric: "tabular-nums" }}>{h.time.slice(11, 16)}</div>
                <WeatherIcon code={h.weathercode} isDay={h.time.slice(11, 13) >= "07" && h.time.slice(11, 13) < "20"} size={compact ? 17 : 20} />
                <div style={{ fontSize: compact ? "11px" : "12px", color: text, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{h.temperature}°</div>
                <div style={{ height: `${barMax}px`, display: "flex", alignItems: "flex-end" }}>
                  {pct > 0 && (
                    <div
                      title={`${pct}% Regenwahrscheinlichkeit`}
                      style={{
                        width: compact ? "6px" : "8px",
                        height: `${Math.max(3, Math.round((pct / 100) * barMax))}px`,
                        background: RAIN_BAR_COLOR,
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </div>
                <div style={{ fontSize: "10px", color: muted, minHeight: "13px", fontVariantNumeric: "tabular-nums" }}>
                  {pct >= 10 ? `${pct}%` : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3 — EMPFEHLUNG (nur wenn relevant) */}
      {relevant && (
        <div style={{
          borderTop: `1px solid ${border}`, padding: compact ? "12px 14px" : "12px 16px",
          display: "flex", gap: compact ? "10px" : "12px",
          // Schmal untereinander, breit nebeneinander — der Text braucht sonst
          // mehr Platz als die Spalte hat.
          flexDirection: compact ? "column" : "row",
          alignItems: compact ? "stretch" : "center", flexWrap: "wrap",
        }}>
          {relevant.bufferActive ? (
            <>
              <span style={{ color: text, flex: 1, minWidth: compact ? 0 : 240, fontSize: compact ? 12 : 13, lineHeight: 1.6 }}>
                Puffer aktiv: {relevant.bufferNames.join(", ") || "—"}
                {relevant.day.date !== today ? ` (${formatLongDate(relevant.day.date)})` : ""}
              </span>
              <button
                onClick={() => onRemoveBuffer(relevant.day.date)}
                disabled={removingBuffer}
                style={{
                  padding: "8px 16px", borderRadius: "8px", background: "transparent",
                  border: `1px solid ${border}`, color: muted, fontSize: "12px",
                  cursor: "pointer", fontFamily: "inherit", opacity: removingBuffer ? 0.6 : 1,
                }}
              >
                {removingBuffer ? "Wird aufgehoben..." : "Aufheben"}
              </button>
            </>
          ) : (
            <>
              <span style={{ color: text, flex: 1, minWidth: compact ? 0 : 240, fontSize: compact ? 12 : 13, lineHeight: 1.6 }}>
                {relevant.day.date === today
                  ? (weather.rainStart[relevant.day.date] ? `Regen ab ca. ${weather.rainStart[relevant.day.date]} Uhr` : "Regen erwartet")
                  : (weather.rainStart[relevant.day.date]
                      ? `Regen am ${formatLongDate(relevant.day.date)} ab ca. ${weather.rainStart[relevant.day.date]} Uhr`
                      : `Regen erwartet am ${formatLongDate(relevant.day.date)}`)}
                {" — "}
                {relevant.persons} {relevant.persons === 1 ? "Person" : "Personen"} auf Außenplätzen reserviert.
                {relevant.suggestion && relevant.suggestion.length > 0
                  ? ` Empfehlung: ${relevant.suggestion.map(t => t.name).join(", ")} freihalten.`
                  : " Aktuell sind nicht genug freie Innentische vorhanden."}
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {relevant.suggestion && relevant.suggestion.length > 0 && (
                  <button
                    onClick={() => holdTables(relevant.day.date, relevant.suggestion as BufferTable[])}
                    disabled={savingDate === relevant.day.date}
                    style={{
                      padding: "8px 16px", borderRadius: "8px", background: accent, border: "none",
                      color: "#fff", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                      fontFamily: "inherit", opacity: savingDate === relevant.day.date ? 0.6 : 1,
                    }}
                  >
                    {savingDate === relevant.day.date ? "Wird freigehalten..." : "Tische freihalten"}
                  </button>
                )}
                <button
                  onClick={() => dismiss(relevant.day.date)}
                  style={{
                    padding: "8px 16px", borderRadius: "8px", background: "transparent",
                    border: `1px solid ${border}`, color: muted, fontSize: "12px",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Nein, danke
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
