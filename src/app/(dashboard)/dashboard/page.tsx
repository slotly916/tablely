"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Toast, { useToast, errorText } from "@/components/Toast";
import WeatherPanel from "@/components/WeatherPanel";
import { BUFFER_CHANNEL, bufferReservationsOn, isBufferReservation, tableIdsOf } from "@/lib/weatherBuffer";

type Reservation = {
  id: string;
  restaurant_id: string;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  party_size: number;
  date: string;
  time: string;
  status: string;
  channel: string;
  notes: string | null;
  table_id: string | null;
  table_ids: string[] | null;
  has_pet?: boolean | null;
};

type Table = {
  id: string;
  name: string;
  capacity: number;
  combinable_with: string[];
  is_outdoor?: boolean | null;
};

type OpeningHour = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  stay_duration?: number;
  large_group_threshold?: number;
};

const CHANNELS = [
  { key: "all", label: "Alle" },
  { key: "online", label: "Online" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "phone", label: "Telefon" },
  { key: "walkin", label: "Walk-in" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  confirmed:  { bg: "rgba(52,211,153,.12)",  color: "#34D399", border: "rgba(52,211,153,.25)" },
  pending:    { bg: "rgba(251,191,36,.12)",   color: "#FCD34D", border: "rgba(251,191,36,.25)" },
  cancelled:  { bg: "rgba(239,68,68,.12)",    color: "#F87171", border: "rgba(239,68,68,.25)" },
  completed:  { bg: "rgba(99,102,241,.12)",   color: "#818CF8", border: "rgba(99,102,241,.25)" },
};

const CHANNEL_COLORS: Record<string, { bg: string; color: string }> = {
  online:    { bg: "rgba(99,102,241,.15)",   color: "#818CF8" },
  whatsapp:  { bg: "rgba(37,211,102,.15)",   color: "#25D366" },
  phone:     { bg: "rgba(255,92,53,.15)",    color: "#FF5C35" },
  walkin:    { bg: "rgba(251,191,36,.15)",   color: "#FCD34D" },
};

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number) {
  return `${Math.floor(m/60).toString().padStart(2,"0")}:${(m%60).toString().padStart(2,"0")}`;
}

function getTableIdsFromRes(r: Reservation): string[] {
  if (r.table_ids && r.table_ids.length > 0) return r.table_ids;
  if (r.table_id) return [r.table_id];
  return [];
}

