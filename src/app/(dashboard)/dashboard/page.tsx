"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Reservation = {
  id: string;
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
};

type Table = {
  id: string;
  name: string;
  capacity: number;
  combined_with?: string | null;
};

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  stay_duration?: number; // in minutes, default 150
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

export default function Dashboard() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const dark = false;
  const [view, setView] = useState<"list"|"tables">("list");
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [showWalkin, setShowWalkin] = useState(false);
  const [walkinParty, setWalkinParty] = useState("2");
  const [walkinDate, setWalkinDate] = useState(new Date().toISOString().split("T")[0]);
  const [walkinTime, setWalkinTime] = useState("19:00");
  const [suggestedTable, setSuggestedTable] = useState<Table | null>(null);
  const [walkinName, setWalkinName] = useState("");
  const [savingWalkin, setSavingWalkin] = useState(false);
  const [newPendingRes, setNewPendingRes] = useState<Reservation | null>(null);
  const [confirmingRes, setConfirmingRes] = useState(false);

  const stayDuration = restaurant?.stay_duration || 150; // default 2.5h

  const bg = dark ? "#0F0F14" : "#F5F0EB";
  const surface = dark ? "rgba(255,255,255,.04)" : "#fff";
  const border = dark ? "rgba(255,255,255,.08)" : "#EDE8E3";
  const text = dark ? "#FFFAF5" : "#1A1A2E";
  const muted = dark ? "rgba(255,255,255,.3)" : "#6B6B80";
  const sidebarBg = dark ? "#0A0A0F" : "#1A1A2E";

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: rest } = await supabase.from("restaurants").select("*").eq("email", user.email).single();
    if (!rest) { router.push("/onboarding"); return; }
    setRestaurant(rest);

    const { data: res } = await supabase.from("reservations").select("*")
      .eq("restaurant_id", rest.id).order("date").order("time");
    setReservations(res || []);

    const { data: tbls } = await supabase.from("tables").select("*").eq("restaurant_id", rest.id).order("name");
    setTables(tbls || []);

    setLoading(false);
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime — neue Reservierungen
  useEffect(() => {
    if (!restaurant?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard-${restaurant.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "reservations",
      }, (payload) => {
        const newRes = payload.new as Reservation;
        setReservations(prev => [...prev, newRes]);
        // Popup nur für Großgruppen (15+ Personen)
        if (newRes.party_size >= 15) {
          setNewPendingRes(newRes);
        }
      })
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });
    return () => { supabase.removeChannel(channel); };
  }, [restaurant?.id]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function confirmReservation(res: Reservation) {
    setConfirmingRes(true);
    const supabase = createClient();
    await supabase.from("reservations").update({ status: "confirmed" }).eq("id", res.id);
    setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: "confirmed" } : r));
    // WhatsApp Bestätigung senden
    if (res.guest_phone && res.channel === "whatsapp") {
      await fetch("/api/whatsapp-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: res.guest_phone,
          message: `✅ Deine Reservierung bei ${restaurant?.name} wurde bestätigt!

📅 ${new Date(res.date).toLocaleDateString("de-AT", {weekday:"long",day:"numeric",month:"long"})}
🕐 ${res.time.slice(0,5)} Uhr
👥 ${res.party_size} ${res.party_size===1?"Person":"Personen"}

Wir freuen uns auf dich!`,
        }),
      });
    }
    setNewPendingRes(null);
    setConfirmingRes(false);
  }

  async function cancelReservation(res: Reservation) {
    setConfirmingRes(true);
    const supabase = createClient();
    await supabase.from("reservations").update({ status: "cancelled" }).eq("id", res.id);
    setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: "cancelled" } : r));
    // WhatsApp Stornierung senden
    if (res.guest_phone && res.channel === "whatsapp") {
      await fetch("/api/whatsapp-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: res.guest_phone,
          message: `❌ Deine Reservierungsanfrage bei ${restaurant?.name} für den ${new Date(res.date).toLocaleDateString("de-AT", {weekday:"long",day:"numeric",month:"long"})} um ${res.time.slice(0,5)} Uhr konnte leider nicht bestätigt werden.

Bitte kontaktiere uns direkt für einen alternativen Termin.`,
        }),
      });
    }
    setNewPendingRes(null);
    setConfirmingRes(false);
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("reservations").update({ status }).eq("id", id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  function suggestTable() {
    const party = parseInt(walkinParty);
    const resOnDay = reservations.filter(r => r.date === walkinDate && r.status !== "cancelled");
    const walkinMins = timeToMinutes(walkinTime);

    // Find tables that are free at requested time
    const freeTables = tables.filter(t => {
      if (t.capacity < party) return false;
      const isOccupied = resOnDay.some(r => {
        if (r.table_id !== t.id) return false;
        const start = timeToMinutes(r.time);
        const end = start + stayDuration;
        return walkinMins < end && walkinMins + stayDuration > start;
      });
      return !isOccupied;
    }).sort((a, b) => a.capacity - b.capacity);

    setSuggestedTable(freeTables[0] || null);
  }

  async function saveWalkin(tableId?: string) {
    if (!walkinName || !restaurant) return;
    setSavingWalkin(true);
    const supabase = createClient();
    await supabase.from("reservations").insert([{
      restaurant_id: restaurant.id,
      guest_name: walkinName,
      party_size: parseInt(walkinParty),
      date: walkinDate,
      time: walkinTime,
      table_id: tableId || suggestedTable?.id || null,
      channel: "walkin",
      status: "confirmed",
    }]);
    await loadData();
    setShowWalkin(false);
    setSuggestedTable(null);
    setWalkinName("");
    setSavingWalkin(false);
  }

  const today = new Date().toISOString().split("T")[0];
  const todayRes = reservations.filter(r => r.date === today);
  const filteredRes = reservations.filter(r => {
    const matchDate = r.date === filterDate;
    const matchChannel = filterChannel === "all" || r.channel === filterChannel;
    return matchDate && matchChannel;
  });

  // Stats
  const stats = {
    today: todayRes.length,
    online: todayRes.filter(r => r.channel === "online").length,
    whatsapp: todayRes.filter(r => r.channel === "whatsapp").length,
    phone: todayRes.filter(r => r.channel === "phone").length,
    walkin: todayRes.filter(r => r.channel === "walkin").length,
    pending: reservations.filter(r => r.status === "pending").length,
  };

  // Table timeline data
  function getTableReservations(tableId: string) {
    return filteredRes.filter(r => r.table_id === tableId);
  }

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0F0F14",fontFamily:"'DM Sans',sans-serif",flexDirection:"column",gap:"12px"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:"24px",height:"24px",borderRadius:"50%",border:"2px solid rgba(255,255,255,.1)",borderTopColor:"#FF5C35",animation:"spin 0.7s linear infinite"}}/>
      <div style={{color:"rgba(255,255,255,.3)",fontSize:"13px"}}>Wird geladen...</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:"'DM Sans',sans-serif",display:"flex",transition:"background .3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .nav-btn:hover{background:rgba(255,255,255,.08)!important;}
        .res-row:hover{background:${dark?"rgba(255,255,255,.03)":"#FAFAF8"}!important;}
        select{appearance:none;-webkit-appearance:none;}
        input[type=date]{color-scheme:${dark?"dark":"light"};}
        input[type=time]{color-scheme:${dark?"dark":"light"};}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px;}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{width:"220px",background:sidebarBg,display:"flex",flexDirection:"column",padding:"20px 12px",position:"fixed",top:0,bottom:0,left:0,zIndex:50,borderRight:`1px solid ${border}`}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"#FFFAF5",marginBottom:"32px",paddingLeft:"8px"}}>
          table<span style={{color:"#FF5C35"}}>ly</span>
        </div>

        {[
          {label:"Dashboard",path:"/dashboard",active:true,icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/></svg>},
          {label:"Neue Reservierung",path:"/dashboard/new",active:false,icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>},
          {label:"Einstellungen",path:"/dashboard/settings",active:false,icon:<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5V4M8 12v2.5M1.5 8H4M12 8h2.5M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>},
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
          <button className="nav-btn" onClick={handleLogout} style={{
            display:"flex",alignItems:"center",gap:"8px",padding:"9px 10px",borderRadius:"8px",
            background:"transparent",border:"1px solid rgba(255,255,255,.08)",
            color:"rgba(255,255,255,.3)",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Abmelden
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{marginLeft:"220px",flex:1,display:"flex",flexDirection:"column",minHeight:"100vh"}}>

        {/* TOPBAR */}
        <header style={{height:"56px",borderBottom:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",background:dark?"rgba(15,15,20,.95)":"rgba(245,240,235,.95)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:40}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"13px",color:muted}}>tablely</span>
            <span style={{color:muted,fontSize:"12px"}}>›</span>
            <span style={{fontSize:"13px",color:text,fontWeight:500}}>Dashboard</span>
            {restaurant && <><span style={{color:muted,fontSize:"12px"}}>›</span><span style={{fontSize:"13px",color:muted}}>{restaurant.name}</span></>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <button onClick={() => setShowWalkin(true)} style={{
              display:"flex",alignItems:"center",gap:"6px",padding:"7px 14px",borderRadius:"7px",
              background:"rgba(251,191,36,.15)",border:"1px solid rgba(251,191,36,.25)",
              color:"#FCD34D",fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
            }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Walk-in
            </button>


          </div>
        </header>

        <div style={{padding:"24px",flex:1}}>

          {/* GREETING + DATE */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"24px",flexWrap:"wrap",gap:"12px"}}>
            <div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"26px",fontWeight:700,color:text,letterSpacing:"-.5px",marginBottom:"4px"}}>
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

          {/* STATS */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"10px",marginBottom:"24px"}}>
            {[
              {label:"Heute",val:stats.today,color:"#FF5C35",bg:"rgba(255,92,53,.1)"},
              {label:"Online",val:stats.online,color:"#818CF8",bg:"rgba(99,102,241,.1)"},
              {label:"WhatsApp",val:stats.whatsapp,color:"#25D366",bg:"rgba(37,211,102,.1)"},
              {label:"Telefon",val:stats.phone,color:"#FF5C35",bg:"rgba(255,92,53,.08)"},
              {label:"Walk-in",val:stats.walkin,color:"#FCD34D",bg:"rgba(251,191,36,.1)"},
              {label:"Ausstehend",val:stats.pending,color:"#FCD34D",bg:"rgba(251,191,36,.08)"},
            ].map((s,i) => (
              <div key={i} style={{background:surface,border:`1px solid ${border}`,borderRadius:"12px",padding:"14px 12px",textAlign:"center"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:s.color,letterSpacing:"-1px",marginBottom:"4px"}}>{s.val}</div>
                <div style={{fontSize:"11px",color:muted,fontWeight:400}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* VIEW TOGGLE + CHANNEL FILTER */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px",flexWrap:"wrap",gap:"10px"}}>
            <div style={{display:"flex",gap:"4px",background:surface,border:`1px solid ${border}`,borderRadius:"9px",padding:"3px"}}>
              {[{k:"list",l:"Liste"},{k:"tables",l:"Tischkarte"}].map(v => (
                <button key={v.k} onClick={() => setView(v.k as "list"|"tables")} style={{
                  padding:"6px 16px",borderRadius:"7px",fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:"none",transition:"all .15s",
                  background: view===v.k ? (dark?"rgba(255,255,255,.12)":"#1A1A2E") : "transparent",
                  color: view===v.k ? (dark?"#FFFAF5":"#fff") : muted,
                }}>{v.l}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
              {CHANNELS.map(c => (
                <button key={c.key} onClick={() => setFilterChannel(c.key)} style={{
                  padding:"5px 12px",borderRadius:"6px",fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${border}`,transition:"all .15s",
                  background: filterChannel===c.key ? "#FF5C35" : "transparent",
                  color: filterChannel===c.key ? "#fff" : muted,
                  borderColor: filterChannel===c.key ? "#FF5C35" : border,
                }}>{c.label}</button>
              ))}
            </div>
          </div>

          {/* LIST VIEW */}
          {view === "list" && (
            <div style={{background:surface,border:`1px solid ${border}`,borderRadius:"14px",overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 80px 100px 80px 110px 160px",gap:"12px",padding:"10px 18px",borderBottom:`1px solid ${border}`,background:dark?"rgba(255,255,255,.02)":"rgba(0,0,0,.02)"}}>
                {["Gast","Personen","Datum","Uhrzeit","Kanal","Status"].map((h,i)=>(
                  <div key={i} style={{fontSize:"10px",fontWeight:600,color:muted,textTransform:"uppercase",letterSpacing:".7px"}}>{h}</div>
                ))}
              </div>
              {filteredRes.length === 0 ? (
                <div style={{padding:"48px",textAlign:"center",color:muted,fontSize:"14px",fontWeight:300}}>
                  Keine Reservierungen für diesen Tag / Filter.
                </div>
              ) : filteredRes.map((r,i) => (
                <div key={r.id} className="res-row" style={{
                  display:"grid",gridTemplateColumns:"1fr 80px 100px 80px 110px 160px",gap:"12px",
                  padding:"12px 18px",borderBottom:i<filteredRes.length-1?`1px solid ${border}`:"none",
                  alignItems:"center",transition:"background .12s",
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <div style={{width:"30px",height:"30px",borderRadius:"50%",background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:600,color:"#FF5C35",flexShrink:0}}>
                      {r.guest_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:"13px",fontWeight:500,color:text}}>{r.guest_name}</div>
                      {r.guest_phone && <div style={{fontSize:"11px",color:muted}}>{r.guest_phone}</div>}
                      {r.notes && <div style={{fontSize:"10px",color:muted,fontStyle:"italic"}}>„{r.notes}"</div>}
                    </div>
                  </div>
                  <div style={{fontSize:"13px",color:muted}}>{r.party_size} Pers.</div>
                  <div style={{fontSize:"12px",color:muted}}>{new Date(r.date).toLocaleDateString("de-AT",{day:"numeric",month:"short"})}</div>
                  <div style={{fontSize:"13px",fontWeight:500,color:text}}>{r.time.slice(0,5)}</div>
                  <div style={{...CHANNEL_COLORS[r.channel]||{bg:"rgba(255,255,255,.1)",color:muted},fontSize:"11px",fontWeight:600,padding:"3px 8px",borderRadius:"5px",width:"fit-content"}}>
                    {r.channel==="online"?"Online":r.channel==="whatsapp"?"WhatsApp":r.channel==="phone"?"Telefon":"Walk-in"}
                  </div>
                  <select value={r.status} onChange={e=>updateStatus(r.id,e.target.value)} style={{
                    fontSize:"11px",fontWeight:600,padding:"4px 8px",borderRadius:"6px",cursor:"pointer",fontFamily:"inherit",
                    outline:"none",...STATUS_COLORS[r.status],border:`1px solid ${STATUS_COLORS[r.status]?.border||border}`,
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

          {/* TABLE VIEW */}
          {view === "tables" && (
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {tables.length === 0 ? (
                <div style={{background:surface,border:`1px solid ${border}`,borderRadius:"14px",padding:"48px",textAlign:"center",color:muted,fontSize:"14px"}}>
                  Noch keine Tische konfiguriert. Geh zu Einstellungen → Tische.
                </div>
              ) : tables.map(table => {
                const tableRes = getTableReservations(table.id);
                const slots = ["12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"];

                return (
                  <div key={table.id} style={{background:surface,border:`1px solid ${border}`,borderRadius:"12px",padding:"14px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                      <div style={{fontSize:"13px",fontWeight:600,color:text}}>{table.name}</div>
                      <div style={{fontSize:"11px",color:muted,background:dark?"rgba(255,255,255,.05)":"rgba(0,0,0,.05)",padding:"2px 8px",borderRadius:"5px"}}>
                        {table.capacity} Pers.
                      </div>
                      {tableRes.length === 0 && (
                        <div style={{fontSize:"11px",color:"#34D399",background:"rgba(52,211,153,.1)",padding:"2px 8px",borderRadius:"5px",border:"1px solid rgba(52,211,153,.2)"}}>
                          Frei
                        </div>
                      )}
                    </div>
                    {/* Timeline */}
                    <div style={{position:"relative",height:"40px",background:dark?"rgba(255,255,255,.03)":"rgba(0,0,0,.04)",borderRadius:"8px",overflow:"hidden"}}>
                      {/* Hour markers */}
                      {slots.map((s,i) => (
                        <div key={i} style={{position:"absolute",left:`${(i/10)*100}%`,top:0,bottom:0,borderLeft:`1px solid ${dark?"rgba(255,255,255,.06)":"rgba(0,0,0,.08)"}`,display:"flex",alignItems:"flex-end",paddingBottom:"3px"}}>
                          <span style={{fontSize:"8px",color:muted,paddingLeft:"2px",whiteSpace:"nowrap"}}>{s}</span>
                        </div>
                      ))}
                      {/* Reservation blocks */}
                      {tableRes.map(r => {
                        const startMins = timeToMinutes(r.time) - 12*60;
                        const totalMins = 10*60;
                        const left = Math.max(0,(startMins/totalMins)*100);
                        const width = Math.min((stayDuration/totalMins)*100, 100-left);
                        const colors = STATUS_COLORS[r.status] || STATUS_COLORS.confirmed;
                        return (
                          <div key={r.id} title={`${r.guest_name} · ${r.party_size} Pers. · ${r.time.slice(0,5)}`} style={{
                            position:"absolute",left:`${left}%`,width:`${width}%`,top:"4px",bottom:"4px",
                            background:colors.color,borderRadius:"5px",opacity:.85,
                            display:"flex",alignItems:"center",padding:"0 6px",overflow:"hidden",cursor:"default",
                          }}>
                            <span style={{fontSize:"10px",fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                              {r.guest_name} ({r.party_size})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {tableRes.length > 0 && (
                      <div style={{marginTop:"8px",display:"flex",gap:"8px",flexWrap:"wrap"}}>
                        {tableRes.map(r => (
                          <div key={r.id} style={{fontSize:"11px",color:muted}}>
                            {r.time.slice(0,5)} – {minutesToTime(timeToMinutes(r.time)+stayDuration)} · {r.guest_name} · {r.party_size} Pers.
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* NEUE RESERVIERUNG POPUP */}
      {newPendingRes && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:"24px"}}>
          <div style={{background:"#fff",borderRadius:"20px",padding:"32px",width:"100%",maxWidth:"460px",boxShadow:"0 40px 80px rgba(0,0,0,.3)",animation:"slideIn .3s ease"}}>
            <div style={{textAlign:"center",marginBottom:"24px"}}>
              <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"rgba(251,191,36,.15)",border:"2px solid rgba(251,191,36,.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z" fill="#FCD34D"/></svg>
              </div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E",marginBottom:"6px"}}>
                Neue Reservierung
              </h3>
              <p style={{fontSize:"13px",color:"#6B6B80",fontWeight:300}}>
                {newPendingRes.party_size >= 15 ? "Großgruppe — manuelle Bestätigung erforderlich" : "Neue Anfrage eingegangen"}
              </p>
            </div>

            <div style={{background:"#F5F0EB",borderRadius:"12px",padding:"16px 20px",marginBottom:"24px"}}>
              {[
                {l:"Name", v:newPendingRes.guest_name},
                {l:"Datum", v:new Date(newPendingRes.date).toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})},
                {l:"Uhrzeit", v:`${newPendingRes.time.slice(0,5)} Uhr`},
                {l:"Personen", v:`${newPendingRes.party_size} ${newPendingRes.party_size===1?"Person":"Personen"}`},
                ...(newPendingRes.guest_phone ? [{l:"Telefon", v:newPendingRes.guest_phone}] : []),
                {l:"Kanal", v:newPendingRes.channel==="whatsapp"?"WhatsApp":newPendingRes.channel==="online"?"Online":"Telefon"},
              ].map((r,i,arr)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<arr.length-1?"1px solid #EDE8E3":"none",fontSize:"14px"}}>
                  <span style={{color:"#6B6B80"}}>{r.l}</span>
                  <span style={{fontWeight:500,color:"#1A1A2E"}}>{r.v}</span>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:"10px"}}>
              <button onClick={()=>cancelReservation(newPendingRes)} disabled={confirmingRes} style={{
                flex:1,padding:"12px",borderRadius:"10px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",
                color:"#F87171",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                opacity:confirmingRes?0.6:1,
              }}>
                ✕ Stornieren
              </button>
              <button onClick={()=>confirmReservation(newPendingRes)} disabled={confirmingRes} style={{
                flex:2,padding:"12px",borderRadius:"10px",background:"#FF5C35",border:"none",
                color:"#fff",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                opacity:confirmingRes?0.6:1,
              }}>
                {confirmingRes?"Wird gespeichert...":"✓ Bestätigen & Gast benachrichtigen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WALK-IN MODAL */}
      {showWalkin && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"24px"}} onClick={e=>{if(e.target===e.currentTarget){setShowWalkin(false);setSuggestedTable(null);}}}>
          <div style={{background:dark?"#1A1A2E":"#fff",borderRadius:"16px",padding:"28px",width:"100%",maxWidth:"440px",border:`1px solid ${border}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:text}}>Walk-in</h3>
              <button onClick={()=>{setShowWalkin(false);setSuggestedTable(null);}} style={{background:"transparent",border:"none",color:muted,cursor:"pointer",fontSize:"18px",lineHeight:1}}>✕</button>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"16px"}}>
              <div>
                <label style={{fontSize:"11px",fontWeight:600,color:muted,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Name des Gastes</label>
                <input value={walkinName} onChange={e=>setWalkinName(e.target.value)} placeholder="Max Mustermann"
                  style={{width:"100%",padding:"9px 12px",borderRadius:"8px",border:`1px solid ${border}`,background:dark?"rgba(255,255,255,.05)":"#f9f9f9",color:text,fontSize:"14px",fontFamily:"inherit",outline:"none"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                <div>
                  <label style={{fontSize:"11px",fontWeight:600,color:muted,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Personen</label>
                  <select value={walkinParty} onChange={e=>setWalkinParty(e.target.value)}
                    style={{width:"100%",padding:"9px 12px",borderRadius:"8px",border:`1px solid ${border}`,background:dark?"rgba(255,255,255,.05)":"#f9f9f9",color:text,fontSize:"14px",fontFamily:"inherit",outline:"none"}}>
                    {[1,2,3,4,5,6,7,8,10,12,15,20].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:"11px",fontWeight:600,color:muted,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Datum</label>
                  <input type="date" value={walkinDate} onChange={e=>setWalkinDate(e.target.value)}
                    style={{width:"100%",padding:"9px 8px",borderRadius:"8px",border:`1px solid ${border}`,background:dark?"rgba(255,255,255,.05)":"#f9f9f9",color:text,fontSize:"13px",fontFamily:"inherit",outline:"none"}}/>
                </div>
                <div>
                  <label style={{fontSize:"11px",fontWeight:600,color:muted,textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Uhrzeit</label>
                  <input type="time" value={walkinTime} onChange={e=>setWalkinTime(e.target.value)}
                    style={{width:"100%",padding:"9px 8px",borderRadius:"8px",border:`1px solid ${border}`,background:dark?"rgba(255,255,255,.05)":"#f9f9f9",color:text,fontSize:"13px",fontFamily:"inherit",outline:"none"}}/>
                </div>
              </div>

              <button onClick={suggestTable} style={{
                padding:"10px",borderRadius:"8px",background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.25)",
                color:"#FF5C35",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
              }}>
                KI: Tisch vorschlagen →
              </button>

              {suggestedTable !== undefined && (
                <div style={{background:suggestedTable?"rgba(52,211,153,.1)":"rgba(239,68,68,.1)",border:`1px solid ${suggestedTable?"rgba(52,211,153,.25)":"rgba(239,68,68,.25)"}`,borderRadius:"10px",padding:"12px 14px"}}>
                  {suggestedTable ? (
                    <>
                      <div style={{fontSize:"12px",fontWeight:600,color:"#34D399",marginBottom:"4px"}}>✓ Tisch verfügbar</div>
                      <div style={{fontSize:"14px",color:text,fontWeight:500}}>{suggestedTable.name} — {suggestedTable.capacity} Personen</div>
                      <div style={{fontSize:"11px",color:muted,marginTop:"2px"}}>{walkinTime} – {minutesToTime(timeToMinutes(walkinTime)+stayDuration)} Uhr</div>
                    </>
                  ) : (
                    <>
                      <div style={{fontSize:"12px",fontWeight:600,color:"#F87171",marginBottom:"4px"}}>✗ Kein freier Tisch</div>
                      <div style={{fontSize:"13px",color:muted}}>Kein passender Tisch für {walkinParty} Personen zu dieser Zeit.</div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{setShowWalkin(false);setSuggestedTable(null);}} style={{
                flex:1,padding:"10px",borderRadius:"8px",background:"transparent",border:`1px solid ${border}`,
                color:muted,fontSize:"13px",cursor:"pointer",fontFamily:"inherit",
              }}>Abbrechen</button>
              {suggestedTable && (
                <button onClick={()=>saveWalkin(suggestedTable.id)} disabled={!walkinName||savingWalkin} style={{
                  flex:2,padding:"10px",borderRadius:"8px",background:"#FF5C35",border:"none",
                  color:"#fff",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                  opacity:!walkinName||savingWalkin?0.6:1,
                }}>
                  {savingWalkin?"Wird gespeichert...":"✓ Bestätigen & eintragen"}
                </button>
              )}
              <button onClick={()=>router.push("/dashboard/new")} style={{
                flex:1,padding:"10px",borderRadius:"8px",background:surface,border:`1px solid ${border}`,
                color:text,fontSize:"13px",cursor:"pointer",fontFamily:"inherit",
              }}>Manuell</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}