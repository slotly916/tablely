"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Table = { id: string; name: string; capacity: number; };
type Hour = { id: string; day_of_week: number; open_time: string; close_time: string; is_closed: boolean; };

const DAYS = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

export default function Settings() {
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState<"restaurant"|"tables"|"hours">("restaurant");
  const [restaurantId, setRestaurantId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Restaurant
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [slug, setSlug] = useState("");

  // Tables
  const [tables, setTables] = useState<Table[]>([]);

  // Hours
  const [hours, setHours] = useState<Hour[]>([]);

  const bg = dark ? "#0F0F14" : "#F5F0EB";
  const surface = dark ? "rgba(255,255,255,0.04)" : "#fff";
  const border = dark ? "rgba(255,255,255,0.08)" : "#EDE8E3";
  const text = dark ? "#FFFAF5" : "#1A1A2E";
  const muted = dark ? "rgba(255,255,255,0.3)" : "#6B6B80";
  const inputBg = dark ? "rgba(255,255,255,0.05)" : "#fff";
  const inputBorder = dark ? "rgba(255,255,255,0.1)" : "#EDE8E3";

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

    const { data: tbls } = await supabase.from("tables").select("*").eq("restaurant_id", rest.id).order("name");
    setTables(tbls || []);

    const { data: hrs } = await supabase.from("opening_hours").select("*").eq("restaurant_id", rest.id).order("day_of_week");
    if (hrs && hrs.length > 0) {
      setHours(hrs);
    } else {
      setHours(DAYS.map((_,i) => ({ id: "", day_of_week: i, open_time: "11:00", close_time: "22:00", is_closed: i === 6 })));
    }
  }

  async function saveRestaurant() {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("restaurants").update({ name, phone, address }).eq("id", restaurantId);
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
    const { data } = await supabase.from("tables").insert([{ restaurant_id: restaurantId, name: `Tisch ${tables.length + 1}`, capacity: 2 }]).select().single();
    if (data) setTables([...tables, data]);
  }

  async function deleteTable(id: string) {
    const supabase = createClient();
    await supabase.from("tables").delete().eq("id", id);
    setTables(tables.filter(t => t.id !== id));
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

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 14px", background: inputBg, border: `1px solid ${inputBorder}`,
    borderRadius: "10px", fontSize: "14px", fontFamily: "inherit", color: text, outline: "none", transition: "border-color 0.2s",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "12px", fontWeight: 500, color: muted, marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.5px",
  };

  return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:"'DM Sans',sans-serif",display:"flex",transition:"background 0.3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus { border-color: #FF5C35 !important; }
        select { appearance: none; -webkit-appearance: none; }
        .tab-btn:hover { color: ${text} !important; }
        .save-btn:hover { background: #FF7A5A !important; transform: translateY(-1px); }
        .del-btn:hover { color: #F87171 !important; border-color: rgba(239,68,68,0.3) !important; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{width:"64px",background:dark?"#0A0A0F":"#1A1A2E",borderRight:`1px solid ${border}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0",position:"fixed",top:0,bottom:0,left:0,zIndex:50}}>
        <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"#FF5C35",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"32px"}}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5h12M3 9h8M3 13h5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
        {[
          {path:"/dashboard",active:false,icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>},
          {path:"/dashboard/new",active:false,icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>},
          {path:"/dashboard/settings",active:true,icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9 1.5V4M9 14v2.5M1.5 9H4M14 9h2.5M3.7 3.7l1.6 1.6M12.7 12.7l1.6 1.6M3.7 14.3l1.6-1.6M12.7 5.3l1.6-1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>},
        ].map((item,i) => (
          <button key={i} onClick={() => router.push(item.path)} style={{
            width:"40px",height:"40px",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",
            background: item.active ? "rgba(255,92,53,0.15)" : "transparent",
            border: item.active ? "1px solid rgba(255,92,53,0.2)" : "1px solid transparent",
            color: item.active ? "#FF5C35" : "rgba(255,255,255,0.3)",
            cursor:"pointer",marginBottom:"4px",transition:"all 0.15s"
          }}>{item.icon}</button>
        ))}
        <div style={{marginTop:"auto"}}>
          <button onClick={async () => { const s = createClient(); await s.auth.signOut(); router.push("/login"); }} style={{
            width:"40px",height:"40px",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",
            background:"transparent",border:"1px solid transparent",color:"rgba(255,255,255,0.25)",cursor:"pointer",
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 3H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M12 12l3-3-3-3M15 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{marginLeft:"64px",flex:1}}>
        {/* HEADER */}
        <header style={{height:"60px",borderBottom:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",background:dark?"rgba(15,15,20,0.95)":"rgba(245,240,235,0.95)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:40}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <span style={{fontSize:"13px",color:muted}}>tablely</span>
            <span style={{color:muted}}>›</span>
            <span style={{fontSize:"13px",color:text,fontWeight:500}}>Einstellungen</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            {saved && (
              <div style={{fontSize:"12px",color:"#34D399",display:"flex",alignItems:"center",gap:"4px",background:"rgba(52,211,153,0.1)",padding:"4px 10px",borderRadius:"6px",border:"1px solid rgba(52,211,153,0.2)"}}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#34D399" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Gespeichert
              </div>
            )}
            <button onClick={() => setDark(!dark)} style={{width:"36px",height:"36px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",background:surface,border:`1px solid ${border}`,cursor:"pointer",color:muted,transition:"all 0.2s"}}>
              {dark ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          </div>
        </header>

        <div style={{padding:"32px",maxWidth:"720px"}}>
          <div style={{marginBottom:"28px"}}>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,color:text,letterSpacing:"-0.5px",marginBottom:"6px"}}>Einstellungen</h1>
            <p style={{fontSize:"13px",color:muted,fontWeight:300}}>Restaurant, Tische und Öffnungszeiten verwalten.</p>
          </div>

          {/* TABS */}
          <div style={{display:"flex",gap:"0",background:surface,border:`1px solid ${border}`,borderRadius:"10px",padding:"4px",marginBottom:"24px",width:"fit-content"}}>
            {([
              {key:"restaurant",label:"Restaurant"},
              {key:"tables",label:"Tische"},
              {key:"hours",label:"Öffnungszeiten"},
            ] as const).map(t => (
              <button key={t.key} className="tab-btn" onClick={() => setTab(t.key)} style={{
                padding:"8px 20px",borderRadius:"7px",fontSize:"13px",fontWeight:500,cursor:"pointer",
                fontFamily:"inherit",border:"none",transition:"all 0.15s",
                background: tab===t.key ? (dark?"rgba(255,255,255,0.1)":"#1A1A2E") : "transparent",
                color: tab===t.key ? (dark?"#FFFAF5":"#fff") : muted,
              }}>{t.label}</button>
            ))}
          </div>

          {/* RESTAURANT TAB */}
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

              {slug && (
                <div style={{background:dark?"rgba(255,92,53,0.08)":"#FFF0EB",border:`1px solid rgba(255,92,53,0.2)`,borderRadius:"12px",padding:"16px"}}>
                  <div style={{fontSize:"11px",fontWeight:600,color:"#FF5C35",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"10px"}}>Dein Booking Link</div>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <div style={{flex:1,padding:"10px 14px",background:inputBg,border:`1px solid ${inputBorder}`,borderRadius:"8px",fontSize:"13px",color:text,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {`${typeof window !== "undefined" ? window.location.origin : "https://tablely.at"}/book/${slug}`}
                    </div>
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`);
                      showSaved();
                    }} style={{flexShrink:0,padding:"10px 14px",background:"#FF5C35",color:"#fff",border:"none",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
                      Kopieren
                    </button>
                  </div>
                  <div style={{fontSize:"12px",color:muted,marginTop:"8px"}}>Teile diesen Link mit deinen Gästen — sie können direkt online reservieren.</div>
                </div>
              )}

              <button className="save-btn" onClick={saveRestaurant} disabled={saving} style={{
                background:"#FF5C35",color:"#fff",border:"none",padding:"12px 24px",borderRadius:"10px",
                fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                opacity:saving?0.7:1,transition:"all 0.2s",alignSelf:"flex-start"
              }}>
                {saving ? "Wird gespeichert..." : "Änderungen speichern"}
              </button>
            </div>
          )}

          {/* TABLES TAB */}
          {tab === "tables" && (
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {tables.map((t,i) => (
                <div key={t.id} style={{background:surface,border:`1px solid ${border}`,borderRadius:"12px",padding:"16px 20px",display:"flex",alignItems:"center",gap:"12px"}}>
                  <input
                    style={{...inputStyle,flex:1}}
                    type="text" value={t.name}
                    onChange={e => setTables(tables.map((tb,j) => j===i ? {...tb,name:e.target.value} : tb))}
                    onBlur={() => saveTable(t)}
                  />
                  <select
                    style={{...inputStyle,width:"120px"}}
                    value={t.capacity}
                    onChange={e => { const updated = tables.map((tb,j) => j===i ? {...tb,capacity:parseInt(e.target.value)} : tb); setTables(updated); saveTable(updated[i]); }}
                  >
                    {[1,2,3,4,5,6,7,8,10,12].map(n => <option key={n} value={n}>{n} Pers.</option>)}
                  </select>
                  <button className="del-btn" onClick={() => deleteTable(t.id)} style={{
                    width:"36px",height:"36px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",
                    background:"transparent",border:`1px solid ${border}`,cursor:"pointer",color:muted,flexShrink:0,transition:"all 0.15s"
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M5 3V2h4v1M3 3l1 9h6l1-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              ))}
              <button onClick={addTable} style={{
                background:"transparent",border:`1px dashed ${border}`,borderRadius:"12px",padding:"14px",
                fontSize:"13px",fontWeight:500,color:muted,cursor:"pointer",fontFamily:"inherit",
                display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",transition:"all 0.15s"
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                Tisch hinzufügen
              </button>
            </div>
          )}

          {/* HOURS TAB */}
          {tab === "hours" && (
            <div style={{background:surface,border:`1px solid ${border}`,borderRadius:"16px",padding:"24px",display:"flex",flexDirection:"column",gap:"0"}}>
              {DAYS.map((day,i) => {
                const h = hours[i];
                if (!h) return null;
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 0",borderBottom: i<6 ? `1px solid ${border}` : "none"}}>
                    <span style={{width:"100px",fontSize:"13px",fontWeight:500,color:text,flexShrink:0}}>{day}</span>
                    {h.is_closed ? (
                      <span style={{fontSize:"13px",color:muted,flex:1}}>Geschlossen</span>
                    ) : (
                      <>
                        <input style={{...inputStyle,width:"100px"}} type="time" value={h.open_time} onChange={e => setHours(hours.map((hr,j) => j===i ? {...hr,open_time:e.target.value} : hr))} />
                        <span style={{fontSize:"13px",color:muted}}>–</span>
                        <input style={{...inputStyle,width:"100px"}} type="time" value={h.close_time} onChange={e => setHours(hours.map((hr,j) => j===i ? {...hr,close_time:e.target.value} : hr))} />
                      </>
                    )}
                    <label style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",color:muted,cursor:"pointer",flexShrink:0}}>
                      <input type="checkbox" checked={h.is_closed} onChange={e => setHours(hours.map((hr,j) => j===i ? {...hr,is_closed:e.target.checked} : hr))} />
                      Geschlossen
                    </label>
                  </div>
                );
              })}
              <button className="save-btn" onClick={saveHours} disabled={saving} style={{
                background:"#FF5C35",color:"#fff",border:"none",padding:"12px 24px",borderRadius:"10px",
                fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                opacity:saving?0.7:1,transition:"all 0.2s",alignSelf:"flex-start",marginTop:"20px"
              }}>
                {saving ? "Wird gespeichert..." : "Öffnungszeiten speichern"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}