export default function Dashboard() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>([]);
  const [removingBuffer, setRemovingBuffer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { toast, showError, showSuccess, closeToast } = useToast();
  const [view, setView] = useState<"list"|"tables">("list");
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [showWalkin, setShowWalkin] = useState(false);
  const [walkinParty, setWalkinParty] = useState("2");
  const [walkinDate, setWalkinDate] = useState(new Date().toISOString().split("T")[0]);
  const [walkinTime, setWalkinTime] = useState("19:00");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [suggestedTable, setSuggestedTable] = useState<Table | null>(null);
  const [suggestedCombo, setSuggestedCombo] = useState<{tables: Table[]; totalCapacity: number} | null>(null);
  const [walkinName, setWalkinName] = useState("");
  const [savingWalkin, setSavingWalkin] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [newPendingRes, setNewPendingRes] = useState<Reservation | null>(null);
  const [cancelledNotice, setCancelledRes] = useState<Reservation | null>(null);
  const [confirmingRes, setConfirmingRes] = useState(false);
  // Wetter-Spalte rechts: ein- und ausklappbar, Entscheidung wird gemerkt.
  const [showWeather, setShowWeather] = useState(true);
  useEffect(() => {
    try { if (localStorage.getItem("butlery_weather_rail") === "0") setShowWeather(false); } catch {}
  }, []);
  function toggleWeather() {
    setShowWeather(v => {
      const next = !v;
      try { localStorage.setItem("butlery_weather_rail", next ? "1" : "0"); } catch {}
      return next;
    });
  }

  const stayDuration = restaurant?.stay_duration || 150;

  // Dieselben Marken-Token wie Landing und Buchungsseite. Das Dashboard lief
  // vorher auf einem eigenen, waermeren Satz (#F5F0EB / #EDE8E3 / #6B6B80) —
  // zwei Systeme in einem Produkt (§16.4 Familiarity: was gleich aussieht,
  // muss auch gleich sein).
  const bg = "#F5F6F8";
  const surface = "#FFFFFF";
  const border = "#E6E8EC";
  const text = "#1A1A2E";
  const muted = "#5F5F73";
  const sidebarBg = "#1A1A2E";

  // Auto-complete reservations
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const supabase = createClient();
      reservations.forEach(async (r) => {
        if (r.status !== "confirmed") return;
        // Schlechtwetter-Puffer nie automatisch abschliessen — er soll den
        // ganzen Tag blockieren bis er bewusst aufgehoben wird.
        if (isBufferReservation(r)) return;
        if (r.date !== todayStr) return;
        const resMins = timeToMinutes(r.time);
        const endMins = resMins + (restaurant?.stay_duration || 150);
        if (nowMins >= endMins) {
          const { error } = await supabase.from("reservations").update({ status: "completed" }).eq("id", r.id);
          if (error) {
            console.error("Auto-Abschluss fehlgeschlagen:", error);
            showError(errorText(`${r.guest_name} konnte nicht automatisch auf abgeschlossen gesetzt werden.`, error));
            return;
          }
          setReservations(prev => prev.map(x => x.id === r.id ? {...x, status: "completed"} : x));
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [reservations, restaurant, showError]);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    setLoadError("");

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      console.error("Auth-Fehler:", authErr);
      setLoadError(errorText("Deine Sitzung konnte nicht geprüft werden.", authErr));
      setLoading(false);
      return;
    }
    if (!user) { router.push("/login"); return; }

    // Restaurant suchen — tolerant gegen mehrere/keine Treffer (kein .single()).
    // .single() würde bei doppelten Restaurants mit gleicher Mail einen Fehler
    // werfen und eine Onboarding-Schleife auslösen. Wir nehmen das älteste.
    const { data: rests, error: restErr } = await supabase
      .from("restaurants")
      .select("*")
      .eq("email", user.email)
      .order("created_at", { ascending: true })
      .limit(1);
    // Wichtig: bei einem Fehler NICHT nach /onboarding schicken — sonst landet
    // ein Kunde mit Restaurant bei einem Netzwerkfehler im Onboarding.
    if (restErr) {
      console.error("Restaurant laden fehlgeschlagen:", restErr);
      setLoadError(errorText("Dein Restaurant konnte nicht geladen werden.", restErr));
      setLoading(false);
      return;
    }
    const rest = rests && rests.length > 0 ? rests[0] : null;
    if (!rest) { router.push("/onboarding"); return; }
    setRestaurant(rest);

    const { data: res, error: resErr } = await supabase.from("reservations").select("*")
      .eq("restaurant_id", rest.id).order("date").order("time");
    if (resErr) {
      console.error("Reservierungen laden fehlgeschlagen:", resErr);
      setLoadError(errorText("Die Reservierungen konnten nicht geladen werden.", resErr));
      setLoading(false);
      return;
    }
    setReservations(res || []);

    const { data: tbls, error: tblErr } = await supabase.from("tables").select("*").eq("restaurant_id", rest.id).order("name");
    if (tblErr) {
      console.error("Tische laden fehlgeschlagen:", tblErr);
      setLoadError(errorText("Die Tische konnten nicht geladen werden.", tblErr));
      setLoading(false);
      return;
    }
    if (tbls) {
      tbls.sort((a: {name: string}, b: {name: string}) => {
        const numA = parseInt(a.name.replace(/[^0-9]/g, "")) || 0;
        const numB = parseInt(b.name.replace(/[^0-9]/g, "")) || 0;
        return numA - numB || a.name.localeCompare(b.name);
      });
    }
    setTables(tbls || []);

    // Öffnungszeiten werden für den Schlechtwetter-Puffer gebraucht (Blocker
    // über die gesamte Öffnungszeit). Ein Fehler hier darf das Dashboard nicht
    // blockieren — dann fehlt nur die Puffer-Empfehlung.
    const { data: hrs, error: hrsErr } = await supabase
      .from("opening_hours").select("*").eq("restaurant_id", rest.id).order("day_of_week");
    if (hrsErr) {
      console.error("Öffnungszeiten laden fehlgeschlagen:", hrsErr);
      showError(errorText("Die Öffnungszeiten konnten nicht geladen werden — die Wetter-Empfehlung steht deshalb nicht zur Verfügung.", hrsErr));
    }
    setOpeningHours(hrs || []);

    setLoading(false);
  }, [router, showError]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime
  useEffect(() => {
    if (!restaurant?.id) return;
    const supabase = createClient();
    const channel = supabase.channel(`dashboard-${restaurant.id}`);
    // channel als any casten, damit TypeScript nicht an den .on() Überladungen scheitert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (channel as any).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reservations" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: { eventType: string; new: Reservation; old: Reservation }) => {
        const row = payload.new;
        if (!row || row.restaurant_id !== restaurant?.id) return;

        if (payload.eventType === "INSERT") {
          setReservations(prev => prev.some(r => r.id === row.id) ? prev : [...prev, row]);
          // Puffer-Blocker sind keine Gaeste — kein Grossgruppen-Popup dafuer.
          if (!isBufferReservation(row) && row.party_size >= (restaurant?.large_group_threshold || 15)) {
            setNewPendingRes(row);
          }
        } else if (payload.eventType === "UPDATE") {
          setReservations(prev => prev.map(r => r.id === row.id ? row : r));
          if (row.status === "cancelled" && row.channel === "whatsapp") {
            setCancelledRes(row);
          }
        } else if (payload.eventType === "DELETE") {
          const oldRow = payload.old;
          if (oldRow) setReservations(prev => prev.filter(r => r.id !== oldRow.id));
        }
      }
    );
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant?.id, restaurant?.large_group_threshold]);

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Abmelden fehlgeschlagen:", error);
      showError(errorText("Abmelden fehlgeschlagen. Bitte nochmal versuchen.", error));
      return;
    }
    router.push("/login");
  }

  async function confirmReservation(res: Reservation) {
    setConfirmingRes(true);
    const supabase = createClient();
    const { error } = await supabase.from("reservations").update({ status: "confirmed" }).eq("id", res.id);
    if (error) {
      console.error("Bestätigen fehlgeschlagen:", error);
      showError(errorText("Die Reservierung konnte nicht bestätigt werden.", error));
      setConfirmingRes(false);
      return;
    }
    setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: "confirmed" } : r));
    if (res.guest_phone && res.channel === "whatsapp") {
      try {
        await fetch("/api/whatsapp-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: res.guest_phone,
            message: `Deine Reservierung bei ${restaurant?.name} wurde bestätigt!\n\n${new Date(res.date).toLocaleDateString("de-AT", {weekday:"long",day:"numeric",month:"long"})}\n${res.time.slice(0,5)} Uhr\n${res.party_size} ${res.party_size===1?"Person":"Personen"}\n\nWir freuen uns auf dich!`,
          }),
        });
      } catch {}
    }
    setNewPendingRes(null);
    setConfirmingRes(false);
  }

  async function cancelReservation(res: Reservation) {
    setConfirmingRes(true);
    const supabase = createClient();
    const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", res.id);
    if (error) {
      console.error("Stornieren fehlgeschlagen:", error);
      showError(errorText("Die Reservierung konnte nicht storniert werden.", error));
      setConfirmingRes(false);
      return;
    }
    setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: "cancelled" } : r));
    if (res.guest_phone && res.channel === "whatsapp") {
      try {
        await fetch("/api/whatsapp-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: res.guest_phone,
            message: `Deine Reservierungsanfrage bei ${restaurant?.name} für den ${new Date(res.date).toLocaleDateString("de-AT")} um ${res.time.slice(0,5)} Uhr konnte leider nicht bestätigt werden.\n\nBitte kontaktiere uns direkt für einen alternativen Termin.`,
          }),
        });
      } catch {}
    }
    setNewPendingRes(null);
    setConfirmingRes(false);
  }

  async function updateStatus(id: string, status: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (error) {
      console.error("Status ändern fehlgeschlagen:", error);
      showError(errorText("Der Status konnte nicht geändert werden.", error));
      return;
    }
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  async function deleteReservation(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) {
      console.error("Löschen fehlgeschlagen:", error);
      showError(errorText("Die Reservierung konnte nicht gelöscht werden.", error));
      return;
    }
    setReservations(prev => prev.filter(r => r.id !== id));
    setSelectedRes(null);
  }

  async function deleteAllCancelled(): Promise<void> {
    const supabase = createClient();
    const cancelledIds = reservations.filter(r => r.status === "cancelled").map(r => r.id);
    if (cancelledIds.length === 0) return;
    const { error } = await supabase.from("reservations").delete().in("id", cancelledIds);
    if (error) {
      console.error("Stornierte löschen fehlgeschlagen:", error);
      showError(errorText("Die stornierten Reservierungen konnten nicht gelöscht werden.", error));
      return;
    }
    setReservations(prev => prev.filter(r => r.status !== "cancelled"));
    showSuccess(`${cancelledIds.length} stornierte Reservierung${cancelledIds.length > 1 ? "en" : ""} gelöscht.`);
  }

  function suggestTable() {
    const party = parseInt(walkinParty);
    const resOnDay = reservations.filter(r => r.date === walkinDate && r.status !== "cancelled");
    const walkinMins = timeToMinutes(walkinTime);

    function isTableOccupied(tableId: string): boolean {
      return resOnDay.some(r => {
        const blockedIds = getTableIdsFromRes(r);
        if (!blockedIds.includes(tableId)) return false;
        const start = timeToMinutes(r.time);
        const end = start + stayDuration;
        return walkinMins < end && walkinMins + stayDuration > start;
      });
    }

    // 1. Einzeltisch
    const singleTable = tables
      .filter(t => t.capacity >= party && !isTableOccupied(t.id))
      .sort((a, b) => a.capacity - b.capacity)[0];

    if (singleTable) {
      setSuggestedTable(singleTable);
      setSuggestedCombo(null);
      return;
    }

    // 2. Tischkombination
    for (const t of tables) {
      if (!t.combinable_with || t.combinable_with.length === 0) continue;
      if (isTableOccupied(t.id)) continue;
      const combinableTables = t.combinable_with
        .map(id => tables.find(tab => tab.id === id))
        .filter(Boolean) as Table[];
      const allFree = combinableTables.every(ct => !isTableOccupied(ct.id));
      if (!allFree) continue;
      const totalCapacity = t.capacity + combinableTables.reduce((sum, ct) => sum + ct.capacity, 0);
      if (totalCapacity >= party) {
        setSuggestedTable(null);
        setSuggestedCombo({ tables: [t, ...combinableTables], totalCapacity });
        return;
      }
    }

    setSuggestedTable(null);
    setSuggestedCombo(null);
  }

  async function saveWalkin() {
    if (!walkinName || !restaurant) return;
    setSavingWalkin(true);
    const supabase = createClient();
    const party = parseInt(walkinParty);
    const threshold = restaurant.large_group_threshold || 15;

    let tableIds: string[] = [];
    let status = "confirmed";

    if (party >= threshold) {
      status = "pending";
    } else {
      tableIds = suggestedCombo
        ? suggestedCombo.tables.map(t => t.id)
        : suggestedTable ? [suggestedTable.id] : [];
    }

    const { error } = await supabase.from("reservations").insert([{
      restaurant_id: restaurant.id,
      guest_name: walkinName,
      guest_phone: walkinPhone || null,
      party_size: party,
      date: walkinDate,
      time: walkinTime,
      table_id: tableIds[0] || null,
      table_ids: tableIds,
      channel: "walkin",
      status,
    }]);
    if (error) {
      console.error("Walk-in speichern fehlgeschlagen:", error);
      showError(errorText("Der Walk-in konnte nicht gespeichert werden. Deine Eingaben bleiben erhalten.", error));
      setSavingWalkin(false);
      return;
    }
    await loadData();
    showSuccess(`${walkinName} wurde eingetragen.`);
    setShowWalkin(false);
    setSuggestedTable(null);
    setSuggestedCombo(null);
    setWalkinName("");
    setWalkinPhone("");
    setSavingWalkin(false);
  }

  const today = new Date().toISOString().split("T")[0];
  // Schlechtwetter-Puffer (channel 'system') sind keine Gast-Reservierungen:
  // sie tauchen weder in der Liste noch in den Zaehlungen auf, sondern nur als
  // kompakte Puffer-Markierung.
  const guestRes = reservations.filter(r => !isBufferReservation(r));
  const todayRes = guestRes.filter(r => r.date === today);
  const filteredRes = guestRes.filter(r => {
    if (filterChannel === "pending") return r.status === "pending";
    const matchDate = r.date === filterDate;
    const matchChannel = filterChannel === "all" || r.channel === filterChannel;
    return matchDate && matchChannel;
  });

  const bufferRes = bufferReservationsOn(reservations, filterDate);
  const bufferTableNames = Array.from(
    new Set(bufferRes.flatMap(r => tableIdsOf(r)))
  ).map(id => tables.find(t => t.id === id)?.name).filter(Boolean) as string[];

  async function removeBuffer(date: string): Promise<void> {
    setRemovingBuffer(true);
    const supabase = createClient();
    const { error } = await supabase.from("reservations").delete()
      .eq("restaurant_id", restaurant?.id || "")
      .eq("date", date)
      .eq("channel", BUFFER_CHANNEL);
    setRemovingBuffer(false);
    if (error) {
      console.error("Schlechtwetter-Puffer aufheben fehlgeschlagen:", error);
      showError(errorText("Der Schlechtwetter-Puffer konnte nicht aufgehoben werden.", error));
      return;
    }
    setReservations(prev => prev.filter(r => !(r.date === date && isBufferReservation(r))));
    showSuccess("Schlechtwetter-Puffer aufgehoben — die Tische sind wieder buchbar.");
  }

  const stats = {
    today: todayRes.length,
    online: todayRes.filter(r => r.channel === "online").length,
    whatsapp: todayRes.filter(r => r.channel === "whatsapp").length,
    phone: todayRes.filter(r => r.channel === "phone").length,
    walkin: todayRes.filter(r => r.channel === "walkin").length,
    pending: guestRes.filter(r => r.status === "pending").length,
  };

  const cancelledCount = guestRes.filter(r => r.status === "cancelled").length;

  // Zeitachse der Tischkarte aus den echten Oeffnungszeiten des gewaehlten
  // Tages. Vorher lief sie fest von 12:00 bis 22:00 — wer um 11 oeffnet oder
  // bis 1 Uhr offen hat, sah seine Reservierungen ausserhalb der Achse.
  // day_of_week ist 0 = Montag (siehe CLAUDE.md).
  const axisDayIdx = (new Date(`${filterDate}T00:00:00`).getDay() + 6) % 7;
  const axisHour = openingHours.find(h => h.day_of_week === axisDayIdx);
  const axisClosed = !axisHour || axisHour.is_closed;
  const axisStart = axisClosed ? 11 * 60 : timeToMinutes(axisHour!.open_time);
  let axisEnd = axisClosed ? 23 * 60 : timeToMinutes(axisHour!.close_time);
  // Sperrstunde nach Mitternacht (z.B. 01:00) ergibt sonst eine negative Spanne.
  if (axisEnd <= axisStart) axisEnd += 24 * 60;
  const axisSpan = Math.max(60, axisEnd - axisStart);
  const axisTicks: number[] = [];
  for (let m = Math.ceil(axisStart / 60) * 60; m <= axisEnd; m += 60) axisTicks.push(m);

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const showNowLine = filterDate === today && nowMinutes >= axisStart && nowMinutes <= axisEnd;

  function getTableReservations(tableId: string) {
    return filteredRes.filter(r => r.status !== "cancelled" && getTableIdsFromRes(r).includes(tableId));
  }

  function getTableNamesForRes(r: Reservation): string {
    const ids = getTableIdsFromRes(r);
    if (ids.length === 0) return "";
    return ids.map(id => tables.find(t => t.id === id)?.name).filter(Boolean).join(" + ");
  }

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F0EB",fontFamily:"var(--font-sans)",flexDirection:"column",gap:"12px"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:"24px",height:"24px",borderRadius:"50%",border:"2px solid rgba(0,0,0,.1)",borderTopColor:"#FF5C35",animation:"spin 0.7s linear infinite"}}/>
      <div style={{color:"#6B6B80",fontSize:"13px"}}>Wird geladen...</div>
    </div>
  );

  if (loadError) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F0EB",fontFamily:"var(--font-sans)",padding:"24px"}}>
      <div style={{background:"#fff",border:"1px solid #EDE8E3",borderRadius:"16px",padding:"32px",maxWidth:"460px",width:"100%",textAlign:"center"}}>
        <div style={{width:"52px",height:"52px",borderRadius:"50%",background:"#FEE8E8",border:"1px solid rgba(226,75,74,.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#E24B4A" strokeWidth="1.6"/><path d="M11 6.5v5.5M11 15v.5" stroke="#E24B4A" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
        <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"20px",fontWeight:700,color:"#1A1A2E",marginBottom:"8px"}}>Dashboard konnte nicht geladen werden</h2>
        <p style={{fontSize:"13px",color:"#6B6B80",lineHeight:1.6,marginBottom:"20px"}}>{loadError}</p>
        <button onClick={() => { setLoading(true); loadData(); }} style={{
          padding:"11px 24px",borderRadius:"10px",background:"#FF5C35",border:"none",color:"#fff",
          fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
        }}>Erneut versuchen</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:"var(--font-sans)",display:"flex"}}>
      <Toast toast={toast} onClose={closeToast}/>
      <style>{`
        /* Playfair kommt aus next/font (--font-playfair) — kein zweiter Ladeweg. */
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(252,211,77,.4)}50%{box-shadow:0 0 0 8px rgba(252,211,77,0)}}

        .nav-btn{transition:background .15s ease, color .15s ease, transform .15s cubic-bezier(.16,1,.3,1);}
        .nav-btn:hover{background:rgba(255,255,255,.08)!important;}
        .nav-btn:active{transform:scale(.985);}

        .res-row{transition:background .15s ease;}
        .res-row:hover{background:#F7F8FA!important;}

        /* §1 Response: Rueckmeldung auf den Druck, nicht erst auf das Loslassen. */
        .tap{transition:transform .18s cubic-bezier(.16,1,.3,1), background .15s ease, border-color .15s ease;}
        .tap:active{transform:scale(.97);}

        /* Sichtbarer Fokus fuer Tastaturbedienung — vorher gab es keinen. */
        button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible,
        [role="button"]:focus-visible{
          outline:2px solid #FF5C35; outline-offset:2px; border-radius:8px;
        }

        select{appearance:none;-webkit-appearance:none;}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(26,26,46,.14);border-radius:3px;}

        /* §14 — Bewegung reduzieren: keine Skalierungen, kein Pulsieren. */
        @media(prefers-reduced-motion:reduce){
          .tap:active,.nav-btn:active{transform:none!important;}
          *{animation-duration:.01ms!important;animation-iteration-count:1!important;}
        }

        @media(max-width:1100px){
          .dash-split{grid-template-columns:1fr!important;}
          .dash-rail{position:static!important;width:auto!important;}
        }
        @media(max-width:720px){
          .dash-stats{grid-template-columns:repeat(2,1fr)!important;}
          .res-grid{grid-template-columns:64px 1fr!important;}
          .res-grid > .res-hide{display:none!important;}
        }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{width:"220px",background:sidebarBg,display:"flex",flexDirection:"column",padding:"20px 12px",position:"fixed",top:0,bottom:0,left:0,zIndex:50}}>
        {/* Helle Wortmarke: die dunkle stand hier auf dunklem Grund und war
            faktisch unsichtbar. */}
        <a href="/dashboard" aria-label="Butlery — Dashboard" style={{display:"block",marginBottom:"30px",padding:"2px 8px",lineHeight:0}}>
          <img src="/butlery-logo-hell.png" alt="Butlery" style={{height:"26px",width:"auto",display:"block"}}/>
        </a>

        {[
          {label:"Dashboard",path:"/dashboard",active:true,icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/></svg>},
          {label:"Neue Reservierung",path:"/dashboard/new",active:false,icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>},
          {label:"Einstellungen",path:"/dashboard/settings",active:false,icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5V4M8 12v2.5M1.5 8H4M12 8h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>},
        ].map((item,i) => (
          <button key={i} className="nav-btn" onClick={() => router.push(item.path)} style={{
            display:"flex",alignItems:"center",gap:"10px",padding:"9px 10px",borderRadius:"8px",
            background: item.active ? "rgba(255,92,53,.15)" : "transparent",
            border: item.active ? "1px solid rgba(255,92,53,.2)" : "1px solid transparent",
            color: item.active ? "#FF5C35" : "rgba(255,255,255,.45)",
            fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
            marginBottom:"2px",textAlign:"left",transition:"all .15s",width:"100%",
          }}>
            {item.icon}{item.label}
          </button>
        ))}

        <div style={{marginTop:"auto",display:"flex",flexDirection:"column",gap:"8px"}}>
          {restaurant && (
            <div style={{background:"rgba(255,255,255,.05)",borderRadius:"8px",padding:"10px 12px"}}>
              <div style={{fontSize:"10px",color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"3px"}}>Restaurant</div>
              <div style={{fontSize:"13px",color:"#FFFAF5",fontWeight:500}}>{restaurant.name}</div>
              <a href={`/book/${restaurant.slug}`} target="_blank" style={{fontSize:"10px",color:"#FF5C35",textDecoration:"none",display:"block",marginTop:"3px"}}>Booking Link →</a>
            </div>
          )}
          <button onClick={handleLogout} style={{
            display:"flex",alignItems:"center",gap:"8px",padding:"9px 10px",borderRadius:"8px",
            background:"transparent",border:"1px solid rgba(255,255,255,.08)",
            color:"rgba(255,255,255,.3)",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Abmelden
          </button>
        </div>
      </aside>

      <main style={{marginLeft:"220px",flex:1,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <header style={{height:"56px",borderBottom:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",background:"rgba(245,240,235,.95)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:40}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"13px",color:muted}}>Butlery</span>
            <span style={{color:muted,fontSize:"12px"}}>›</span>
            <span style={{fontSize:"13px",color:text,fontWeight:500}}>Dashboard</span>
            {restaurant && <><span style={{color:muted,fontSize:"12px"}}>›</span><span style={{fontSize:"13px",color:muted}}>{restaurant.name}</span></>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            {/* Ausgeblendetes Wetter muss zurueckholbar sein — sonst ist das
                Ausblenden eine Sackgasse (§16.2 Agency). */}
            {!showWeather && (
              <button className="tap" onClick={toggleWeather} style={{
                display:"flex",alignItems:"center",gap:"6px",padding:"7px 13px",borderRadius:"8px",
                background:surface,border:`1px solid ${border}`,
                color:muted,fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
              }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M7 1v1.6M7 11.4V13M1 7h1.6M11.4 7H13M2.8 2.8l1.1 1.1M10.1 10.1l1.1 1.1M11.2 2.8l-1.1 1.1M3.9 10.1l-1.1 1.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                Wetter einblenden
              </button>
            )}
            <button className="tap" onClick={() => setShowWalkin(true)} style={{
              display:"flex",alignItems:"center",gap:"6px",padding:"7px 14px",borderRadius:"8px",
              background:"rgba(251,191,36,.14)",border:"1px solid rgba(251,191,36,.3)",
              color:"#9A6B00",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",
            }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Walk-in
            </button>
          </div>
        </header>

        <div style={{padding:"24px",flex:1}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"24px",flexWrap:"wrap",gap:"12px"}}>
            <div>
              <h1 style={{fontFamily:"var(--font-playfair),serif",fontSize:"26px",fontWeight:700,color:text,letterSpacing:"-.5px",marginBottom:"4px"}}>
                {new Date().getHours() < 12 ? "Guten Morgen" : new Date().getHours() < 18 ? "Guten Tag" : "Guten Abend"}{restaurant ? `, ${restaurant.name}` : ""}
              </h1>
              <p style={{fontSize:"13px",color:muted,fontWeight:300}}>
                {new Date().toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
              </p>
            </div>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                style={{padding:"7px 12px",borderRadius:"8px",border:`1px solid ${border}`,background:surface,color:text,fontSize:"13px",fontFamily:"inherit",outline:"none",cursor:"pointer"}}
              />
            </div>
          </div>

          {/* Pending Alert */}
          {stats.pending > 0 && (
            <div onClick={() => setFilterChannel("pending")}
              style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 16px",
                background:"rgba(251,191,36,.1)",border:"1px solid rgba(251,191,36,.25)",
                borderRadius:"10px",marginBottom:"16px",cursor:"pointer"}}>
              <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#FCD34D",flexShrink:0,animation:"pulseGlow 2s infinite"}}/>
              <span style={{fontSize:"13px",color:"#D97706",fontWeight:500}}>
                {stats.pending} ausstehende Reservierung{stats.pending>1?"en":""} — Klicken zum Anzeigen
              </span>
            </div>
          )}

          {/* Zweispaltig: links die Arbeit, rechts das Wetter als Beiwerk.
              Ohne Wetter faellt die rechte Spalte weg statt leer zu stehen. */}
          <div className="dash-split" style={{
            display:"grid",
            gridTemplateColumns: showWeather ? "minmax(0,1fr) 320px" : "minmax(0,1fr)",
            gap:"20px",alignItems:"start",
          }}>
          <div style={{minWidth:0}}>

          {/* KENNZAHLEN — eine Zahl fuehrt, die Kanaele ordnen sich unter.
              Vorher standen sechs gleich grosse Karten nebeneinander, in denen
              die wichtigste Zahl nicht mehr zu erkennen war (§16.6). */}
          <div style={{background:surface,border:`1px solid ${border}`,borderRadius:"14px",padding:"18px 20px",marginBottom:"16px"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:"12px",marginBottom:"16px",flexWrap:"wrap"}}>
              <span style={{fontFamily:"var(--font-playfair),serif",fontSize:"38px",fontWeight:700,color:text,letterSpacing:"-0.035em",lineHeight:1}}>
                {stats.today}
              </span>
              <span style={{fontSize:"14px",color:muted}}>
                {stats.today === 1 ? "Reservierung heute" : "Reservierungen heute"}
              </span>
              {stats.pending > 0 && (
                <span style={{marginLeft:"auto",fontSize:"12px",fontWeight:600,color:"#9A6B00",background:"rgba(251,191,36,.16)",border:"1px solid rgba(251,191,36,.3)",padding:"4px 11px",borderRadius:"100px"}}>
                  {stats.pending} ausstehend
                </span>
              )}
            </div>
            <div className="dash-stats" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1px",background:border,border:`1px solid ${border}`,borderRadius:"10px",overflow:"hidden"}}>
              {[
                {label:"Online",val:stats.online,color:"#6366F1"},
                {label:"WhatsApp",val:stats.whatsapp,color:"#1A9D52"},
                {label:"Telefon",val:stats.phone,color:"#FF5C35"},
                {label:"Walk-in",val:stats.walkin,color:"#9A6B00"},
              ].map((s,i) => (
                <div key={i} style={{background:surface,padding:"11px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"3px"}}>
                    <span style={{width:"6px",height:"6px",borderRadius:"50%",background:s.color,flexShrink:0}}/>
                    <span style={{fontSize:"12px",color:muted}}>{s.label}</span>
                  </div>
                  <div style={{fontSize:"19px",fontWeight:600,color:text,letterSpacing:"-0.02em"}}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {bufferRes.length > 0 && (
            <div style={{
              display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",
              padding:"10px 16px",background:surface,border:`1px solid ${border}`,
              borderRadius:"10px",marginBottom:"16px",
            }}>
              <span style={{fontSize:"13px",color:text,fontWeight:500}}>
                Schlechtwetter-Puffer aktiv: {bufferTableNames.join(", ") || "—"}
              </span>
              <span style={{fontSize:"12px",color:muted}}>
                — bleibt an diesem Tag in allen Kanälen gesperrt
              </span>
              <button onClick={() => removeBuffer(filterDate)} disabled={removingBuffer} style={{
                marginLeft:"auto",padding:"6px 14px",borderRadius:"7px",background:"transparent",
                border:`1px solid ${border}`,color:muted,fontSize:"12px",cursor:"pointer",
                fontFamily:"inherit",opacity:removingBuffer?0.6:1,
              }}>
                {removingBuffer ? "Wird aufgehoben..." : "Aufheben"}
              </button>
            </div>
          )}

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px",flexWrap:"wrap",gap:"10px"}}>
            <div style={{display:"flex",gap:"3px",background:surface,border:`1px solid ${border}`,borderRadius:"10px",padding:"3px"}}>
              {[{k:"list",l:"Liste"},{k:"tables",l:"Tischkarte"}].map(v => (
                <button key={v.k} className="tap" aria-pressed={view===v.k} onClick={() => setView(v.k as "list"|"tables")} style={{
                  padding:"7px 18px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:"none",
                  background: view===v.k ? text : "transparent",
                  color: view===v.k ? "#fff" : muted,
                }}>{v.l}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap",alignItems:"center"}}>
              {stats.pending > 0 && (
                <button className="tap" onClick={() => setFilterChannel("pending")} aria-pressed={filterChannel==="pending"} style={{
                  padding:"6px 13px",borderRadius:"100px",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                  border:"1px solid rgba(251,191,36,.35)",
                  background: filterChannel==="pending" ? "rgba(251,191,36,.28)" : "rgba(251,191,36,.1)",
                  color:"#9A6B00",
                }}>Ausstehend ({stats.pending})</button>
              )}
              {CHANNELS.map(c => (
                <button key={c.key} className="tap" onClick={() => setFilterChannel(c.key)} aria-pressed={filterChannel===c.key} style={{
                  padding:"6px 13px",borderRadius:"100px",fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                  border:`1px solid ${filterChannel===c.key ? "#FF5C35" : border}`,
                  background: filterChannel===c.key ? "#FF5C35" : surface,
                  color: filterChannel===c.key ? "#fff" : muted,
                }}>{c.label}</button>
              ))}
              {cancelledCount > 0 && (
                <button className="tap" onClick={deleteAllCancelled} style={{
                  padding:"6px 13px",borderRadius:"100px",fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                  border:`1px solid ${border}`,background:surface,color:muted,
                  display:"flex",alignItems:"center",gap:"6px",
                }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 3h7M4.2 3V2h2.6v1M3 3l.4 6h4.2L8 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Stornierte löschen ({cancelledCount})
                </button>
              )}
            </div>
          </div>

          {/* LISTE — die Uhrzeit fuehrt die Zeile an, nicht der Name.
              Im Service liest man nach Zeit, nicht alphabetisch (§16.6:
              das Wichtigste soll das Auffaelligste sein). */}
          {view === "list" && (
            <div style={{background:surface,border:`1px solid ${border}`,borderRadius:"14px",overflow:"hidden"}}>
              <div className="res-grid" style={{
                display:"grid",gridTemplateColumns:"64px minmax(0,1fr) 84px 120px 104px 136px",gap:"12px",
                padding:"11px 18px",borderBottom:`1px solid ${border}`,background:"#FAFBFC",
              }}>
                {["Zeit","Gast","Personen","Tisch","Kanal","Status"].map((h,i)=>(
                  <div key={i} className={i>1?"res-hide":undefined} style={{fontSize:"11px",fontWeight:600,color:muted,letterSpacing:"0.02em"}}>{h}</div>
                ))}
              </div>
              {filteredRes.length === 0 ? (
                <div style={{padding:"56px 24px",textAlign:"center"}}>
                  <div style={{fontSize:"14px",color:text,fontWeight:500,marginBottom:"5px"}}>Keine Reservierungen</div>
                  <div style={{fontSize:"13px",color:muted,lineHeight:1.6}}>
                    {filterChannel === "all"
                      ? "Für diesen Tag ist noch nichts eingetragen."
                      : "Für diesen Filter gibt es nichts — probier es mit „Alle“."}
                  </div>
                </div>
              ) : filteredRes.map((r,i) => {
                const isCancelled = r.status === "cancelled";
                const ch = CHANNEL_COLORS[r.channel] || {bg:"rgba(26,26,46,.05)",color:muted};
                // Beim Ausstehend-Filter stehen fremde Tage in der Liste —
                // dann muss das Datum sichtbar sein, sonst wirkt es wie heute.
                const otherDay = r.date !== filterDate;
                return (
                <div key={r.id} className="res-row res-grid" role="button" tabIndex={0}
                  onClick={() => setSelectedRes(r)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedRes(r); } }}
                  style={{
                    display:"grid",gridTemplateColumns:"64px minmax(0,1fr) 84px 120px 104px 136px",gap:"12px",
                    padding:"13px 18px",borderBottom:i<filteredRes.length-1?`1px solid ${border}`:"none",
                    alignItems:"center",cursor:"pointer",
                    opacity: isCancelled ? 0.5 : 1,
                  }}>
                  <div>
                    <div style={{fontSize:"15px",fontWeight:600,color:text,letterSpacing:"-0.01em",fontVariantNumeric:"tabular-nums",textDecoration:isCancelled?"line-through":"none"}}>
                      {r.time.slice(0,5)}
                    </div>
                    {otherDay && (
                      <div style={{fontSize:"11px",color:muted,marginTop:"1px"}}>
                        {new Date(r.date).toLocaleDateString("de-AT",{day:"numeric",month:"short"})}
                      </div>
                    )}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:"14px",fontWeight:500,color:text,textDecoration:isCancelled?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {r.guest_name}
                    </div>
                    <div style={{fontSize:"12px",color:muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {[r.guest_phone, r.has_pet ? "Haustier dabei" : null, r.notes].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="res-hide" style={{fontSize:"13px",color:muted,fontVariantNumeric:"tabular-nums"}}>{r.party_size}</div>
                  <div className="res-hide" style={{fontSize:"13px",color:getTableNamesForRes(r)?text:muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {getTableNamesForRes(r) || "kein Tisch"}
                  </div>
                  <div className="res-hide">
                    <span style={{background:ch.bg,color:ch.color,fontSize:"11px",fontWeight:600,padding:"4px 9px",borderRadius:"100px",whiteSpace:"nowrap"}}>
                      {r.channel==="online"?"Online":r.channel==="whatsapp"?"WhatsApp":r.channel==="phone"?"Telefon":"Walk-in"}
                    </span>
                  </div>
                  <div className="res-hide">
                    {isCancelled ? (
                      <button className="tap" onClick={e=>{e.stopPropagation();deleteReservation(r.id);}} style={{
                        fontSize:"12px",fontWeight:500,padding:"6px 11px",borderRadius:"8px",cursor:"pointer",fontFamily:"inherit",
                        background:surface,color:muted,border:`1px solid ${border}`,
                        display:"flex",alignItems:"center",gap:"6px",
                      }}>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 3h7M4.2 3V2h2.6v1M3 3l.4 6h4.2L8 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Löschen
                      </button>
                    ) : (
                      <select value={r.status} onClick={e => e.stopPropagation()} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>updateStatus(r.id,e.target.value)} style={{
                        fontSize:"12px",fontWeight:600,padding:"6px 10px",borderRadius:"8px",cursor:"pointer",fontFamily:"inherit",
                        outline:"none",width:"100%",...STATUS_COLORS[r.status],border:`1px solid ${STATUS_COLORS[r.status]?.border||border}`,
                      }}>
                        <option value="confirmed">Bestätigt</option>
                        <option value="pending">Ausstehend</option>
                        <option value="cancelled">Storniert</option>
                        <option value="completed">Abgeschlossen</option>
                      </select>
                    )}
                  </div>
                </div>
              );})}
            </div>
          )}

          {/* TISCHKARTE — EINE Zeitachse oben, darunter je Tisch eine Spur.
              Vorher trug jede Tischzeile ihre eigene Skala, die Stunden-
              beschriftung lag in den Balken und die Achse endete fix um 22:00. */}
          {view === "tables" && (
            <div style={{background:surface,border:`1px solid ${border}`,borderRadius:"14px",overflow:"hidden"}}>
              {tables.length === 0 ? (
                <div style={{padding:"56px 24px",textAlign:"center"}}>
                  <div style={{fontSize:"14px",color:text,fontWeight:500,marginBottom:"5px"}}>Noch keine Tische</div>
                  <div style={{fontSize:"13px",color:muted}}>Lege sie in den Einstellungen an, dann erscheint hier die Tischkarte.</div>
                </div>
              ) : axisClosed ? (
                <div style={{padding:"56px 24px",textAlign:"center"}}>
                  <div style={{fontSize:"14px",color:text,fontWeight:500,marginBottom:"5px"}}>An diesem Tag geschlossen</div>
                  <div style={{fontSize:"13px",color:muted}}>Für den gewählten Tag sind keine Öffnungszeiten hinterlegt.</div>
                </div>
              ) : (
                <>
                  {/* Zeitachse */}
                  <div style={{display:"grid",gridTemplateColumns:"156px minmax(0,1fr)",borderBottom:`1px solid ${border}`,background:"#FAFBFC"}}>
                    <div style={{padding:"9px 16px",fontSize:"11px",fontWeight:600,color:muted}}>Tisch</div>
                    <div style={{position:"relative",height:"32px"}}>
                      {axisTicks.map(m => {
                        const pct = ((m - axisStart) / axisSpan) * 100;
                        if (pct < 0 || pct > 100) return null;
                        return (
                          <div key={m} style={{position:"absolute",left:`${pct}%`,top:0,bottom:0,display:"flex",alignItems:"center"}}>
                            <span style={{fontSize:"11px",color:muted,transform:"translateX(-50%)",fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap"}}>
                              {minutesToTime(m % (24*60))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {tables.map((table,ti) => {
                    const tableRes = getTableReservations(table.id);
                    const hasBuffer = bufferRes.some(r => tableIdsOf(r).includes(table.id));
                    const free = tableRes.length === 0 && !hasBuffer;
                    return (
                      <div key={table.id} style={{
                        display:"grid",gridTemplateColumns:"156px minmax(0,1fr)",
                        borderBottom: ti < tables.length-1 ? `1px solid ${border}` : "none",
                      }}>
                        <div style={{padding:"12px 16px",borderRight:`1px solid ${border}`,minWidth:0}}>
                          <div style={{fontSize:"13px",fontWeight:600,color:text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{table.name}</div>
                          <div style={{fontSize:"11px",color:muted,marginTop:"2px"}}>
                            {table.capacity} Pers.{table.is_outdoor ? " · Außen" : ""}
                          </div>
                        </div>
                        <div style={{position:"relative",height:"52px",background: free ? "transparent" : "rgba(26,26,46,.02)"}}>
                          {/* Stundenraster */}
                          {axisTicks.map(m => {
                            const pct = ((m - axisStart) / axisSpan) * 100;
                            if (pct < 0 || pct > 100) return null;
                            return <div key={m} style={{position:"absolute",left:`${pct}%`,top:0,bottom:0,width:"1px",background:"rgba(26,26,46,.06)"}}/>;
                          })}

                          {/* Jetzt-Linie, nur am heutigen Tag */}
                          {showNowLine && (
                            <div aria-hidden="true" style={{
                              position:"absolute",left:`${((nowMinutes-axisStart)/axisSpan)*100}%`,top:0,bottom:0,
                              width:"2px",background:"#FF5C35",opacity:.65,
                            }}/>
                          )}

                          {hasBuffer && (
                            <div title="Schlechtwetter-Puffer — an diesem Tag gesperrt" style={{
                              position:"absolute",inset:"6px 0",
                              background:"repeating-linear-gradient(45deg,rgba(26,26,46,.07) 0 6px,transparent 6px 12px)",
                              display:"flex",alignItems:"center",justifyContent:"center",
                            }}>
                              <span style={{fontSize:"11px",color:muted,fontWeight:500}}>Schlechtwetter-Puffer</span>
                            </div>
                          )}

                          {tableRes.map(r => {
                            const startM = timeToMinutes(r.time);
                            const left = Math.max(0, ((startM - axisStart) / axisSpan) * 100);
                            const width = Math.min((stayDuration / axisSpan) * 100, 100 - left);
                            const colors = STATUS_COLORS[r.status] || STATUS_COLORS.confirmed;
                            if (width <= 0) return null;
                            return (
                              <button key={r.id} className="tap"
                                onClick={() => setSelectedRes(r)}
                                title={`${r.guest_name} · ${r.party_size} Pers. · ${r.time.slice(0,5)}`}
                                style={{
                                  position:"absolute",left:`${left}%`,width:`${width}%`,top:"7px",bottom:"7px",
                                  background:colors.bg,border:`1px solid ${colors.border}`,borderLeft:`3px solid ${colors.color}`,
                                  borderRadius:"7px",cursor:"pointer",fontFamily:"inherit",
                                  display:"flex",alignItems:"center",gap:"6px",padding:"0 8px",overflow:"hidden",textAlign:"left",
                                }}>
                                <span style={{fontSize:"12px",fontWeight:600,color:text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                                  {r.guest_name}
                                </span>
                                <span style={{fontSize:"11px",color:muted,whiteSpace:"nowrap"}}>{r.party_size}P</span>
                              </button>
                            );
                          })}

                          {free && (
                            <span style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",fontSize:"12px",color:"#9AA0AC"}}>
                              frei
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Legende — ohne sie sind die Farben Ratespiel (§16.7) */}
                  <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap",padding:"11px 16px",borderTop:`1px solid ${border}`,background:"#FAFBFC"}}>
                    {[
                      {l:"Bestätigt",c:STATUS_COLORS.confirmed.color},
                      {l:"Ausstehend",c:STATUS_COLORS.pending.color},
                      {l:"Abgeschlossen",c:STATUS_COLORS.completed.color},
                    ].map(x => (
                      <span key={x.l} style={{display:"inline-flex",alignItems:"center",gap:"6px",fontSize:"11px",color:muted}}>
                        <span style={{width:"10px",height:"10px",borderRadius:"3px",background:x.c,flexShrink:0}}/>{x.l}
                      </span>
                    ))}
                    {showNowLine && (
                      <span style={{display:"inline-flex",alignItems:"center",gap:"6px",fontSize:"11px",color:muted}}>
                        <span style={{width:"2px",height:"11px",background:"#FF5C35",flexShrink:0}}/>jetzt
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          </div>{/* Ende linke Spalte */}

          {/* WETTER-SPALTE */}
          {showWeather && restaurant && (
            <aside className="dash-rail" style={{position:"sticky",top:"76px"}}>
              <WeatherPanel
                compact
                restaurantId={restaurant.id}
                tables={tables}
                reservations={reservations}
                openingHours={openingHours}
                stayDuration={stayDuration}
                onBufferChange={loadData}
                onRemoveBuffer={removeBuffer}
                removingBuffer={removingBuffer}
                showError={showError}
                showSuccess={showSuccess}
                onHide={toggleWeather}
              />
            </aside>
          )}
          </div>{/* Ende Split */}
        </div>
      </main>

      {/* GROSSGRUPPEN POPUP */}
      {newPendingRes && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:"24px"}}>
          <div style={{background:"#fff",borderRadius:"20px",padding:"32px",width:"100%",maxWidth:"460px",boxShadow:"0 40px 80px rgba(0,0,0,.3)",animation:"slideIn .3s ease"}}>
            <div style={{textAlign:"center",marginBottom:"24px"}}>
              <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"rgba(251,191,36,.15)",border:"2px solid rgba(251,191,36,.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z" fill="#FCD34D"/></svg>
              </div>
              <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E",marginBottom:"6px"}}>
                Großgruppen-Anfrage
              </h3>
              <p style={{fontSize:"13px",color:"#6B6B80",fontWeight:300}}>
                {newPendingRes.party_size} Personen — manuelle Bestätigung erforderlich
              </p>
            </div>
            <div style={{background:"#F5F0EB",borderRadius:"12px",padding:"16px 20px",marginBottom:"24px"}}>
              {[
                {l:"Name", v:newPendingRes.guest_name},
                {l:"Datum", v:new Date(newPendingRes.date).toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long"})},
                {l:"Uhrzeit", v:`${newPendingRes.time.slice(0,5)} Uhr`},
                {l:"Personen", v:`${newPendingRes.party_size} Personen`},
                ...(newPendingRes.guest_phone ? [{l:"Telefon", v:newPendingRes.guest_phone}] : []),
                {l:"Kanal", v:newPendingRes.channel==="whatsapp"?"WhatsApp":newPendingRes.channel==="online"?"Online":newPendingRes.channel==="phone"?"Telefon":"Walk-in"},
              ].map((r,i,arr)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<arr.length-1?"1px solid #EDE8E3":"none",fontSize:"14px"}}>
                  <span style={{color:"#6B6B80"}}>{r.l}</span>
                  <span style={{fontWeight:500,color:"#1A1A2E"}}>{r.v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              <button onClick={()=>cancelReservation(newPendingRes)} disabled={confirmingRes} style={{
                flex:1,padding:"12px",borderRadius:"10px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",
                color:"#F87171",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                opacity:confirmingRes?0.6:1,minWidth:"100px",
              }}>
                ✕ Stornieren
              </button>
              <button onClick={()=>setNewPendingRes(null)} style={{
                flex:1,padding:"12px",borderRadius:"10px",background:"rgba(251,191,36,.1)",border:"1px solid rgba(251,191,36,.2)",
                color:"#D97706",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",minWidth:"100px",
              }}>
                ⏸ Aufschieben
              </button>
              <button onClick={()=>confirmReservation(newPendingRes)} disabled={confirmingRes} style={{
                flex:2,padding:"12px",borderRadius:"10px",background:"#FF5C35",border:"none",
                color:"#fff",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                opacity:confirmingRes?0.6:1,minWidth:"140px",
              }}>
                {confirmingRes?"Wird gespeichert...":"✓ Bestätigen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP STORNO POPUP */}
      {cancelledNotice && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:"24px"}}>
          <div style={{background:"#fff",borderRadius:"20px",padding:"32px",width:"100%",maxWidth:"460px",boxShadow:"0 40px 80px rgba(0,0,0,.3)",animation:"slideIn .3s ease"}}>
            <div style={{textAlign:"center",marginBottom:"24px"}}>
              <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"rgba(239,68,68,.12)",border:"2px solid rgba(239,68,68,.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#F87171" strokeWidth="1.6"/><path d="M15 9l-6 6M9 9l6 6" stroke="#F87171" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </div>
              <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E",marginBottom:"6px"}}>
                Stornierung per WhatsApp
              </h3>
              <p style={{fontSize:"13px",color:"#6B6B80",fontWeight:300}}>
                Ein Gast hat seine Reservierung selbst storniert
              </p>
            </div>
            <div style={{background:"#F5F0EB",borderRadius:"12px",padding:"16px 20px",marginBottom:"24px"}}>
              {[
                {l:"Name", v:cancelledNotice.guest_name},
                {l:"Datum", v:new Date(cancelledNotice.date).toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long"})},
                {l:"Uhrzeit", v:`${cancelledNotice.time.slice(0,5)} Uhr`},
                {l:"Personen", v:`${cancelledNotice.party_size} Personen`},
                ...(cancelledNotice.guest_phone ? [{l:"Telefon", v:cancelledNotice.guest_phone}] : []),
              ].map((r,i,arr)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<arr.length-1?"1px solid #EDE8E3":"none",fontSize:"14px"}}>
                  <span style={{color:"#6B6B80"}}>{r.l}</span>
                  <span style={{fontWeight:500,color:"#1A1A2E"}}>{r.v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{ if(cancelledNotice) deleteReservation(cancelledNotice.id); setCancelledRes(null); }} style={{
                flex:1,padding:"12px",borderRadius:"10px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",
                color:"#F87171",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
              }}>
                Löschen
              </button>
              <button onClick={()=>setCancelledRes(null)} style={{
                flex:2,padding:"12px",borderRadius:"10px",background:"#1A1A2E",border:"none",
                color:"#fff",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
              }}>
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RES DETAIL */}
      {selectedRes && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"24px"}}
          onClick={e=>{if(e.target===e.currentTarget)setSelectedRes(null);}}>
          <div style={{background:"#fff",borderRadius:"20px",padding:"32px",width:"100%",maxWidth:"480px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px"}}>
              <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E"}}>Reservierungsdetails</h3>
              <button onClick={()=>setSelectedRes(null)} style={{background:"transparent",border:"none",color:"#6B6B80",cursor:"pointer",fontSize:"20px"}}>✕</button>
            </div>
            <div style={{background:"#F5F0EB",borderRadius:"12px",padding:"20px",marginBottom:"20px"}}>
              {[
                {l:"Gast", v:selectedRes.guest_name},
                {l:"Telefon", v:selectedRes.guest_phone||"—"},
                {l:"E-Mail", v:selectedRes.guest_email||"—"},
                {l:"Datum", v:new Date(selectedRes.date).toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})},
                {l:"Uhrzeit", v:`${selectedRes.time.slice(0,5)} – ${minutesToTime(timeToMinutes(selectedRes.time)+(restaurant?.stay_duration||150))} Uhr`},
                {l:"Personen", v:`${selectedRes.party_size} ${selectedRes.party_size===1?"Person":"Personen"}`},
                {l:"Tisch", v:getTableNamesForRes(selectedRes)||"Nicht zugewiesen"},
                {l:"Kanal", v:selectedRes.channel==="whatsapp"?"WhatsApp":selectedRes.channel==="online"?"Online":selectedRes.channel==="phone"?"Telefon":"Walk-in"},
                ...(selectedRes.has_pet ? [{l:"Haustier", v:"Haustier dabei"}] : []),
                ...(selectedRes.notes ? [{l:"Notizen", v:selectedRes.notes}] : []),
              ].map((row,i,arr)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #EDE8E3":"none",fontSize:"14px",gap:"16px"}}>
                  <span style={{color:"#6B6B80",flexShrink:0}}>{row.l}</span>
                  <span style={{fontWeight:500,color:"#1A1A2E",textAlign:"right"}}>{row.v}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <select value={selectedRes.status} onChange={async e=>{
                await updateStatus(selectedRes.id, e.target.value);
                setSelectedRes({...selectedRes, status: e.target.value});
              }} style={{
                flex:1,padding:"10px 12px",borderRadius:"8px",border:"1px solid #EDE8E3",
                background:"#fff",color:"#1A1A2E",fontSize:"13px",fontFamily:"inherit",cursor:"pointer",outline:"none",
              }}>
                <option value="confirmed">✓ Bestätigt</option>
                <option value="pending">◐ Ausstehend</option>
                <option value="cancelled">✕ Storniert</option>
                <option value="completed">● Abgeschlossen</option>
              </select>
              <button onClick={()=>setSelectedRes(null)} style={{flex:1,padding:"10px",borderRadius:"8px",background:"#FF5C35",border:"none",color:"#fff",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WALK-IN MODAL */}
      {showWalkin && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"24px"}} onClick={e=>{if(e.target===e.currentTarget){setShowWalkin(false);setSuggestedTable(null);setSuggestedCombo(null);}}}>
          <div style={{background:"#fff",borderRadius:"16px",padding:"28px",width:"100%",maxWidth:"460px",border:`1px solid ${border}`,maxHeight:"90vh",overflow:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
              <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"20px",fontWeight:700,color:text}}>Walk-in / Neue Reservierung</h3>
              <button onClick={()=>{setShowWalkin(false);setSuggestedTable(null);setSuggestedCombo(null);}} style={{background:"transparent",border:"none",color:muted,cursor:"pointer",fontSize:"18px"}}>✕</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"16px"}}>
              <div>
                <label style={{fontSize:"11px",fontWeight:600,color:muted,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Name des Gastes *</label>
                <input value={walkinName} onChange={e=>setWalkinName(e.target.value)} placeholder="Max Mustermann"
                  style={{width:"100%",padding:"9px 12px",borderRadius:"8px",border:`1px solid ${border}`,background:"#f9f9f9",color:text,fontSize:"14px",fontFamily:"inherit",outline:"none"}}/>
              </div>
              <div>
                <label style={{fontSize:"11px",fontWeight:600,color:muted,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Telefon</label>
                <input value={walkinPhone} onChange={e=>setWalkinPhone(e.target.value)} placeholder="+43 660 123456"
                  style={{width:"100%",padding:"9px 12px",borderRadius:"8px",border:`1px solid ${border}`,background:"#f9f9f9",color:text,fontSize:"14px",fontFamily:"inherit",outline:"none"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                <div>
                  <label style={{fontSize:"11px",fontWeight:600,color:muted,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Personen</label>
                  <select value={walkinParty} onChange={e=>{setWalkinParty(e.target.value);setSuggestedTable(null);setSuggestedCombo(null);}}
                    style={{width:"100%",padding:"9px 12px",borderRadius:"8px",border:`1px solid ${border}`,background:"#f9f9f9",color:text,fontSize:"14px",fontFamily:"inherit",outline:"none"}}>
                    {[1,2,3,4,5,6,7,8,10,12,15,20,25,30].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:"11px",fontWeight:600,color:muted,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Datum</label>
                  <input type="date" value={walkinDate} onChange={e=>{setWalkinDate(e.target.value);setSuggestedTable(null);setSuggestedCombo(null);}}
                    style={{width:"100%",padding:"9px 8px",borderRadius:"8px",border:`1px solid ${border}`,background:"#f9f9f9",color:text,fontSize:"13px",fontFamily:"inherit",outline:"none"}}/>
                </div>
                <div>
                  <label style={{fontSize:"11px",fontWeight:600,color:muted,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Uhrzeit</label>
                  <input type="time" value={walkinTime} onChange={e=>{setWalkinTime(e.target.value);setSuggestedTable(null);setSuggestedCombo(null);}}
                    style={{width:"100%",padding:"9px 8px",borderRadius:"8px",border:`1px solid ${border}`,background:"#f9f9f9",color:text,fontSize:"13px",fontFamily:"inherit",outline:"none"}}/>
                </div>
              </div>

              {parseInt(walkinParty) >= (restaurant?.large_group_threshold || 15) ? (
                <div style={{background:"rgba(252,211,77,.15)",border:"1px solid rgba(252,211,77,.3)",borderRadius:"10px",padding:"12px 14px",fontSize:"12px",color:"#D97706",lineHeight:1.5}}>
                  ℹ Großgruppe — wird als ausstehend gespeichert und braucht manuelle Bestätigung.
                </div>
              ) : (
                <>
                  <button onClick={suggestTable} style={{
                    padding:"10px",borderRadius:"8px",background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.25)",
                    color:"#FF5C35",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                  }}>
                    KI: Tisch vorschlagen →
                  </button>
                  {(suggestedTable || suggestedCombo) ? (
                    <div style={{background:"rgba(52,211,153,.1)",border:"1px solid rgba(52,211,153,.25)",borderRadius:"10px",padding:"12px 14px"}}>
                      <div style={{fontSize:"12px",fontWeight:600,color:"#059669",marginBottom:"6px"}}>✓ Tisch verfügbar</div>
                      {suggestedTable && (
                        <>
                          <div style={{fontSize:"14px",color:text,fontWeight:500}}>{suggestedTable.name} — {suggestedTable.capacity} Personen</div>
                          <div style={{fontSize:"11px",color:muted,marginTop:"2px"}}>{walkinTime} – {minutesToTime(timeToMinutes(walkinTime)+stayDuration)} Uhr</div>
                        </>
                      )}
                      {suggestedCombo && (
                        <>
                          <div style={{fontSize:"14px",color:text,fontWeight:500}}>
                            Tische zusammen: {suggestedCombo.tables.map(t => t.name).join(" + ")}
                          </div>
                          <div style={{fontSize:"12px",color:muted,marginTop:"3px"}}>
                            Zusammen {suggestedCombo.totalCapacity} Plätze · {walkinTime} – {minutesToTime(timeToMinutes(walkinTime)+stayDuration)} Uhr
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{setShowWalkin(false);setSuggestedTable(null);setSuggestedCombo(null);}} style={{
                flex:1,padding:"10px",borderRadius:"8px",background:"transparent",border:`1px solid ${border}`,
                color:muted,fontSize:"13px",cursor:"pointer",fontFamily:"inherit",
              }}>Abbrechen</button>
              {(suggestedTable || suggestedCombo || parseInt(walkinParty) >= (restaurant?.large_group_threshold || 15)) && (
                <button onClick={saveWalkin} disabled={!walkinName||savingWalkin} style={{
                  flex:2,padding:"10px",borderRadius:"8px",background:"#FF5C35",border:"none",
                  color:"#fff",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                  opacity:!walkinName||savingWalkin?0.6:1,
                }}>
                  {savingWalkin?"Wird gespeichert...":"✓ Bestätigen & eintragen"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}