/**
 * Geocoding über die Open-Meteo Geocoding-API (kostenlos, kein API-Key).
 *
 * Restaurants haben nur eine Textadresse. Beim Speichern der Adresse in
 * Settings/Onboarding holen wir einmalig die Koordinaten, damit das Dashboard
 * die Wettervorhersage abrufen kann.
 *
 * Die API kennt Ortsnamen, keine Hausnummern — deshalb probieren wir die
 * Adressteile von hinten nach vorne durch ("Musterstraße 1, 6020 Innsbruck"
 * -> "Innsbruck"). Schlägt alles fehl, kommt null zurück: dann bleiben
 * latitude/longitude leer und es erscheint schlicht kein Wetter-Widget.
 * Diese Funktion wirft nie.
 */

export type Coordinates = { latitude: number; longitude: number };

function buildCandidates(address: string): string[] {
  const parts = address.split(",").map(p => p.trim()).filter(Boolean);
  const candidates: string[] = [];

  // Von hinten nach vorne: der Ort steht in Adressen üblicherweise zuletzt.
  for (const part of [...parts].reverse()) {
    // Postleitzahl und Hausnummer entfernen — die API sucht nach Ortsnamen.
    const cleaned = part.replace(/\d+/g, " ").replace(/\s+/g, " ").trim();
    if (cleaned.length >= 2) candidates.push(cleaned);
  }

  const trimmed = address.trim();
  if (candidates.length === 0 && trimmed.length >= 2) candidates.push(trimmed);

  // Maximal 3 Anfragen pro Speichervorgang.
  return Array.from(new Set(candidates)).slice(0, 3);
}

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!address || !address.trim()) return null;

  for (const query of buildCandidates(address)) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=de&format=json`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      const hit = data?.results?.[0];
      if (typeof hit?.latitude === "number" && typeof hit?.longitude === "number") {
        return { latitude: hit.latitude, longitude: hit.longitude };
      }
    } catch (e) {
      // Netzwerkfehler ist kein Grund, das Speichern der Adresse scheitern zu
      // lassen — das Wetter-Widget ist nur ein Extra.
      console.error("Geocoding fehlgeschlagen:", e);
    }
  }

  return null;
}
