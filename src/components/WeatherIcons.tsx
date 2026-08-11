"use client";

/**
 * Wetter-Icons als eigene Inline-SVGs — keine Emojis, keine Icon-Bibliothek.
 *
 * Farbe ist hier funktional (Datenvisualisierung): Sonne gelb/orange, Wolken
 * grau, Regen blau, Gewitter grau mit gelbem Blitz. Die Palette ist bewusst
 * gedeckt gehalten, damit sie neben Orange #FF5C35 nicht schreit.
 */

const SUN = "#F5A623";
const MOON = "#C2C7D4";
const CLOUD = "#C3C8D2";
const CLOUD_DARK = "#98A0B0";
const RAIN = "#3E8FD9";
const SNOW = "#9FC5E8";
const FOG = "#B4BAC6";

/** WMO-Wettercodes von Open-Meteo auf die Darstellungsarten abbilden. */
export type WeatherKind = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "thunder";

export function weatherKind(code: number): WeatherKind {
  if (code === 0 || code === 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "cloudy";
}

/** Kurzer deutscher Text zum Wettercode. */
export function weatherText(code: number, isDay = true): string {
  switch (code) {
    case 0: return isDay ? "Sonnig" : "Klar";
    case 1: return isDay ? "Überwiegend sonnig" : "Überwiegend klar";
    case 2: return "Teils bewölkt";
    case 3: return "Bewölkt";
    case 45: case 48: return "Nebel";
    case 51: case 53: case 55: return "Nieselregen";
    case 56: case 57: return "Gefrierender Nieselregen";
    case 61: return "Leichter Regen";
    case 63: return "Regen";
    case 65: return "Starker Regen";
    case 66: case 67: return "Gefrierender Regen";
    case 71: return "Leichter Schneefall";
    case 73: return "Schneefall";
    case 75: return "Starker Schneefall";
    case 77: return "Schneegriesel";
    case 80: return "Leichte Schauer";
    case 81: return "Schauer";
    case 82: return "Kräftige Schauer";
    case 85: case 86: return "Schneeschauer";
    case 95: return "Gewitter";
    case 96: case 99: return "Gewitter mit Hagel";
    default: return "Wechselhaft";
  }
}

function Sun({ x = 12, y = 12, r = 4.6 }: { x?: number; y?: number; r?: number }) {
  const ray = r + 3.4;
  const inner = r + 1.4;
  const d = [0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
    const rad = (deg * Math.PI) / 180;
    const x1 = x + Math.cos(rad) * inner;
    const y1 = y + Math.sin(rad) * inner;
    const x2 = x + Math.cos(rad) * ray;
    const y2 = y + Math.sin(rad) * ray;
    return `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }).join("");
  return (
    <>
      <circle cx={x} cy={y} r={r} fill={SUN} />
      <path d={d} stroke={SUN} strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

function Moon() {
  return <path d="M15.6 14.8A6.2 6.2 0 0 1 9.2 6a6.6 6.6 0 1 0 6.4 8.8z" fill={MOON} />;
}

function Cloud({ color = CLOUD, y = 0 }: { color?: string; y?: number }) {
  return (
    <path
      d={`M7.2 ${16.5 + y}h9.6a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-9.9-1.2A3.7 3.7 0 0 0 7.2 ${16.5 + y}z`}
      fill={color}
    />
  );
}

function Drops({ color = RAIN }: { color?: string }) {
  return (
    <path
      d="M9.4 18.4l-1.1 3.1M12.6 18.4l-1.1 3.1M15.8 18.4l-1.1 3.1"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  );
}

export function WeatherIcon({ code, isDay = true, size = 24 }: { code: number; isDay?: boolean; size?: number }) {
  const kind = weatherKind(code);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      {kind === "clear" && (isDay ? <Sun /> : <Moon />)}

      {kind === "partly" && (
        <>
          {isDay ? <Sun x={9} y={9} r={3.6} /> : <circle cx="9" cy="9" r="3.6" fill={MOON} />}
          <Cloud y={0.5} />
        </>
      )}

      {kind === "cloudy" && (
        <>
          <path d="M6 12.4a3.4 3.4 0 0 1 4.6-3.2 4.8 4.8 0 0 1 8 1.2" stroke={CLOUD_DARK} strokeWidth="1.5" strokeLinecap="round" />
          <Cloud y={0.5} />
        </>
      )}

      {kind === "fog" && (
        <>
          <Cloud color={FOG} y={-1.5} />
          <path d="M5.5 18.5h13M7.5 21.2h9" stroke={FOG} strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}

      {kind === "drizzle" && (
        <>
          <Cloud y={-1.5} />
          <path d="M10 18.6l-.7 2M13.9 18.6l-.7 2" stroke={RAIN} strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}

      {kind === "rain" && (
        <>
          <Cloud y={-1.5} />
          <Drops />
        </>
      )}

      {kind === "snow" && (
        <>
          <Cloud y={-1.5} />
          <path d="M9.2 20.2h1.4M9.9 19.5v1.4M13.4 20.2h1.4M14.1 19.5v1.4" stroke={SNOW} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}

      {kind === "thunder" && (
        <>
          <Cloud color={CLOUD_DARK} y={-2} />
          <path d="M12.6 15.4l-3 4.2h2.4l-1.2 3.4 3.6-4.6h-2.3l1.4-3z" fill={SUN} />
          <path d="M8.4 18.6l-.8 2.3" stroke={RAIN} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** Farbe des Regenbalkens in der Stundenleiste. */
export const RAIN_BAR_COLOR = RAIN;
