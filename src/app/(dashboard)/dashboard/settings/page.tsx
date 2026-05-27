"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Table = { id: string; name: string; capacity: number; combinable_with?: string[]; };
type Hour = { id: string; day_of_week: number; open_time: string; close_time: string; is_closed: boolean; };

const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

export default function Settings() {
  const router = useRouter();
  const [tab, setTab] = useState<"restaurant"|"tables"|"groups"|"hours">("restaurant");
  const [restaurantId, setRestaurantId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [slug, setSlug] = useState("");
  const [stayDuration, setStayDuration] = useState(150);
  const [largeGroupThreshold, setLargeGroupThreshold] = useState(15);
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");

  const [tables, setTables] = useState<Table[]>([]);
  const [hours, setHours] = useState<Hour[]>([]);

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupSelection, setGroupSelection] = useState<string[]>([]);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: rest } = await supabase.from("restaurants").select("*").eq("email", user.email).single();
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

    const { data: tbls } = await supabase.from("tables").select("*").eq("restaurant_id", rest.id).order("name");
    if (tbls) {
      tbls.sort((a: {name: string}, b: {name: string}) => {
        const numA = parseInt(a.name.replace(/[^0-9]/g, "")) || 0;
        const numB = parseInt(b.name.replace(/[^0-9]/g, "")) || 0;
        return numA - numB || a.name.localeCompare(b.name);
      });
    }
    setTables(tbls || []);

    const { data: hrs } = await supabase.from("opening_hours").select("*").eq("restaurant_id", rest.id).order("day_of_week");
    if (hrs && hrs.length > 0) setHours(hrs);
    else setHours(DAYS.map((_,i) => ({ id: "", day_of_week: i, open_time: "11:00", close_time: "22:00", is_closed: i === 6 })));
  }

  async function saveRestaurant() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("restaurants").update({
      name, phone, address,
      stay_duration: stayDuration,
      large_group_threshold: largeGroupThreshold,
      google_place_id: googlePlaceId || null,
      google_review_url: googleReviewUrl || null,
    }).eq("id", restaurantId);
    setSaving(false);
    showSaved();
  }

  async function saveTable(t: Table) {
    const supabase = createClient();
    await supabase.from("tables").update({ name: t.name, capacity: t.capacity }).eq("id", t.id);
    showSaved();
  }

  async function addTable() {
    const supabase = createClient();
    const { data } = await supabase.from("tables").insert([{ restaurant_id: restaurantId, name: `Tisch ${tables.length + 1}`, capacity: 2, combinable_with: [] }]).select().single();
    if (data) setTables([...tables, data]);
  }

  async function deleteTable(id: string) {
    const supabase = createClient();
    await supabase.from("tables").delete().eq("id", id);
    for (const t of tables) {
      if (t.combinable_with?.includes(id)) {
        const newCombine = t.combinable_with.filter(x => x !== id);
        await supabase.from("tables").update({ combinable_with: newCombine }).eq("id", t.id);
      }
    }
    setTables(tables.filter(t => t.id !== id).map(t => ({...t, combinable_with: (t.combinable_with || []).filter(x => x !== id)})));
  }

  async function saveHours() {
    setSaving(true);
    const supabase = createClient();
    for (const h of hours) {
      if (h.id) {
        await supabase.from("opening_hours").update({ open_time: h.open_time, close_time: h.close_time, is_closed: h.is_closed }).eq("id", h.id);
      } else {
        await supabase.from("opening_hours").insert([{ restaurant_id: restaurantId, day_of_week: h.day_of_week, open_time: h.open_time, close_time: h.close_time, is_closed: h.is_closed }]);
      }
    }
    setSaving(false);
    showSaved();
  }

  function getGroups(): {tables: Table[], totalCapacity: number}[] {
    const groups: {tables: Table[], totalCapacity: number}[] = [];
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
      await supabase.from("tables").update({ combinable_with: others }).eq("id", tableId);
    }
    const { data: tbls } = await supabase.from("tables").select("*").eq("restaurant_id", restaurantId).order("name");
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
      await supabase.from("tables").update({ combinable_with: [] }).eq("id", t.id);
    }
    const { data: tbls } = await supabase.from("tables").select("*").eq("restaurant_id", restaurantId).order("name");
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

  return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:"'DM Sans',sans-serif",display:"flex"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
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
            <span style={{fontSize:"13px",color:muted}}>tablely</span>
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
                <input style={inputStyle} type="text" value={address} onChange={e => setAddress(e.target.value)} />
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
              <div style={{background:"rgba(255,92,53,.08)",border:"1px solid rgba(255,92,53,.15)",borderRadius:"10px",padding:"12px 16px",fontSize:"12px",color:"#FF5C35",lineHeight:1.6,marginBottom:"4px"}}>
                💡 Erstelle Gruppen von Tischen die zusammen geschoben werden können.
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
                        {t.name} <span style={{fontSize:"11px",color:muted}}>({t.capacity}P)</span>
                      </div>
                    ))}
                  </div>
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
                  <div style={{display:"flex",gap:"8px"}}>
                    <button onClick={() => { setShowNewGroup(false); setGroupSelection([]); }} style={{padding:"9px 16px",borderRadius:"8px",background:"transparent",border:`1px solid ${border}`,color:muted,fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Abbrechen</button>
                    <button onClick={saveNewGroup} disabled={groupSelection.length < 2} style={{padding:"9px 18px",borderRadius:"8px",background:"#FF5C35",border:"none",color:"#fff",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:groupSelection.length < 2 ? 0.5 : 1}}>✓ Gruppe erstellen</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowNewGroup(true)} style={{background:"transparent",border:`1px dashed ${border}`,borderRadius:"12px",padding:"14px",fontSize:"13px",fontWeight:500,color:muted,cursor:"pointer",fontFamily:"inherit"}}>+ Neue Tisch-Gruppe erstellen</button>
              )}
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
    </div>
  );
}