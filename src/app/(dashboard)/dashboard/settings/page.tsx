"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Toast, { useToast, errorText } from "@/components/Toast";
import { geocodeAddress } from "@/lib/geocode";

type Table = { id: string; name: string; capacity: number; combinable_with?: string[]; is_outdoor?: boolean; area_id?: string | null; };
type Hour = { id: string; day_of_week: number; open_time: string; close_time: string; is_closed: boolean; };
type Area = { id: string; name: string; is_outdoor: boolean; };

const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

const MIGRATION_HINT = "Die Bereiche sind in der Datenbank noch nicht angelegt. Bitte migrations/bereiche.sql im Supabase SQL Editor ausführen.";

/**
 * Erkennt, ob ein Supabase-Fehler daher kommt dass die Tabelle areas fehlt
 * (Migration noch nicht eingespielt). PostgREST meldet das als PGRST205 bzw.
 * mit "schema cache" in der Meldung — beides ist ohne Kontext unverständlich.
 */
function isMissingAreasTable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  const msg = (error.message || "").toLowerCase();
  return msg.includes("schema cache") || msg.includes("does not exist");
}

export default function Settings() {
  const router = useRouter();
  const [tab, setTab] = useState<"restaurant"|"tables"|"groups"|"hours">("restaurant");
  const [restaurantId, setRestaurantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast, showError, closeToast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [slug, setSlug] = useState("");
  const [stayDuration, setStayDuration] = useState(150);
  const [largeGroupThreshold, setLargeGroupThreshold] = useState(15);
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [allowPets, setAllowPets] = useState(false);
  // Ausgangsadresse: nur wenn sie sich aendert, wird neu geokodiert.
  const [savedAddress, setSavedAddress] = useState("");
  const [hasCoordinates, setHasCoordinates] = useState(false);

  const [tables, setTables] = useState<Table[]>([]);
  const [hours, setHours] = useState<Hour[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  // true, solange migrations/bereiche.sql nicht eingespielt ist.
  const [areasMissing, setAreasMissing] = useState(false);

  // Der Tab "Tisch-Gruppen" trennt zwei Konzepte: WO steht der Tisch (Bereich)
  // und WELCHE Tische lassen sich zusammenschieben (combinable_with).
  const [groupSection, setGroupSection] = useState<"areas"|"combine">("areas");

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupSelection, setGroupSelection] = useState<string[]>([]);

  const [showNewArea, setShowNewArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaOutdoor, setNewAreaOutdoor] = useState(false);
  const [newAreaTables, setNewAreaTables] = useState<string[]>([]);
  const [deleteAreaTarget, setDeleteAreaTarget] = useState<Area | null>(null);

  const bg = "#F5F0EB";
  const surface = "#fff";
  const border = "#EDE8E3";
  const text = "#1A1A2E";
  const muted = "#6B6B80";
  const inputBg = "#fff";
  const inputBorder = "#EDE8E3";

  useEffect(() => { loadData(); }, []);

  async function loadData() {
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
    const { data: rests, error: restErr } = await supabase
      .from("restaurants")
      .select("*")
      .eq("email", user.email)
      .order("created_at", { ascending: true })
      .limit(1);
    // Bei Fehler NICHT ins Onboarding leiten — sonst verliert ein bestehender
    // Kunde bei einem Netzwerkfehler scheinbar sein Restaurant.
    if (restErr) {
      console.error("Restaurant laden fehlgeschlagen:", restErr);
      setLoadError(errorText("Dein Restaurant konnte nicht geladen werden.", restErr));
      setLoading(false);
      return;
    }
    const rest = rests && rests.length > 0 ? rests[0] : null;
    if (!rest) { router.push("/onboarding"); return; }

    setRestaurantId(rest.id);
    setName(rest.name || "");
    setPhone(rest.phone || "");
    setAddress(rest.address || "");
    setSlug(rest.slug || "");
    setStayDuration(rest.stay_duration || 150);
    setLargeGroupThreshold(rest.large_group_threshold || 15);
    setGooglePlaceId(rest.google_place_id || "");
    setGoogleReviewUrl(rest.google_review_url || "");
    setAllowPets(!!rest.allow_pets);
    setSavedAddress(rest.address || "");
    setHasCoordinates(typeof rest.latitude === "number" && typeof rest.longitude === "number");

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

    // Bereiche sind neu: Solange migrations/bereiche.sql nicht eingespielt ist,
    // gibt es die Tabelle nicht. Das darf die Einstellungen NICHT blockieren —
    // deshalb hier nur eine Meldung statt der ganzseitigen Fehleransicht.
    const { data: ars, error: arsErr } = await supabase.from("areas").select("*").eq("restaurant_id", rest.id).order("name");
    if (arsErr) {
      console.error("Bereiche laden fehlgeschlagen:", arsErr);
      if (isMissingAreasTable(arsErr)) {
        // Kein Toast: der Hinweis steht dauerhaft im Bereiche-Abschnitt.
        setAreasMissing(true);
      } else {
        showError(errorText("Die Bereiche konnten nicht geladen werden. Alles andere funktioniert normal.", arsErr));
      }
    } else {
      setAreasMissing(false);
    }
    setAreas(ars || []);

    const { data: hrs, error: hrsErr } = await supabase.from("opening_hours").select("*").eq("restaurant_id", rest.id).order("day_of_week");
    if (hrsErr) {
      console.error("Öffnungszeiten laden fehlgeschlagen:", hrsErr);
      setLoadError(errorText("Die Öffnungszeiten konnten nicht geladen werden.", hrsErr));
      setLoading(false);
      return;
    }
    if (hrs && hrs.length > 0) setHours(hrs);
    else setHours(DAYS.map((_,i) => ({ id: "", day_of_week: i, open_time: "11:00", close_time: "22:00", is_closed: i === 6 })));

    setLoading(false);
  }

  async function saveRestaurant() {
    setSaving(true);

    // Koordinaten fuer die Wettervorhersage: nur holen wenn die Adresse neu ist
    // oder noch keine Koordinaten hinterlegt sind. Findet die Geocoding-API
    // nichts, wird ohne Koordinaten gespeichert — dann gibt es nur kein
    // Wetter-Widget, kein Fehler.
    const addressChanged = address.trim() !== savedAddress.trim();
    const needsGeocoding = address.trim().length > 0 && (addressChanged || !hasCoordinates);
    let coords: { latitude: number; longitude: number } | null = null;
    if (needsGeocoding) coords = await geocodeAddress(address);

    const update: Record<string, unknown> = {
      name, phone, address,
      stay_duration: stayDuration,
      large_group_threshold: largeGroupThreshold,
      google_place_id: googlePlaceId || null,
      google_review_url: googleReviewUrl || null,
      allow_pets: allowPets,
    };
    if (coords) {
      update.latitude = coords.latitude;
      update.longitude = coords.longitude;
    } else if (addressChanged && !address.trim()) {
      // Adresse geleert -> alte Koordinaten passen nicht mehr.
      update.latitude = null;
      update.longitude = null;
    }

    const supabase = createClient();
    const { error } = await supabase.from("restaurants").update(update).eq("id", restaurantId);
    setSaving(false);
    if (error) {
      console.error("Restaurant speichern fehlgeschlagen:", error);
      showError(errorText("Die Restaurant-Daten konnten nicht gespeichert werden.", error));
      return;
    }

    setSavedAddress(address);
    setHasCoordinates(!!coords || (hasCoordinates && !addressChanged));

    if (needsGeocoding && !coords) {
      showError("Gespeichert — die Adresse konnte aber keinem Ort zugeordnet werden. Die Wettervorhersage im Dashboard bleibt deshalb aus. Tipp: Ort und PLZ in der Adresse angeben.");
      return;
    }
    showSaved();
  }

  async function saveTable(t: Table) {
    const supabase = createClient();
    const { error } = await supabase.from("tables").update({ name: t.name, capacity: t.capacity }).eq("id", t.id);
    if (error) {
      console.error("Tisch speichern fehlgeschlagen:", error);
      showError(errorText(`Tisch "${t.name}" konnte nicht gespeichert werden.`, error));
      return;
    }
    showSaved();
  }

  async function addTable() {
    const supabase = createClient();
    const { data, error } = await supabase.from("tables").insert([{ restaurant_id: restaurantId, name: `Tisch ${tables.length + 1}`, capacity: 2, combinable_with: [] }]).select().single();
    if (error || !data) {
      console.error("Tisch anlegen fehlgeschlagen:", error);
      showError(errorText("Der Tisch konnte nicht angelegt werden.", error));
      return;
    }
    setTables([...tables, data]);
    showSaved();
  }

  async function deleteTable(id: string) {
    const supabase = createClient();
    const table = tables.find(t => t.id === id);
    const { error } = await supabase.from("tables").delete().eq("id", id);
    if (error) {
      console.error("Tisch löschen fehlgeschlagen:", error);
      // 23503 = Foreign-Key-Verletzung: an dem Tisch haengen noch Reservierungen.
      if (error.code === "23503") {
        showError(`Tisch "${table?.name ?? id}" kann nicht gelöscht werden, weil noch Reservierungen darauf liegen. Storniere oder verschiebe diese zuerst.`);
      } else {
        showError(errorText(`Tisch "${table?.name ?? id}" konnte nicht gelöscht werden.`, error));
      }
      return;
    }

    // Tisch aus allen Gruppen entfernen — Fehler hier einzeln melden, der Tisch
    // selbst ist bereits weg.
    for (const t of tables) {
      if (t.combinable_with?.includes(id)) {
        const newCombine = t.combinable_with.filter(x => x !== id);
        const { error: grpErr } = await supabase.from("tables").update({ combinable_with: newCombine }).eq("id", t.id);
        if (grpErr) {
          console.error("Gruppe aktualisieren fehlgeschlagen:", grpErr);
          showError(errorText(`Tisch "${t.name}" konnte nicht aus seiner Gruppe entfernt werden. Bitte Seite neu laden.`, grpErr));
          return;
        }
      }
    }
    setTables(tables.filter(t => t.id !== id).map(t => ({...t, combinable_with: (t.combinable_with || []).filter(x => x !== id)})));
    showSaved();
  }

  async function saveHours() {
    setSaving(true);
    const supabase = createClient();
    for (const h of hours) {
      const { error } = h.id
        ? await supabase.from("opening_hours").update({ open_time: h.open_time, close_time: h.close_time, is_closed: h.is_closed }).eq("id", h.id)
        : await supabase.from("opening_hours").insert([{ restaurant_id: restaurantId, day_of_week: h.day_of_week, open_time: h.open_time, close_time: h.close_time, is_closed: h.is_closed }]);
      if (error) {
        console.error("Öffnungszeiten speichern fehlgeschlagen:", error);
        setSaving(false);
        showError(errorText(`Die Öffnungszeiten für ${DAYS[h.day_of_week]} konnten nicht gespeichert werden. Bitte nochmal speichern.`, error));
        return;
      }
    }
    setSaving(false);
    showSaved();
  }

  function areaName(t: Table): string {
    if (!t.area_id) return "Innen";
    return areas.find(a => a.id === t.area_id)?.name || "Innen";
  }

  /**
   * Bereich anlegen. Zugeordnete Tische bekommen sofort area_id und das
   * synchronisierte is_outdoor — daran haengt die bestehende Wetter- und
   * Puffer-Logik.
   */
  async function createArea() {
    const name = newAreaName.trim();
    if (!name) return;
    const supabase = createClient();

    const { data: created, error } = await supabase.from("areas")
      .insert([{ restaurant_id: restaurantId, name, is_outdoor: newAreaOutdoor }])
      .select().single();
    if (error || !created) {
      console.error("Bereich anlegen fehlgeschlagen:", error);
      if (isMissingAreasTable(error)) {
        setAreasMissing(true);
        showError(MIGRATION_HINT);
      } else {
        showError(errorText("Der Bereich konnte nicht angelegt werden.", error));
      }
      return;
    }

    if (newAreaTables.length > 0) {
      const { error: assignErr } = await supabase.from("tables")
        .update({ area_id: created.id, is_outdoor: newAreaOutdoor })
        .in("id", newAreaTables);
      if (assignErr) {
        console.error("Tische zuordnen fehlgeschlagen:", assignErr);
        showError(errorText(`Der Bereich "${name}" wurde angelegt, die Tische konnten aber nicht zugeordnet werden.`, assignErr));
        setAreas([...areas, created]);
        return;
      }
      setTables(tables.map(t => newAreaTables.includes(t.id) ? { ...t, area_id: created.id, is_outdoor: newAreaOutdoor } : t));
    }

    setAreas([...areas, created]);
    setShowNewArea(false);
    setNewAreaName("");
    setNewAreaOutdoor(false);
    setNewAreaTables([]);
    showSaved();
  }

  async function renameArea(area: Area, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const supabase = createClient();
    const { error } = await supabase.from("areas").update({ name: trimmed }).eq("id", area.id);
    if (error) {
      console.error("Bereich umbenennen fehlgeschlagen:", error);
      showError(errorText(`Der Bereich "${area.name}" konnte nicht umbenannt werden.`, error));
      return;
    }
    showSaved();
  }

  /** Außenbereich umschalten — die Tische des Bereichs ziehen mit. */
  async function setAreaOutdoor(area: Area, value: boolean) {
    const supabase = createClient();
    const { error } = await supabase.from("areas").update({ is_outdoor: value }).eq("id", area.id);
    if (error) {
      console.error("Außenbereich speichern fehlgeschlagen:", error);
      showError(errorText(`Der Außenbereich konnte für "${area.name}" nicht gespeichert werden.`, error));
      return;
    }

    const ids = tables.filter(t => t.area_id === area.id).map(t => t.id);
    if (ids.length > 0) {
      const { error: syncErr } = await supabase.from("tables").update({ is_outdoor: value }).in("id", ids);
      if (syncErr) {
        console.error("Tische synchronisieren fehlgeschlagen:", syncErr);
        showError(errorText(`Der Bereich wurde gespeichert, die Tische konnten aber nicht aktualisiert werden. Bitte Seite neu laden.`, syncErr));
        return;
      }
      setTables(tables.map(t => t.area_id === area.id ? { ...t, is_outdoor: value } : t));
    }

    setAreas(areas.map(a => a.id === area.id ? { ...a, is_outdoor: value } : a));
    showSaved();
  }

  /** Tisch einem Bereich zuordnen oder herausnehmen (null = Innen). */
  async function assignTableToArea(table: Table, areaId: string | null) {
    const supabase = createClient();
    const isOutdoor = areaId ? !!areas.find(a => a.id === areaId)?.is_outdoor : false;
    const { error } = await supabase.from("tables")
      .update({ area_id: areaId, is_outdoor: isOutdoor }).eq("id", table.id);
    if (error) {
      console.error("Tisch zuordnen fehlgeschlagen:", error);
      showError(errorText(`Tisch "${table.name}" konnte dem Bereich nicht zugeordnet werden.`, error));
      return;
    }
    setTables(tables.map(t => t.id === table.id ? { ...t, area_id: areaId, is_outdoor: isOutdoor } : t));
    showSaved();
  }

  /** Bereich löschen — seine Tische fallen zurück auf Innen. */
  async function deleteArea(area: Area) {
    const supabase = createClient();
    const ids = tables.filter(t => t.area_id === area.id).map(t => t.id);

    if (ids.length > 0) {
      const { error: freeErr } = await supabase.from("tables")
        .update({ area_id: null, is_outdoor: false }).in("id", ids);
      if (freeErr) {
        console.error("Tische freigeben fehlgeschlagen:", freeErr);
        showError(errorText(`Die Tische von "${area.name}" konnten nicht freigegeben werden. Der Bereich wurde nicht gelöscht.`, freeErr));
        return;
      }
    }

    const { error } = await supabase.from("areas").delete().eq("id", area.id);
    if (error) {
      console.error("Bereich löschen fehlgeschlagen:", error);
      showError(errorText(`Der Bereich "${area.name}" konnte nicht gelöscht werden.`, error));
      return;
    }

    setTables(tables.map(t => t.area_id === area.id ? { ...t, area_id: null, is_outdoor: false } : t));
    setAreas(areas.filter(a => a.id !== area.id));
    setDeleteAreaTarget(null);
    showSaved();
  }

  function getGroups(): {tables: Table[], totalCapacity: number, areaNames: string[]}[] {
    const groups: {tables: Table[], totalCapacity: number, areaNames: string[]}[] = [];
    const processed = new Set<string>();
    for (const t of tables) {
      if (processed.has(t.id)) continue;
      if (!t.combinable_with || t.combinable_with.length === 0) continue;
      const groupTables = [t];
      processed.add(t.id);
      for (const otherId of t.combinable_with) {
        const other = tables.find(tab => tab.id === otherId);
        if (other && !processed.has(other.id)) {
          groupTables.push(other);
          processed.add(other.id);
        }
      }
      if (groupTables.length > 1) {
        groups.push({
          tables: groupTables,
          totalCapacity: groupTables.reduce((sum, x) => sum + x.capacity, 0),
          // Nur ein Hinweis, keine Blockade: Kombinationen über Bereichsgrenzen
          // hinweg sind erlaubt (z. B. Terrassentisch + Fenstertisch).
          areaNames: Array.from(new Set(groupTables.map(x => areaName(x)))),
        });
      }
    }
    return groups;
  }

  async function saveNewGroup() {
    if (groupSelection.length < 2) return;
    const supabase = createClient();
    for (const tableId of groupSelection) {
      const others = groupSelection.filter(id => id !== tableId);
      const { error } = await supabase.from("tables").update({ combinable_with: others }).eq("id", tableId);
      if (error) {
        console.error("Gruppe anlegen fehlgeschlagen:", error);
        showError(errorText("Die Tisch-Gruppe konnte nicht vollständig angelegt werden. Bitte Seite neu laden und nochmal versuchen.", error));
        return;
      }
    }
    const { data: tbls, error: reloadErr } = await supabase.from("tables").select("*").eq("restaurant_id", restaurantId).order("name");
    if (reloadErr) {
      console.error("Tische neu laden fehlgeschlagen:", reloadErr);
      showError(errorText("Die Gruppe wurde gespeichert, die Ansicht konnte aber nicht aktualisiert werden. Bitte Seite neu laden.", reloadErr));
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
    setShowNewGroup(false);
    setGroupSelection([]);
    showSaved();
  }

  async function deleteGroup(groupTables: Table[]) {
    const supabase = createClient();
    for (const t of groupTables) {
      // Nur die Kombination aufloesen — der Bereich des Tisches bleibt.
      const { error } = await supabase.from("tables").update({ combinable_with: [] }).eq("id", t.id);
      if (error) {
        console.error("Gruppe löschen fehlgeschlagen:", error);
        showError(errorText("Die Tisch-Gruppe konnte nicht vollständig aufgelöst werden. Bitte Seite neu laden und nochmal versuchen.", error));
        return;
      }
    }
    const { data: tbls, error: reloadErr } = await supabase.from("tables").select("*").eq("restaurant_id", restaurantId).order("name");
    if (reloadErr) {
      console.error("Tische neu laden fehlgeschlagen:", reloadErr);
      showError(errorText("Die Gruppe wurde aufgelöst, die Ansicht konnte aber nicht aktualisiert werden. Bitte Seite neu laden.", reloadErr));
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
    showSaved();
  }

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", background: inputBg, border: `1px solid ${inputBorder}`,
    borderRadius: "10px", fontSize: "14px", fontFamily: "inherit", color: text, outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "12px", fontWeight: 500, color: muted, marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.5px",
  };

  const tablesInGroups = new Set<string>();
  getGroups().forEach(g => g.tables.forEach(t => tablesInGroups.add(t.id)));

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
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"#1A1A2E",marginBottom:"8px"}}>Einstellungen konnten nicht geladen werden</h2>
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus { border-color: #FF5C35 !important; }
        select { appearance: none; -webkit-appearance: none; }
        .save-btn:hover { background: #FF7A5A !important; }
        .del-btn:hover { color: #F87171 !important; border-color: rgba(239,68,68,0.3) !important; }
      `}</style>

      <aside style={{width:"64px",background:"#1A1A2E",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0",position:"fixed",top:0,bottom:0,left:0,zIndex:50}}>
        <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"#FF5C35",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"32px"}}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5h12M3 9h8M3 13h5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
        {[
          {path:"/dashboard",active:false,icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>},
          {path:"/dashboard/new",active:false,icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>},
          {path:"/dashboard/settings",active:true,icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9 1.5V4M9 14v2.5M1.5 9H4M14 9h2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>},
        ].map((item,i) => (
          <button key={i} onClick={() => router.push(item.path)} style={{
            width:"40px",height:"40px",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",
            background: item.active ? "rgba(255,92,53,0.15)" : "transparent",
            border: item.active ? "1px solid rgba(255,92,53,0.2)" : "1px solid transparent",
            color: item.active ? "#FF5C35" : "rgba(255,255,255,0.3)",
            cursor:"pointer",marginBottom:"4px",
          }}>{item.icon}</button>
        ))}
      </aside>

      <main style={{marginLeft:"64px",flex:1}}>
        <header style={{height:"60px",borderBottom:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",background:"rgba(245,240,235,0.95)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:40}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <span style={{fontSize:"13px",color:muted}}>Butlery</span>
            <span style={{color:muted}}>›</span>
            <span style={{fontSize:"13px",color:text,fontWeight:500}}>Einstellungen</span>
          </div>
          {saved && (
            <div style={{fontSize:"12px",color:"#34D399",display:"flex",alignItems:"center",gap:"4px",background:"rgba(52,211,153,0.1)",padding:"4px 10px",borderRadius:"6px",border:"1px solid rgba(52,211,153,0.2)"}}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#34D399" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Gespeichert
            </div>
          )}
        </header>

        <div style={{padding:"32px",maxWidth:"720px"}}>
          <div style={{marginBottom:"28px"}}>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,color:text,letterSpacing:"-0.5px",marginBottom:"6px"}}>Einstellungen</h1>
            <p style={{fontSize:"13px",color:muted,fontWeight:300}}>Restaurant, Tische und Öffnungszeiten verwalten.</p>
          </div>

          <div style={{display:"flex",gap:"0",background:surface,border:`1px solid ${border}`,borderRadius:"10px",padding:"4px",marginBottom:"24px",width:"fit-content"}}>
            {([
              {key:"restaurant",label:"Restaurant"},
              {key:"tables",label:"Tische"},
              {key:"groups",label:"Tisch-Gruppen"},
              {key:"hours",label:"Öffnungszeiten"},
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding:"8px 18px",borderRadius:"7px",fontSize:"13px",fontWeight:500,cursor:"pointer",
                fontFamily:"inherit",border:"none",
                background: tab===t.key ? "#1A1A2E" : "transparent",
                color: tab===t.key ? "#fff" : muted,
              }}>{t.label}</button>
            ))}
          </div>

          {tab === "restaurant" && (
            <div style={{background:surface,border:`1px solid ${border}`,borderRadius:"16px",padding:"24px",display:"flex",flexDirection:"column",gap:"18px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
                <div>
                  <label style={labelStyle}>Name des Restaurants</label>
                  <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Telefon</label>
                  <input style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Adresse</label>
                <input style={inputStyle} type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Musterstraße 1, 6020 Innsbruck" />
                <div style={{fontSize:"11px",color:muted,marginTop:"6px",lineHeight:1.6}}>
                  Ort und PLZ mit angeben — daraus ermitteln wir den Standort für die Wettervorhersage im Dashboard.
                </div>
              </div>

              <div>
                <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:text,cursor:"pointer"}}>
                  <input type="checkbox" checked={allowPets} onChange={e => setAllowPets(e.target.checked)} />
                  Haustiere erlaubt
                </label>
                <div style={{fontSize:"11px",color:muted,marginTop:"6px",lineHeight:1.6}}>
                  Ist das aktiv, werden Gäste auf der Buchungsseite gefragt ob sie ein Haustier mitbringen — und die WhatsApp-KI beantwortet Fragen dazu korrekt.
                </div>
              </div>
              <div>
                <label style={labelStyle}>Aufenthaltsdauer pro Reservierung</label>
                <select style={inputStyle} value={stayDuration} onChange={e => setStayDuration(parseInt(e.target.value))}>
                  <option value={60}>1 Stunde</option>
                  <option value={90}>1,5 Stunden</option>
                  <option value={120}>2 Stunden</option>
                  <option value={150}>2,5 Stunden (Standard)</option>
                  <option value={180}>3 Stunden</option>
                  <option value={240}>4 Stunden</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Großgruppen-Meldung ab</label>
                <select style={inputStyle} value={largeGroupThreshold} onChange={e => setLargeGroupThreshold(parseInt(e.target.value))}>
                  {[5,8,10,12,15,20,25,30].map(n => <option key={n} value={n}>Ab {n} Personen</option>)}
                </select>
              </div>

              {/* GOOGLE BEWERTUNGEN */}
              <div style={{background:"rgba(66,133,244,.05)",border:"1px solid rgba(66,133,244,.2)",borderRadius:"12px",padding:"18px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                  <div style={{fontSize:"15px"}}>⭐</div>
                  <div style={{fontSize:"13px",fontWeight:600,color:text}}>Google Bewertungen automatisch sammeln</div>
                </div>
                <div style={{fontSize:"12px",color:muted,marginBottom:"14px",lineHeight:1.5}}>
                  Gäste bekommen 2h nach dem Besuch eine Mail mit 5 Sternen. 4-5 Sterne führen direkt zu Google, 1-3 Sterne bleiben intern bei dir.
                </div>
                <div style={{marginBottom:"12px"}}>
                  <label style={labelStyle}>Google Place ID</label>
                  <input style={inputStyle} type="text" value={googlePlaceId} onChange={e => setGooglePlaceId(e.target.value)} placeholder="ChIJ..." />
                  <div style={{fontSize:"11px",color:muted,marginTop:"6px",lineHeight:1.6}}>
                    So findest du deine Place ID: Geh auf <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" style={{color:"#FF5C35",textDecoration:"none",fontWeight:500}}>Google Place ID Finder</a>, such dein Restaurant, kopier die ID die unter dem Namen erscheint.
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>ODER: Direkter Google Review Link</label>
                  <input style={inputStyle} type="text" value={googleReviewUrl} onChange={e => setGoogleReviewUrl(e.target.value)} placeholder="https://g.page/r/..." />
                  <div style={{fontSize:"11px",color:muted,marginTop:"6px",lineHeight:1.6}}>
                    Hast du schon einen Google Bewertungs-Kurzlink? Hier einfügen.
                  </div>
                </div>
              </div>

              {slug && (
                <div style={{background:"#FFF0EB",border:`1px solid rgba(255,92,53,0.2)`,borderRadius:"12px",padding:"16px"}}>
                  <div style={{fontSize:"11px",fontWeight:600,color:"#FF5C35",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"10px"}}>Dein Booking Link</div>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <div style={{flex:1,padding:"10px 14px",background:inputBg,border:`1px solid ${inputBorder}`,borderRadius:"8px",fontSize:"13px",color:text,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {`${typeof window !== "undefined" ? window.location.origin : "https://tablely.at"}/book/${slug}`}
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`); showSaved(); }} style={{flexShrink:0,padding:"10px 14px",background:"#FF5C35",color:"#fff",border:"none",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
                      Kopieren
                    </button>
                  </div>
                </div>
              )}

              <button className="save-btn" onClick={saveRestaurant} disabled={saving} style={{
                background:"#FF5C35",color:"#fff",border:"none",padding:"12px 24px",borderRadius:"10px",
                fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                opacity:saving?0.7:1,alignSelf:"flex-start"
              }}>
                {saving ? "Wird gespeichert..." : "Änderungen speichern"}
              </button>
            </div>
          )}

          {tab === "tables" && (
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {tables.map((t,i) => (
                <div key={t.id} style={{background:surface,border:`1px solid ${border}`,borderRadius:"12px",padding:"14px 18px",display:"flex",alignItems:"center",gap:"12px"}}>
                  <input style={{...inputStyle,flex:1}} type="text" value={t.name}
                    onChange={e => setTables(tables.map((tb,j) => j===i ? {...tb,name:e.target.value} : tb))}
                    onBlur={() => saveTable(t)}
                  />
                  <select style={{...inputStyle,width:"120px"}} value={t.capacity}
                    onChange={e => { const updated = tables.map((tb,j) => j===i ? {...tb,capacity:parseInt(e.target.value)} : tb); setTables(updated); saveTable(updated[i]); }}
                  >
                    {[1,2,3,4,5,6,7,8,10,12,15,20].map(n => <option key={n} value={n}>{n} Pers.</option>)}
                  </select>
                  <button className="del-btn" onClick={() => deleteTable(t.id)} style={{
                    width:"36px",height:"36px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",
                    background:"transparent",border:`1px solid ${border}`,cursor:"pointer",color:muted,flexShrink:0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M5 3V2h4v1M3 3l1 9h6l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              ))}
              <button onClick={addTable} style={{
                background:"transparent",border:`1px dashed ${border}`,borderRadius:"12px",padding:"14px",
                fontSize:"13px",fontWeight:500,color:muted,cursor:"pointer",fontFamily:"inherit",
                display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                Tisch hinzufügen
              </button>
            </div>
          )}

          {tab === "groups" && (
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {/* Zwei getrennte Konzepte: WO steht der Tisch (Bereich) und
                  WELCHE Tische lassen sich zusammenschieben. */}
              <div style={{display:"flex",gap:"0",background:surface,border:`1px solid ${border}`,borderRadius:"10px",padding:"4px",width:"fit-content"}}>
                {([
                  {key:"areas",label:"Bereiche"},
                  {key:"combine",label:"Zusammenschieben"},
                ] as const).map(s => (
                  <button key={s.key} onClick={() => setGroupSection(s.key)} style={{
                    padding:"7px 16px",borderRadius:"7px",fontSize:"13px",fontWeight:500,cursor:"pointer",
                    fontFamily:"inherit",border:"none",
                    background: groupSection===s.key ? "#1A1A2E" : "transparent",
                    color: groupSection===s.key ? "#fff" : muted,
                  }}>{s.label}</button>
                ))}
              </div>

              {groupSection === "areas" && (<>
                <div style={{fontSize:"12px",color:muted,lineHeight:1.6,marginBottom:"4px"}}>
                  Bereiche sagen, wo ein Tisch steht — Terrasse, Garten, Wintergarten. Bereiche mit dem Schalter Außenbereich sind wetterabhängig: Bei Regenprognose warnt dich das Dashboard, wenn dort Gäste reserviert sind. Tische ohne Bereich zählen als Innenbereich.
                </div>

                {areasMissing && (
                  <div style={{background:"#FEE8E8",border:"1px solid rgba(226,75,74,.25)",borderRadius:"12px",padding:"14px 16px"}}>
                    <div style={{fontSize:"13px",fontWeight:600,color:"#B3312F",marginBottom:"6px"}}>
                      Bereiche sind noch nicht aktiviert
                    </div>
                    <div style={{fontSize:"12px",color:"#B3312F",lineHeight:1.6}}>
                      Die Tabelle areas fehlt in der Datenbank. Führe dazu einmal <span style={{fontFamily:"monospace"}}>migrations/bereiche.sql</span> im Supabase SQL Editor aus und lade diese Seite neu. Bis dahin funktionieren alle anderen Einstellungen normal.
                    </div>
                  </div>
                )}

                {areas.map(area => {
                  const areaTables = tables.filter(t => t.area_id === area.id);
                  return (
                    <div key={area.id} style={{background:surface,border:`1px solid ${border}`,borderRadius:"12px",padding:"16px 18px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
                        <input
                          style={{...inputStyle,flex:1,fontWeight:600}}
                          type="text"
                          value={area.name}
                          onChange={e => setAreas(areas.map(a => a.id===area.id ? {...a, name:e.target.value} : a))}
                          onBlur={e => renameArea(area, e.target.value)}
                        />
                        <div style={{fontSize:"11px",color:muted,whiteSpace:"nowrap"}}>
                          {areaTables.length} {areaTables.length === 1 ? "Tisch" : "Tische"}
                        </div>
                        <button onClick={() => setDeleteAreaTarget(area)} style={{
                          width:"36px",height:"36px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",
                          background:"transparent",border:`1px solid ${border}`,cursor:"pointer",color:muted,flexShrink:0,
                        }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M5 3V2h4v1M3 3l1 9h6l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>

                      <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:text,cursor:"pointer",marginBottom:"12px"}}>
                        <input type="checkbox" checked={area.is_outdoor} onChange={e => setAreaOutdoor(area, e.target.checked)} />
                        Außenbereich — wetterabhängig
                      </label>

                      <div style={{fontSize:"11px",color:muted,marginBottom:"8px"}}>Tische diesem Bereich zuordnen:</div>
                      <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                        {tables.map(t => {
                          const isHere = t.area_id === area.id;
                          const otherArea = !isHere && t.area_id ? areaName(t) : "";
                          return (
                            <button key={t.id} onClick={() => assignTableToArea(t, isHere ? null : area.id)} style={{
                              padding:"6px 12px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",
                              fontFamily:"inherit",border:"1px solid",
                              background: isHere ? "#FF5C35" : "transparent",
                              color: isHere ? "#fff" : text,
                              borderColor: isHere ? "#FF5C35" : border,
                            }}>
                              {t.name} <span style={{fontSize:"11px",opacity:.75}}>({t.capacity}P)</span>
                              {otherArea && <span style={{fontSize:"11px",color:muted,marginLeft:"6px"}}>{otherArea}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {showNewArea ? (
                  <div style={{background:surface,border:"1px solid #FF5C35",borderRadius:"12px",padding:"16px 18px"}}>
                    <div style={{fontSize:"13px",fontWeight:600,color:text,marginBottom:"12px"}}>Neuer Bereich</div>
                    <input
                      style={{...inputStyle,marginBottom:"12px"}}
                      type="text"
                      placeholder="Name, z. B. Terrasse"
                      value={newAreaName}
                      onChange={e => setNewAreaName(e.target.value)}
                    />
                    <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",color:text,cursor:"pointer",marginBottom:"12px"}}>
                      <input type="checkbox" checked={newAreaOutdoor} onChange={e => setNewAreaOutdoor(e.target.checked)} />
                      Außenbereich — wetterabhängig
                    </label>
                    <div style={{fontSize:"11px",color:muted,marginBottom:"8px"}}>Tische zuordnen (optional):</div>
                    <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px"}}>
                      {tables.map(t => {
                        const isSelected = newAreaTables.includes(t.id);
                        const otherArea = t.area_id ? areaName(t) : "";
                        return (
                          <button key={t.id} onClick={() => {
                            if (isSelected) setNewAreaTables(newAreaTables.filter(id => id !== t.id));
                            else setNewAreaTables([...newAreaTables, t.id]);
                          }} style={{
                            padding:"6px 12px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",
                            fontFamily:"inherit",border:"1px solid",
                            background: isSelected ? "#FF5C35" : "transparent",
                            color: isSelected ? "#fff" : text,
                            borderColor: isSelected ? "#FF5C35" : border,
                          }}>
                            {t.name} <span style={{fontSize:"11px",opacity:.75}}>({t.capacity}P)</span>
                            {otherArea && !isSelected && <span style={{fontSize:"11px",color:muted,marginLeft:"6px"}}>{otherArea}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{display:"flex",gap:"8px"}}>
                      <button onClick={() => { setShowNewArea(false); setNewAreaName(""); setNewAreaOutdoor(false); setNewAreaTables([]); }} style={{padding:"9px 16px",borderRadius:"8px",background:"transparent",border:`1px solid ${border}`,color:muted,fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Abbrechen</button>
                      <button onClick={createArea} disabled={!newAreaName.trim()} style={{padding:"9px 18px",borderRadius:"8px",background:"#FF5C35",border:"none",color:"#fff",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:newAreaName.trim() ? 1 : 0.5}}>Bereich erstellen</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowNewArea(true)} style={{background:"transparent",border:`1px dashed ${border}`,borderRadius:"12px",padding:"14px",fontSize:"13px",fontWeight:500,color:muted,cursor:"pointer",fontFamily:"inherit"}}>+ Neuen Bereich anlegen</button>
                )}

                <div style={{fontSize:"12px",color:muted,lineHeight:1.6}}>
                  Innenbereich (kein Bereich zugeordnet): {tables.filter(t => !t.area_id).map(t => t.name).join(", ") || "—"}
                </div>
              </>)}

              {groupSection === "combine" && (<>
              <div style={{fontSize:"12px",color:muted,lineHeight:1.6,marginBottom:"4px"}}>
                Hier legst du fest, welche Tische zusammengeschoben werden können. Butlery nutzt das automatisch für größere Gruppen.
              </div>
              {getGroups().map((g, i) => (
                <div key={i} style={{background:surface,border:`1px solid ${border}`,borderRadius:"12px",padding:"16px 18px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                      <div style={{fontSize:"13px",fontWeight:600,color:text}}>Gruppe {i+1}</div>
                      <div style={{fontSize:"11px",color:"#FF5C35",background:"rgba(255,92,53,.1)",padding:"2px 10px",borderRadius:"20px",fontWeight:600}}>
                        {g.totalCapacity} Personen zusammen
                      </div>
                    </div>
                    <button onClick={() => deleteGroup(g.tables)} style={{
                      width:"28px",height:"28px",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",
                      background:"transparent",border:`1px solid ${border}`,cursor:"pointer",color:muted,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4 3V2h4v1M3 3l1 7h4l1-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {g.tables.map(t => (
                      <div key={t.id} style={{padding:"6px 12px",background:"#FFF0EB",border:"1px solid rgba(255,92,53,.15)",borderRadius:"8px",fontSize:"13px",color:text,fontWeight:500}}>
                        {t.name} <span style={{fontSize:"11px",color:muted}}>({t.capacity}P · {areaName(t)})</span>
                      </div>
                    ))}
                  </div>
                  {g.areaNames.length > 1 && (
                    <div style={{fontSize:"11px",color:muted,marginTop:"10px",lineHeight:1.5}}>
                      Tische liegen in unterschiedlichen Bereichen ({g.areaNames.join(", ")}).
                    </div>
                  )}
                </div>
              ))}
              {showNewGroup ? (
                <div style={{background:surface,border:"1px solid #FF5C35",borderRadius:"12px",padding:"16px 18px"}}>
                  <div style={{fontSize:"13px",fontWeight:600,color:text,marginBottom:"6px"}}>Neue Tisch-Gruppe</div>
                  <div style={{fontSize:"12px",color:muted,marginBottom:"12px"}}>Mindestens 2 Tische auswählen:</div>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px"}}>
                    {tables.map(t => {
                      const isSelected = groupSelection.includes(t.id);
                      const isInOtherGroup = tablesInGroups.has(t.id);
                      return (
                        <button key={t.id} disabled={isInOtherGroup} onClick={() => {
                          if (isSelected) setGroupSelection(groupSelection.filter(id => id !== t.id));
                          else setGroupSelection([...groupSelection, t.id]);
                        }} style={{
                          padding:"6px 12px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:isInOtherGroup?"not-allowed":"pointer",fontFamily:"inherit",border:"1px solid",
                          background: isSelected ? "#FF5C35" : isInOtherGroup ? "rgba(0,0,0,.05)" : "transparent",
                          color: isSelected ? "#fff" : isInOtherGroup ? "rgba(0,0,0,.3)" : text,
                          borderColor: isSelected ? "#FF5C35" : border,
                          opacity: isInOtherGroup ? 0.5 : 1,
                        }}>
                          {t.name} ({t.capacity}P)
                        </button>
                      );
                    })}
                  </div>
                  {groupSelection.length >= 2 && (
                    <div style={{fontSize:"12px",color:"#FF5C35",fontWeight:600,marginBottom:"12px"}}>
                      = {groupSelection.reduce((sum, id) => sum + (tables.find(t => t.id === id)?.capacity || 0), 0)} Personen zusammen
                    </div>
                  )}
                  {new Set(groupSelection.map(id => { const t = tables.find(x => x.id === id); return t ? areaName(t) : "Innen"; })).size > 1 && (
                    <div style={{fontSize:"11px",color:muted,marginBottom:"12px",lineHeight:1.5}}>
                      Tische liegen in unterschiedlichen Bereichen.
                    </div>
                  )}
                  <div style={{display:"flex",gap:"8px"}}>
                    <button onClick={() => { setShowNewGroup(false); setGroupSelection([]); }} style={{padding:"9px 16px",borderRadius:"8px",background:"transparent",border:`1px solid ${border}`,color:muted,fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Abbrechen</button>
                    <button onClick={saveNewGroup} disabled={groupSelection.length < 2} style={{padding:"9px 18px",borderRadius:"8px",background:"#FF5C35",border:"none",color:"#fff",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:groupSelection.length < 2 ? 0.5 : 1}}>Gruppe erstellen</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowNewGroup(true)} style={{background:"transparent",border:`1px dashed ${border}`,borderRadius:"12px",padding:"14px",fontSize:"13px",fontWeight:500,color:muted,cursor:"pointer",fontFamily:"inherit"}}>+ Neue Kombination anlegen</button>
              )}
              </>)}
            </div>
          )}

          {tab === "hours" && (
            <div style={{background:surface,border:`1px solid ${border}`,borderRadius:"16px",padding:"24px"}}>
              {DAYS.map((day,i) => {
                const h = hours[i];
                if (!h) return null;
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 0",borderBottom: i<6 ? `1px solid ${border}` : "none"}}>
                    <span style={{width:"100px",fontSize:"13px",fontWeight:500,color:text}}>{day}</span>
                    {h.is_closed ? (
                      <span style={{fontSize:"13px",color:muted,flex:1}}>Geschlossen</span>
                    ) : (
                      <>
                        <input style={{...inputStyle,width:"100px"}} type="time" value={h.open_time} onChange={e => setHours(hours.map((hr,j) => j===i ? {...hr,open_time:e.target.value} : hr))} />
                        <span style={{color:muted}}>–</span>
                        <input style={{...inputStyle,width:"100px"}} type="time" value={h.close_time} onChange={e => setHours(hours.map((hr,j) => j===i ? {...hr,close_time:e.target.value} : hr))} />
                      </>
                    )}
                    <label style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",color:muted,cursor:"pointer"}}>
                      <input type="checkbox" checked={h.is_closed} onChange={e => setHours(hours.map((hr,j) => j===i ? {...hr,is_closed:e.target.checked} : hr))} />
                      Geschlossen
                    </label>
                  </div>
                );
              })}
              <button onClick={saveHours} disabled={saving} style={{background:"#FF5C35",color:"#fff",border:"none",padding:"12px 24px",borderRadius:"10px",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:saving?0.7:1,marginTop:"20px"}}>
                {saving ? "Wird gespeichert..." : "Speichern"}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* BEREICH LÖSCHEN — BESTÄTIGUNG */}
      {deleteAreaTarget && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"24px"}}
          onClick={e => { if (e.target === e.currentTarget) setDeleteAreaTarget(null); }}>
          <div style={{background:"#fff",border:`1px solid ${border}`,borderRadius:"16px",padding:"28px",width:"100%",maxWidth:"420px"}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:text,marginBottom:"10px"}}>
              Bereich löschen?
            </h3>
            <p style={{fontSize:"13px",color:muted,lineHeight:1.6,marginBottom:"20px"}}>
              {`"${deleteAreaTarget.name}" wird gelöscht. `}
              {tables.filter(t => t.area_id === deleteAreaTarget.id).length > 0
                ? `${tables.filter(t => t.area_id === deleteAreaTarget.id).length} Tisch(e) fallen zurück auf Innenbereich und gelten dann nicht mehr als wetterabhängig.`
                : "Dem Bereich sind keine Tische zugeordnet."}
              {" Reservierungen bleiben unverändert."}
            </p>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={() => setDeleteAreaTarget(null)} style={{flex:1,padding:"11px",borderRadius:"10px",background:"transparent",border:`1px solid ${border}`,color:muted,fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>
                Abbrechen
              </button>
              <button onClick={() => deleteArea(deleteAreaTarget)} style={{flex:1,padding:"11px",borderRadius:"10px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",color:"#E24B4A",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}