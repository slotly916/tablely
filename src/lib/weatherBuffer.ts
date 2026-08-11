/**
 * Gemeinsame Logik für die Wetter-Warnung und den Schlechtwetter-Puffer.
 *
 * Der Puffer legt bewusst KEINE eigene Tabelle an, sondern normale Zeilen in
 * reservations mit channel = 'system'. Dadurch blockiert er automatisch in
 * ALLEN Buchungskanälen (Buchungsseite, WhatsApp-KI und Voice-Server im
 * separaten Repo), weil überall dieselbe Überlappungsprüfung auf reservations
 * läuft — es muss keine Verfügbarkeitslogik angefasst werden.
 */

export const BUFFER_CHANNEL = "system";
export const BUFFER_GUEST_NAME = "Schlechtwetter-Puffer";
export const BUFFER_NOTES = "Automatisch freigehalten wegen Regenprognose";

export type BufferTable = {
  id: string;
  name: string;
  capacity: number;
  combinable_with?: string[] | null;
  is_outdoor?: boolean | null;
};

export type BufferReservation = {
  id: string;
  date: string;
  time: string;
  status: string;
  channel: string;
  party_size: number;
  table_id: string | null;
  table_ids: string[] | null;
};

export type BufferHour = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(m: number): string {
  return `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;
}

export function tableIdsOf(r: BufferReservation): string[] {
  if (r.table_ids && r.table_ids.length > 0) return r.table_ids;
  if (r.table_id) return [r.table_id];
  return [];
}

/** Puffer-Blocker sind keine Gast-Reservierungen und werden überall ausgeblendet. */
export function isBufferReservation(r: { channel: string }): boolean {
  return r.channel === BUFFER_CHANNEL;
}

/**
 * Öffnungszeit für ein Datum.
 * ACHTUNG: In der Datenbank ist day_of_week 0 = Montag (so schreiben es
 * Onboarding und Einstellungen, so liest es die Buchungsseite) — deshalb
 * (getDay() + 6) % 7 und nicht getDay().
 */
export function openingHourFor(dateStr: string, hours: BufferHour[]): BufferHour | undefined {
  const dayOfWeek = (new Date(dateStr).getDay() + 6) % 7;
  return hours.find(h => h.day_of_week === dayOfWeek);
}

/**
 * Startzeiten für die Blocker eines Tages: über die gesamte Öffnungszeit im
 * Abstand von stay_duration, damit die bestehende Überlappungsprüfung
 * (start .. start + stay_duration) lückenlos greift.
 */
export function bufferSlots(hour: BufferHour, stayDuration: number): string[] {
  const step = Math.max(30, stayDuration || 150);
  const open = timeToMinutes(hour.open_time);
  const closeRaw = timeToMinutes(hour.close_time);
  // Sperrstunde nach Mitternacht: bis Tagesende blocken, mehr geht in einer
  // Datumsspalte nicht.
  const close = closeRaw > open ? closeRaw : 24 * 60;

  const slots: string[] = [];
  for (let m = open; m < close && slots.length < 48; m += step) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

/** Alle echten Gast-Reservierungen eines Tages (ohne Storno, ohne Puffer). */
export function guestReservationsOn(reservations: BufferReservation[], date: string): BufferReservation[] {
  return reservations.filter(
    r => r.date === date && r.status !== "cancelled" && !isBufferReservation(r)
  );
}

/** Aktive Puffer-Blocker eines Tages. */
export function bufferReservationsOn(reservations: BufferReservation[], date: string): BufferReservation[] {
  return reservations.filter(r => r.date === date && r.status !== "cancelled" && isBufferReservation(r));
}

/** Gast-Reservierungen des Tages, die auf mindestens einem Außentisch liegen. */
export function outdoorReservationsOn(
  reservations: BufferReservation[],
  tables: BufferTable[],
  date: string
): BufferReservation[] {
  const outdoorIds = new Set(tables.filter(t => t.is_outdoor).map(t => t.id));
  if (outdoorIds.size === 0) return [];
  return guestReservationsOn(reservations, date).filter(r =>
    tableIdsOf(r).some(id => outdoorIds.has(id))
  );
}

/** Ein Tisch ist frei, wenn an diesem Tag keine aktive Reservierung auf ihm liegt. */
function isTableFreeOnDay(tableId: string, reservations: BufferReservation[], date: string): boolean {
  return !reservations.some(
    r => r.date === date && r.status !== "cancelled" && tableIdsOf(r).includes(tableId)
  );
}

/**
 * Kleinste Kombination freier INNENtische, die die übergebene Personenzahl
 * abdeckt. Nutzt dieselbe Kapazitätslogik wie die Tischsuche: erst der
 * kleinste passende Einzeltisch, sonst die größten Tische auffüllen und
 * anschließend überflüssige wieder entfernen.
 * Gibt null zurück, wenn die Personenzahl nicht abgedeckt werden kann.
 */
export function findIndoorBufferTables(
  tables: BufferTable[],
  reservations: BufferReservation[],
  date: string,
  persons: number
): BufferTable[] | null {
  if (persons <= 0) return null;

  const free = tables
    .filter(t => !t.is_outdoor && isTableFreeOnDay(t.id, reservations, date));

  // 1. Kleinster passender Einzeltisch.
  const single = free
    .filter(t => t.capacity >= persons)
    .sort((a, b) => a.capacity - b.capacity)[0];
  if (single) return [single];

  // 2. Kombination: größte Tische zuerst, damit möglichst wenige Tische
  //    blockiert werden.
  const byCapacityDesc = [...free].sort((a, b) => b.capacity - a.capacity);
  const picked: BufferTable[] = [];
  let total = 0;
  for (const t of byCapacityDesc) {
    if (total >= persons) break;
    picked.push(t);
    total += t.capacity;
  }
  if (total < persons) return null;

  // 3. Überflüssige Tische wieder freigeben (kleinste zuerst).
  const trimmed = [...picked].sort((a, b) => a.capacity - b.capacity);
  const result = [...picked];
  for (const t of trimmed) {
    const rest = result.filter(x => x.id !== t.id);
    const restTotal = rest.reduce((sum, x) => sum + x.capacity, 0);
    if (rest.length > 0 && restTotal >= persons) {
      result.splice(result.findIndex(x => x.id === t.id), 1);
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/** localStorage-Key für "Nein, danke" — gilt pro Restaurant und Tag. */
export function dismissKey(restaurantId: string, date: string): string {
  return `Butlery.wetterpuffer.abgelehnt.${restaurantId}.${date}`;
}
