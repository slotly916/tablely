"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Reservation = {
  id: string;
  guest_name: string;
  guest_phone: string;
  party_size: number;
  date: string;
  time: string;
  status: string;
  channel: string;
  notes: string;
};

type Restaurant = {
  id: string;
  name: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"today"|"upcoming"|"all">("today");
  const [dark, setDark] = useState(true);

  const bg = dark ? "#0F0F14" : "#F5F0EB";
  const surface = dark ? "rgba(255,255,255,0.04)" : "#fff";
  const border = dark ? "rgba(255,255,255,0.08)" : "#EDE8E3";
  const text = dark ? "#FFFAF5" : "#1A1A2E";
  const muted = dark ? "rgba(255,255,255,0.3)" : "#6B6B80";
  const subtle = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: rest } = await supabase.from("restaurants").select("*").eq("email", user.email).single();
    if (!rest) { router.push("/onboarding"); return; }
    setRestaurant(rest);
    const { data: res } = await supabase.from("reservations").select("*").eq("restaurant_id", rest.id).order("date", { ascending: true }).order("time", { ascending: true });
    setReservations(res || []);
    setLoading(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("reservations").update({ status }).eq("id", id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  const today = new Date().toISOString().split("T")[0];
  const filtered = reservations.filter(r => {
    if (filter === "today") return r.date === today;
    if (filter === "upcoming") return r.date >= today;
    return true;
  });
  const stats = {
    today: reservations.filter(r => r.date === today).length,
    upcoming: reservations.filter(r => r.date > today).length,
    total: reservations.length,
  };

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:bg,fontFamily:"'DM Sans',sans-serif",flexDirection:"column",gap:"16px"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:"24px",height:"24px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.1)",borderTopColor:"#FF5C35",animation:"spin 0.7s linear infinite"}}/>
      <div style={{color:"rgba(255,255,255,0.3)",fontSize:"13px",letterSpacing:"0.5px"}}>Wird geladen</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:"'DM Sans',sans-serif",display:"flex",transition:"background 0.3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .nav-item { transition: all 0.15s; }
        .nav-item:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.8) !important; }
        .nav-item.active { background: rgba(255,92,53,0.12) !important; color: #FF5C35 !important; border: 1px solid rgba(255,92,53,0.2) !important; }
        .res-card:hover { background: rgba(255,255,255,0.04) !important; }
        .stat-card { animation: fadeIn 0.4s ease both; }
        .stat-card:nth-child(1) { animation-delay: 0s; }
        .stat-card:nth-child(2) { animation-delay: 0.08s; }
        .stat-card:nth-child(3) { animation-delay: 0.16s; }
        .add-btn:hover { background: #FF7A5A !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,92,53,0.35) !important; }
        .filter-pill:hover { background: rgba(255,255,255,0.06) !important; }
        select { appearance: none; -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{width:"64px",background:dark?"#0A0A0F":"#1A1A2E",borderRight:`1px solid ${border}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0",position:"fixed",top:0,bottom:0,left:0,zIndex:50}}>
        {/* Logo mark */}
        <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"#FF5C35",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"32px",flexShrink:0}}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5h12M3 9h8M3 13h5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>

        {/* Nav icons */}
        {[
          {path:"/dashboard", tip:"Dashboard", active:true, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>},
          {path:"/dashboard/new", tip:"Neue Reservierung", active:false, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>},
          {path:"/dashboard/settings", tip:"Einstellungen", active:false, icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9 1.5V4M9 14v2.5M1.5 9H4M14 9h2.5M3.7 3.7l1.6 1.6M12.7 12.7l1.6 1.6M3.7 14.3l1.6-1.6M12.7 5.3l1.6-1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>},
        ].map((item,i) => (
          <button key={i} className={`nav-item${item.active?" active":""}`} onClick={() => router.push(item.path)} title={item.tip} style={{
            width:"40px",height:"40px",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",
            background:"transparent",border:"1px solid transparent",cursor:"pointer",marginBottom:"4px",
            color: item.active ? "#FF5C35" : "rgba(255,255,255,0.3)",
          }}>
            {item.icon}
          </button>
        ))}

        <div style={{marginTop:"auto"}}>
          <button className="nav-item" onClick={handleLogout} title="Abmelden" style={{
            width:"40px",height:"40px",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",
            background:"transparent",border:"1px solid transparent",cursor:"pointer",
            color:"rgba(255,255,255,0.25)",
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 3H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M12 12l3-3-3-3M15 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{marginLeft:"64px",flex:1,display:"flex",flexDirection:"column",minHeight:"100vh"}}>

        {/* TOP BAR */}
        <header style={{height:"60px",borderBottom:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",background:dark?"rgba(15,15,20,0.95)":"rgba(245,240,235,0.95)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:40}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <span style={{fontSize:"13px",color:muted}}>tablely</span>
            <span style={{color:muted}}>›</span>
            <span style={{fontSize:"13px",color:text,fontWeight:500}}>Dashboard</span>
            {restaurant && (
              <>
                <span style={{color:"rgba(255,255,255,0.15)"}}>›</span>
                <span style={{fontSize:"13px",color:"rgba(255,255,255,0.4)"}}>{restaurant.name}</span>
              </>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <button onClick={handleLogout} style={{
            background:"transparent",border:`1px solid ${border}`,color:muted,
            padding:"7px 14px",borderRadius:"8px",fontSize:"13px",fontWeight:500,
            cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",display:"flex",alignItems:"center",gap:"6px"
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Abmelden
          </button>
          <button onClick={() => setDark(!dark)} title={dark?"Hell":"Dunkel"} style={{
            width:"36px",height:"36px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",
            background:surface,border:`1px solid ${border}`,cursor:"pointer",color:muted,transition:"all 0.2s"
          }}>
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
          <button className="add-btn" onClick={() => router.push("/dashboard/new")} style={{
            background:"#FF5C35",color:"#fff",border:"none",padding:"8px 16px",borderRadius:"8px",
            fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
            display:"flex",alignItems:"center",gap:"6px",transition:"all 0.2s",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Reservierung
          </button>
          </div>
        </header>

        <div style={{padding:"32px",flex:1}}>

          {/* PAGE TITLE */}
          <div style={{marginBottom:"28px"}}>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700,color:text,letterSpacing:"-1px",marginBottom:"6px"}}>
              Guten {new Date().getHours() < 12 ? "Morgen" : new Date().getHours() < 18 ? "Tag" : "Abend"}{restaurant ? `, ${restaurant.name}` : ""}
            </h1>
            <p style={{fontSize:"13px",color:muted,fontWeight:300}}>
              {new Date().toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
            </p>
          </div>

          {/* STATS */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"32px"}}>
            {[
              {label:"Reservierungen heute", val:stats.today, change:"+2 vs. gestern", positive:true,
                icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="14" rx="2" stroke="#FF5C35" strokeWidth="1.4"/><path d="M2 9h16M6 2v3M14 2v3" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>},
              {label:"Kommende Reservierungen", val:stats.upcoming, change:"nächste 7 Tage", positive:true,
                icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#A78BFA" strokeWidth="1.4"/><path d="M10 6v4l3 2" stroke="#A78BFA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>},
              {label:"Gesamt", val:stats.total, change:"alle Reservierungen", positive:true,
                icon:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="7" r="3" stroke="#34D399" strokeWidth="1.4"/><path d="M2 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#34D399" strokeWidth="1.4" strokeLinecap="round"/><path d="M14 5a3 3 0 0 1 0 6M18 17c0-2.8-1.8-5.1-4.3-5.8" stroke="#34D399" strokeWidth="1.4" strokeLinecap="round"/></svg>},
            ].map((s,i) => (
              <div key={i} className="stat-card" style={{
                background:surface,border:`1px solid ${border}`,
                borderRadius:"16px",padding:"20px 24px",transition:"background 0.3s"
              }}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
                  <span style={{fontSize:"12px",color:muted,fontWeight:400,letterSpacing:"0.2px"}}>{s.label}</span>
                  <div style={{width:"36px",height:"36px",borderRadius:"10px",background:subtle,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {s.icon}
                  </div>
                </div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"40px",fontWeight:700,color:text,letterSpacing:"-2px",lineHeight:1,marginBottom:"8px"}}>{s.val}</div>
                <div style={{fontSize:"11px",color:muted}}>{s.change}</div>
              </div>
            ))}
          </div>

          {/* SECTION HEADER */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
            <div style={{display:"flex",gap:"4px",background:surface,border:`1px solid ${border}`,borderRadius:"10px",padding:"4px"}}>
              {([
                {key:"today",label:"Heute"},
                {key:"upcoming",label:"Kommend"},
                {key:"all",label:"Alle"},
              ] as const).map(f => (
                <button key={f.key} className="filter-pill" onClick={() => setFilter(f.key)} style={{
                  padding:"7px 16px",borderRadius:"7px",fontSize:"13px",fontWeight:500,
                  cursor:"pointer",fontFamily:"inherit",border:"none",transition:"all 0.15s",
                  background: filter === f.key ? (dark?"rgba(255,255,255,0.1)":"#1A1A2E") : "transparent",
                  color: filter === f.key ? (dark?"#FFFAF5":"#fff") : muted,
                }}>
                  {f.label}
                  <span style={{marginLeft:"6px",fontSize:"11px",background: filter===f.key ? "rgba(255,92,53,0.3)" : "rgba(255,255,255,0.08)",color: filter===f.key ? "#FF5C35" : "rgba(255,255,255,0.3)",padding:"1px 6px",borderRadius:"10px"}}>
                    {f.key==="today" ? stats.today : f.key==="upcoming" ? stats.upcoming : stats.total}
                  </span>
                </button>
              ))}
            </div>
            <span style={{fontSize:"12px",color:muted}}>{filtered.length} Einträge</span>
          </div>

          {/* TABLE */}
          {filtered.length === 0 ? (
            <div style={{background:surface,border:`1px solid ${border}`,borderRadius:"16px",padding:"64px 32px",textAlign:"center"}}>
              <div style={{width:"52px",height:"52px",borderRadius:"14px",background:"rgba(255,92,53,0.1)",border:"1px solid rgba(255,92,53,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="3" width="18" height="16" rx="2.5" stroke="#FF5C35" strokeWidth="1.4"/><path d="M2 8h18M7 2v2M15 2v2" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:text,marginBottom:"8px"}}>Keine Reservierungen</div>
              <div style={{fontSize:"13px",color:muted,marginBottom:"24px",fontWeight:300}}>
                {filter === "today" ? "Heute noch keine Reservierungen." : "Keine Reservierungen für diesen Zeitraum."}
              </div>
              <button className="add-btn" onClick={() => router.push("/dashboard/new")} style={{
                background:"#FF5C35",color:"#fff",border:"none",padding:"10px 20px",borderRadius:"8px",
                fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                display:"inline-flex",alignItems:"center",gap:"6px",transition:"all 0.2s"
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Reservierung hinzufügen
              </button>
            </div>
          ) : (
            <div style={{background:surface,border:`1px solid ${border}`,borderRadius:"16px",overflow:"hidden"}}>
              {/* Header */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 80px 110px 80px 110px 160px",gap:"12px",padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                {["Gast","Personen","Datum","Uhrzeit","Kanal","Status"].map((h,i) => (
                  <div key={i} style={{fontSize:"10px",fontWeight:600,color:"rgba(255,255,255,0.25)",textTransform:"uppercase",letterSpacing:"0.8px"}}>{h}</div>
                ))}
              </div>

              {filtered.map((r,i) => (
                <div key={r.id} className="res-card" style={{
                  display:"grid",gridTemplateColumns:"1fr 80px 110px 80px 110px 160px",gap:"12px",
                  padding:"14px 20px",borderBottom: i < filtered.length-1 ? `1px solid ${border}` : "none",
                  alignItems:"center",background:"transparent",transition:"background 0.15s"
                }}>
                  {/* Gast */}
                  <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                    <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"rgba(255,92,53,0.15)",border:"1px solid rgba(255,92,53,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:600,color:"#FF5C35",flexShrink:0}}>
                      {r.guest_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:"13px",fontWeight:500,color:"#FFFAF5"}}>{r.guest_name}</div>
                      {r.guest_phone && <div style={{fontSize:"11px",color:"rgba(255,255,255,0.3)"}}>{r.guest_phone}</div>}
                    </div>
                  </div>

                  <div style={{fontSize:"13px",color:muted,fontWeight:400}}>{r.party_size} Pers.</div>

                  <div style={{fontSize:"13px",color:muted}}>
                    {new Date(r.date).toLocaleDateString("de-AT",{day:"numeric",month:"short"})}
                  </div>

                  <div style={{fontSize:"13px",fontWeight:500,color:text}}>{r.time.slice(0,5)}</div>

                  <div style={{
                    fontSize:"11px",fontWeight:600,padding:"3px 8px",borderRadius:"6px",width:"fit-content",letterSpacing:"0.2px",
                    background: r.channel==="whatsapp" ? "rgba(37,211,102,0.1)" : r.channel==="phone" ? "rgba(255,92,53,0.1)" : "rgba(99,102,241,0.1)",
                    color: r.channel==="whatsapp" ? "#25D366" : r.channel==="phone" ? "#FF5C35" : "#818CF8",
                    border: `1px solid ${r.channel==="whatsapp" ? "rgba(37,211,102,0.2)" : r.channel==="phone" ? "rgba(255,92,53,0.2)" : "rgba(99,102,241,0.2)"}`,
                  }}>
                    {r.channel==="whatsapp" ? "WhatsApp" : r.channel==="phone" ? "Telefon" : "Online"}
                  </div>

                  <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)} style={{
                    fontSize:"11px",fontWeight:600,padding:"5px 10px",borderRadius:"7px",cursor:"pointer",
                    fontFamily:"inherit",letterSpacing:"0.2px",outline:"none",
                    background: r.status==="confirmed" ? "rgba(52,211,153,0.1)" : r.status==="cancelled" ? "rgba(239,68,68,0.1)" : r.status==="completed" ? "rgba(99,102,241,0.1)" : "rgba(251,191,36,0.1)",
                    color: r.status==="confirmed" ? "#34D399" : r.status==="cancelled" ? "#F87171" : r.status==="completed" ? "#818CF8" : "#FCD34D",
                    border: `1px solid ${r.status==="confirmed" ? "rgba(52,211,153,0.25)" : r.status==="cancelled" ? "rgba(239,68,68,0.25)" : r.status==="completed" ? "rgba(99,102,241,0.25)" : "rgba(251,191,36,0.25)"}`,
                  }}>
                    <option value="confirmed">✓ Bestätigt</option>
                    <option value="pending">◐ Ausstehend</option>
                    <option value="cancelled">✕ Storniert</option>
                    <option value="completed">● Abgeschlossen</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}