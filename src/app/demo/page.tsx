"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

const DEMO_SLUG = "alpengasthof-";
const WA_NUMBER = "+436705540779";
const WA_LINK = "https://wa.me/436705540779?text=Hallo!%20Ich%20m%C3%B6chte%20einen%20Tisch%20reservieren.";

type Reservation = {
  id: string;
  restaurant_id: string;
  guest_name: string;
  guest_phone: string | null;
  party_size: number;
  date: string;
  time: string;
  status: string;
  channel: string;
  notes: string | null;
  table_id: string | null;
};

type Table = { id: string; name: string; capacity: number; };

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(m: number) {
  return `${Math.floor(m/60).toString().padStart(2,"0")}:${(m%60).toString().padStart(2,"0")}`;
}

const STATUS_COLORS: Record<string,{bg:string;color:string;border:string}> = {
  confirmed: {bg:"rgba(52,211,153,.12)",color:"#34D399",border:"rgba(52,211,153,.25)"},
  pending:   {bg:"rgba(251,191,36,.12)",color:"#FCD34D",border:"rgba(251,191,36,.25)"},
  cancelled: {bg:"rgba(239,68,68,.12)", color:"#F87171",border:"rgba(239,68,68,.25)"},
  completed: {bg:"rgba(99,102,241,.12)",color:"#818CF8",border:"rgba(99,102,241,.25)"},
};
const CHANNEL_COLORS: Record<string,{bg:string;color:string}> = {
  online:   {bg:"rgba(99,102,241,.15)",color:"#818CF8"},
  whatsapp: {bg:"rgba(37,211,102,.15)",color:"#25D366"},
  phone:    {bg:"rgba(255,92,53,.15)", color:"#FF5C35"},
  walkin:   {bg:"rgba(251,191,36,.15)",color:"#FCD34D"},
};
const CHANNEL_LABELS: Record<string,string> = {
  online:"Online",whatsapp:"WhatsApp",phone:"Telefon",walkin:"Walk-in"
};

export default function DemoPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantObj, setRestaurantObj] = useState<{id:string;name:string;slug:string;stay_duration?:number}|null>(null);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterChannel, setFilterChannel] = useState("all");
  const [view, setView] = useState<"list"|"tables">("list");
  const [showWalkin, setShowWalkin] = useState(false);
  const [walkinName, setWalkinName] = useState("");
  const [walkinParty, setWalkinParty] = useState("2");
  const [walkinDate, setWalkinDate] = useState(new Date().toISOString().split("T")[0]);
  const [walkinTime, setWalkinTime] = useState("19:00");
  const [suggestedTable, setSuggestedTable] = useState<Table|null|undefined>(undefined);
  const [savingWalkin, setSavingWalkin] = useState(false);

  const stayDuration = restaurantObj?.stay_duration || 150;

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: rest } = await supabase.from("restaurants").select("*").eq("slug", DEMO_SLUG).single();
    if (!rest) return;
    setRestaurantId(rest.id);
    setRestaurantName(rest.name);
    setRestaurantObj(rest);
    const { data: res } = await supabase.from("reservations").select("*")
      .eq("restaurant_id", rest.id).order("date").order("time");
    setReservations(res || []);
    const { data: tbls } = await supabase.from("tables").select("*")
      .eq("restaurant_id", rest.id).order("name");
    setTables(tbls || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!restaurantId) return;
    const supabase = createClient();
    const ch = supabase.channel("demo-live")
      .on("postgres_changes", {event:"INSERT",schema:"public",table:"reservations"}, (payload) => {
        const r = payload.new as Reservation;
        if (r.restaurant_id !== restaurantId) return;
        setReservations(prev => [r, ...prev]);
      })
      .on("postgres_changes", {event:"UPDATE",schema:"public",table:"reservations"}, (payload) => {
        const r = payload.new as Reservation;
        if (r.restaurant_id !== restaurantId) return;
        setReservations(prev => prev.map(x => x.id===r.id ? r : x));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId]);

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("reservations").update({ status }).eq("id", id);
    setReservations(prev => prev.map(r => r.id===id ? {...r, status} : r));
  }

  function suggestTable() {
    const party = parseInt(walkinParty);
    const resOnDay = reservations.filter(r => r.date===walkinDate && r.status!=="cancelled");
    const walkinMins = timeToMinutes(walkinTime);
    const freeTables = tables.filter(t => {
      if (t.capacity < party) return false;
      const occupied = resOnDay.some(r => {
        if (r.table_id !== t.id) return false;
        const start = timeToMinutes(r.time);
        const end = start + stayDuration;
        return walkinMins < end && walkinMins + stayDuration > start;
      });
      return !occupied;
    }).sort((a,b) => a.capacity - b.capacity);
    setSuggestedTable(freeTables[0] || null);
  }

  async function saveWalkin(tableId?: string) {
    if (!walkinName || !restaurantId) return;
    setSavingWalkin(true);
    const supabase = createClient();
    await supabase.from("reservations").insert([{
      restaurant_id: restaurantId,
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
    setSuggestedTable(undefined);
    setWalkinName("");
    setSavingWalkin(false);
  }

  const today = new Date().toISOString().split("T")[0];
  const todayRes = reservations.filter(r => r.date===today);
  const filteredRes = reservations.filter(r => {
    const matchDate = r.date===filterDate;
    const matchChannel = filterChannel==="all" || r.channel===filterChannel;
    return matchDate && matchChannel;
  });

  const stats = {
    heute: todayRes.length,
    whatsapp: todayRes.filter(r=>r.channel==="whatsapp").length,
    online: todayRes.filter(r=>r.channel==="online").length,
    walkin: todayRes.filter(r=>r.channel==="walkin").length,
    pending: reservations.filter(r=>r.status==="pending").length,
  };

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0A0A0F",fontFamily:"'DM Sans',sans-serif",flexDirection:"column",gap:"12px"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:"24px",height:"24px",borderRadius:"50%",border:"2px solid rgba(255,255,255,.1)",borderTopColor:"#FF5C35",animation:"spin .7s linear infinite"}}/>
      <div style={{color:"rgba(255,255,255,.3)",fontSize:"13px"}}>Demo wird geladen...</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0A0A0F",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes arrowBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .wa-btn:hover{background:#20BA5A!important;transform:translateY(-1px);}
        .back-link:hover{color:#FF5C35!important;}
        select{appearance:none;-webkit-appearance:none;}
        .res-row:hover{background:#FAFAF8!important;}
        .nav-btn-dash:hover{background:rgba(255,255,255,.08)!important;}
      `}</style>

      {/* NAV */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 32px",borderBottom:"1px solid rgba(255,255,255,.06)",background:"rgba(10,10,15,.98)",backdropFilter:"blur(16px)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <a href="/" className="back-link" style={{display:"flex",alignItems:"center",gap:"6px",color:"rgba(255,255,255,.35)",textDecoration:"none",fontSize:"13px",transition:"color .2s"}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Zurück
          </a>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:700,color:"#FFFAF5"}}>
            table<span style={{color:"#FF5C35"}}>ly</span>
            <span style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,.25)",marginLeft:"8px"}}>Demo</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"6px",background:"rgba(52,211,153,.1)",border:"1px solid rgba(52,211,153,.2)",borderRadius:"20px",padding:"4px 12px"}}>
          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34D399",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:"11px",color:"#34D399",fontWeight:500}}>Live</span>
        </div>
      </nav>

      {/* INTRO */}
      <div style={{textAlign:"center",padding:"60px 24px 40px",background:"linear-gradient(to bottom,rgba(255,92,53,.04),transparent)"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.2)",borderRadius:"20px",padding:"5px 14px",marginBottom:"16px"}}>
          <span style={{fontSize:"11px",color:"#FF5C35",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px"}}>Interaktive Demo</span>
        </div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(32px,5vw,52px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-2px",lineHeight:1.05,marginBottom:"16px"}}>
          Buch oben — sieh es sofort unten.
        </h1>
        <p style={{fontSize:"16px",color:"rgba(255,255,255,.35)",fontWeight:300,maxWidth:"520px",margin:"0 auto 28px",lineHeight:1.75}}>
          Reserviere auf dem iPhone oder per WhatsApp — die Buchung erscheint sofort im Dashboard auf dem iPad. In Echtzeit.
        </p>
        <a href={WA_LINK} target="_blank" className="wa-btn" style={{
          display:"inline-flex",alignItems:"center",gap:"10px",
          background:"#25D366",color:"#fff",padding:"12px 24px",
          borderRadius:"10px",fontSize:"15px",fontWeight:500,textDecoration:"none",transition:"all .2s",marginBottom:"8px",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 1.5C5.3 1.5 1.5 5.3 1.5 10c0 1.5.4 2.9 1.1 4.2L1.5 18.5l4.4-1.1C7.1 18.1 8.5 18.5 10 18.5c4.7 0 8.5-3.8 8.5-8.5S14.7 1.5 10 1.5zm4.2 12c-.2.5-1 1-1.4 1-.4 0-.8.1-2.5-.5s-2.8-2-3.2-2.6c-.4-.6-1-1.6-1-2.6s.5-1.4.7-1.6c.2-.2.4-.3.6-.3h.4c.2 0 .3.1.5.5l.8 2c.1.2.1.4 0 .6l-.3.4c-.1.2-.2.3-.1.5.5.8 1.1 1.4 1.9 1.9.2.1.4.1.5-.1l.5-.6c.2-.2.3-.2.5-.1l2 1c.2.1.3.2.3.4-.1.3-.2.8-.4 1z" fill="white"/></svg>
          Per WhatsApp testen — {WA_NUMBER}
        </a>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,.25)"}}>oder direkt über das iPhone unten buchen</div>
      </div>

      {/* SCHRITT 1 — iPhone */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"0 24px 60px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"28px"}}>
          <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#FF5C35",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,color:"#fff",flexShrink:0}}>1</div>
          <div>
            <div style={{fontSize:"15px",fontWeight:500,color:"#FFFAF5",marginBottom:"2px"}}>Gast bucht eine Reservierung</div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,.35)",fontWeight:300}}>Genau so wie deine echten Gäste es machen</div>
          </div>
        </div>

        {/* iPhone 17 Pro — exakte Proportionen 393x852 */}
        <div style={{position:"relative",width:"320px",flexShrink:0}}>
          <div style={{
            background:"linear-gradient(145deg,#3A3A3C 0%,#1C1C1E 50%,#2C2C2E 100%)",
            borderRadius:"50px",
            padding:"13px",
            boxShadow:`
              0 0 0 1px rgba(255,255,255,.12),
              0 0 0 3px #1C1C1E,
              0 0 0 4px rgba(255,255,255,.06),
              0 60px 120px rgba(0,0,0,.85),
              inset 0 1px 0 rgba(255,255,255,.15),
              inset 0 -1px 0 rgba(0,0,0,.6)
            `,
            position:"relative",
          }}>
            {/* Dynamic Island */}
            <div style={{
              position:"absolute",top:"13px",left:"50%",transform:"translateX(-50%)",
              width:"100px",height:"28px",
              background:"#000",borderRadius:"18px",zIndex:10,
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"0 10px",
            }}>
              <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#1A1A1A",border:"1px solid rgba(255,255,255,.06)"}}/>
              <div style={{width:"40px",height:"6px",borderRadius:"4px",background:"#1A1A1A"}}/>
            </div>
            {/* Screen — 320px wide, proportional height 693px */}
            <div style={{borderRadius:"38px",overflow:"hidden",height:"693px",background:"#FFFAF5",position:"relative"}}>
              <iframe
                src={`/book/${DEMO_SLUG}`}
                style={{
                  width:"393px",
                  height:"852px",
                  border:"none",
                  transform:"scale(0.814)",
                  transformOrigin:"top left",
                }}
                title="Tablely Booking"
              />
            </div>
          </div>
          {/* Physical buttons */}
          <div style={{position:"absolute",right:"-4px",top:"145px",width:"4px",height:"70px",background:"#2C2C2E",borderRadius:"0 3px 3px 0"}}/>
          <div style={{position:"absolute",left:"-4px",top:"125px",width:"4px",height:"44px",background:"#2C2C2E",borderRadius:"3px 0 0 3px"}}/>
          <div style={{position:"absolute",left:"-4px",top:"179px",width:"4px",height:"44px",background:"#2C2C2E",borderRadius:"3px 0 0 3px"}}/>
          <div style={{position:"absolute",left:"-4px",top:"233px",width:"4px",height:"28px",background:"#2C2C2E",borderRadius:"3px 0 0 3px"}}/>
        </div>
      </div>

      {/* PFEIL */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",padding:"0 0 60px"}}>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,.3)",fontWeight:300}}>Buchung erscheint sofort im Dashboard</div>
        <div style={{width:"1px",height:"48px",background:"linear-gradient(to bottom,rgba(255,92,53,.6),rgba(255,92,53,.1))"}}/>
        <div style={{animation:"arrowBounce 1.5s ease-in-out infinite"}}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3v16M4 12l7 7 7-7" stroke="#FF5C35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {/* SCHRITT 2 — iPad */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"0 24px 100px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"28px"}}>
          <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#FF5C35",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,color:"#fff",flexShrink:0}}>2</div>
          <div>
            <div style={{fontSize:"15px",fontWeight:500,color:"#FFFAF5",marginBottom:"2px"}}>Restaurant verwaltet alles hier</div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,.35)",fontWeight:300}}>Vollständiges Dashboard — identisch mit dem echten</div>
          </div>
        </div>

        {/* iPad Pro 13" Mockup */}
        <div style={{width:"min(1000px,95vw)",position:"relative"}}>
          <div style={{
            background:"linear-gradient(145deg,#3A3A3C 0%,#1C1C1E 50%,#2C2C2E 100%)",
            borderRadius:"30px",
            padding:"22px",
            boxShadow:`
              0 0 0 1px rgba(255,255,255,.1),
              0 0 0 2px #1C1C1E,
              0 0 0 3px rgba(255,255,255,.06),
              0 60px 120px rgba(0,0,0,.7),
              inset 0 1px 0 rgba(255,255,255,.1)
            `,
            position:"relative",
          }}>
            {/* Camera */}
            <div style={{position:"absolute",top:"10px",left:"50%",transform:"translateX(-50%)",width:"8px",height:"8px",borderRadius:"50%",background:"#2C2C2E",border:"1px solid rgba(255,255,255,.06)"}}/>
            {/* Home indicator */}
            <div style={{position:"absolute",bottom:"8px",left:"50%",transform:"translateX(-50%)",width:"44px",height:"5px",background:"rgba(255,255,255,.08)",borderRadius:"3px"}}/>

            {/* Screen */}
            <div style={{borderRadius:"16px",overflow:"hidden",background:"#F5F0EB",height:"640px",display:"flex"}}>

              {/* SIDEBAR */}
              <div style={{width:"200px",background:"#1A1A2E",display:"flex",flexDirection:"column",padding:"16px 12px",flexShrink:0}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:700,color:"#FFFAF5",marginBottom:"28px",paddingLeft:"6px"}}>
                  table<span style={{color:"#FF5C35"}}>ly</span>
                </div>
                {[
                  {l:"Dashboard",a:true,icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3"/></svg>},
                  {l:"Neue Reservierung",a:false,icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>},
                  {l:"Einstellungen",a:false,icon:<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5V4M8 12v2.5M1.5 8H4M12 8h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>},
                ].map((item,i)=>(
                  <div key={i} className="nav-btn-dash" style={{
                    display:"flex",alignItems:"center",gap:"8px",
                    padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontWeight:500,marginBottom:"2px",
                    background:item.a?"rgba(255,92,53,.15)":"transparent",
                    color:item.a?"#FF5C35":"rgba(255,255,255,.4)",
                    border:item.a?"1px solid rgba(255,92,53,.2)":"1px solid transparent",
                    cursor:"pointer",transition:"all .15s",
                  }}>{item.icon}{item.l}</div>
                ))}
                <div style={{marginTop:"auto"}}>
                  <div style={{background:"rgba(255,255,255,.05)",borderRadius:"8px",padding:"10px",marginBottom:"8px"}}>
                    <div style={{fontSize:"9px",color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"2px"}}>Restaurant</div>
                    <div style={{fontSize:"12px",color:"#FFFAF5",fontWeight:500}}>{restaurantName}</div>
                    <div style={{fontSize:"9px",color:"rgba(255,92,53,.6)",marginTop:"2px"}}>Demo-Modus</div>
                  </div>
                </div>
              </div>

              {/* MAIN */}
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

                {/* TOPBAR */}
                <div style={{background:"rgba(245,240,235,.97)",borderBottom:"1px solid #EDE8E3",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                    <span style={{fontSize:"11px",color:"#6B6B80"}}>tablely</span>
                    <span style={{color:"#6B6B80",fontSize:"10px"}}>›</span>
                    <span style={{fontSize:"11px",color:"#1A1A2E",fontWeight:500}}>Dashboard</span>
                  </div>
                  <div style={{display:"flex",gap:"6px"}}>
                    <button onClick={()=>setShowWalkin(true)} style={{
                      display:"flex",alignItems:"center",gap:"4px",padding:"5px 10px",borderRadius:"6px",
                      background:"rgba(251,191,36,.15)",border:"1px solid rgba(251,191,36,.25)",
                      color:"#D97706",fontSize:"11px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                    }}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      Walk-in
                    </button>
                    <div style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"10px",color:"#34D399",background:"rgba(52,211,153,.1)",padding:"3px 8px",borderRadius:"10px",border:"1px solid rgba(52,211,153,.2)"}}>
                      <div style={{width:"4px",height:"4px",borderRadius:"50%",background:"#34D399",animation:"pulse 2s infinite"}}/>
                      Echtzeit
                    </div>
                  </div>
                </div>

                {/* GREETING */}
                <div style={{padding:"12px 16px 8px",background:"#F5F0EB",flexShrink:0}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-.3px"}}>
                    {new Date().getHours()<12?"Guten Morgen":new Date().getHours()<18?"Guten Tag":"Guten Abend"}, {restaurantName}
                  </div>
                  <div style={{fontSize:"11px",color:"#6B6B80",fontWeight:300}}>{new Date().toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
                </div>

                {/* STATS */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px",padding:"8px 16px",background:"#F5F0EB",flexShrink:0}}>
                  {[
                    {l:"Heute",v:stats.heute,c:"#FF5C35"},
                    {l:"WhatsApp",v:stats.whatsapp,c:"#25D366"},
                    {l:"Online",v:stats.online,c:"#818CF8"},
                    {l:"Walk-in",v:stats.walkin,c:"#D97706"},
                    {l:"Ausstehend",v:stats.pending,c:"#FCD34D"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:"#fff",border:"1px solid #EDE8E3",borderRadius:"10px",padding:"10px 8px",textAlign:"center"}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:s.c,letterSpacing:"-1px",lineHeight:1,marginBottom:"3px"}}>{s.v}</div>
                      <div style={{fontSize:"9px",color:"#6B6B80"}}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* FILTERS */}
                <div style={{padding:"8px 16px",background:"#F5F0EB",borderBottom:"1px solid #EDE8E3",display:"flex",alignItems:"center",gap:"8px",flexShrink:0,flexWrap:"wrap"}}>
                  <div style={{display:"flex",gap:"3px",background:"#fff",border:"1px solid #EDE8E3",borderRadius:"8px",padding:"2px"}}>
                    {[{k:"list",l:"Liste"},{k:"tables",l:"Tischkarte"}].map(v=>(
                      <button key={v.k} onClick={()=>setView(v.k as "list"|"tables")} style={{
                        padding:"4px 12px",borderRadius:"6px",fontSize:"10px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:"none",
                        background:view===v.k?"#1A1A2E":"transparent",
                        color:view===v.k?"#fff":"#6B6B80",
                      }}>{v.l}</button>
                    ))}
                  </div>
                  <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}
                    style={{padding:"4px 8px",borderRadius:"6px",border:"1px solid #EDE8E3",background:"#fff",color:"#1A1A2E",fontSize:"10px",fontFamily:"inherit",outline:"none"}}
                  />
                  <div style={{display:"flex",gap:"3px"}}>
                    {["all","online","whatsapp","phone","walkin"].map(c=>(
                      <button key={c} onClick={()=>setFilterChannel(c)} style={{
                        padding:"3px 8px",borderRadius:"5px",fontSize:"9px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                        border:"1px solid",transition:"all .12s",
                        background:filterChannel===c?"#FF5C35":"transparent",
                        color:filterChannel===c?"#fff":"#6B6B80",
                        borderColor:filterChannel===c?"#FF5C35":"#EDE8E3",
                      }}>{c==="all"?"Alle":c==="online"?"Online":c==="whatsapp"?"WhatsApp":c==="phone"?"Telefon":"Walk-in"}</button>
                    ))}
                  </div>
                </div>

                {/* LIST VIEW */}
                {view==="list" && (
                  <div style={{flex:1,overflowY:"auto"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 50px 80px 55px 80px 100px",gap:"8px",padding:"7px 16px",borderBottom:"1px solid #EDE8E3",background:"#FAFAF8"}}>
                      {["Gast","Pers.","Datum","Zeit","Kanal","Status"].map((h,i)=>(
                        <div key={i} style={{fontSize:"9px",fontWeight:600,color:"#6B6B80",textTransform:"uppercase",letterSpacing:".6px"}}>{h}</div>
                      ))}
                    </div>
                    {filteredRes.length===0 ? (
                      <div style={{padding:"40px",textAlign:"center",color:"#6B6B80",fontSize:"13px",fontWeight:300,lineHeight:1.6}}>
                        Noch keine Reservierungen.<br/><span style={{fontSize:"11px"}}>Mach eine Buchung oben auf dem iPhone!</span>
                      </div>
                    ) : filteredRes.map((r,i)=>(
                      <div key={r.id} className="res-row" style={{
                        display:"grid",gridTemplateColumns:"1fr 50px 80px 55px 80px 100px",gap:"8px",
                        padding:"9px 16px",borderBottom:i<filteredRes.length-1?"1px solid #F5F0EB":"none",
                        alignItems:"center",background:"#fff",transition:"background .12s",animation:"slideIn .3s ease",
                      }}>
                        <div style={{display:"flex",alignItems:"center",gap:"6px",minWidth:0}}>
                          <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"rgba(255,92,53,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700,color:"#FF5C35",flexShrink:0}}>
                            {r.guest_name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{fontSize:"11px",fontWeight:500,color:"#1A1A2E",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.guest_name}</span>
                        </div>
                        <div style={{fontSize:"11px",color:"#6B6B80"}}>{r.party_size}</div>
                        <div style={{fontSize:"10px",color:"#6B6B80"}}>{new Date(r.date).toLocaleDateString("de-AT",{day:"numeric",month:"short"})}</div>
                        <div style={{fontSize:"11px",fontWeight:500,color:"#1A1A2E"}}>{r.time.slice(0,5)}</div>
                        <div style={{...(CHANNEL_COLORS[r.channel]||{bg:"rgba(0,0,0,.05)",color:"#6B6B80"}),fontSize:"9px",fontWeight:600,padding:"2px 6px",borderRadius:"5px",width:"fit-content"}}>
                          {CHANNEL_LABELS[r.channel]||r.channel}
                        </div>
                        <select value={r.status} onChange={e=>updateStatus(r.id,e.target.value)} style={{
                          fontSize:"9px",fontWeight:600,padding:"3px 6px",borderRadius:"5px",cursor:"pointer",fontFamily:"inherit",outline:"none",
                          ...(STATUS_COLORS[r.status]||{bg:"rgba(0,0,0,.05)",color:"#6B6B80",border:"transparent"}),
                          border:`1px solid ${STATUS_COLORS[r.status]?.border||"#EDE8E3"}`,
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
                {view==="tables" && (
                  <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:"8px",background:"#F5F0EB"}}>
                    {tables.length===0 ? (
                      <div style={{background:"#fff",border:"1px solid #EDE8E3",borderRadius:"10px",padding:"32px",textAlign:"center",color:"#6B6B80",fontSize:"12px"}}>
                        Noch keine Tische konfiguriert.
                      </div>
                    ) : tables.map(table => {
                      const tableRes = filteredRes.filter(r=>r.table_id===table.id);
                      return (
                        <div key={table.id} style={{background:"#fff",border:"1px solid #EDE8E3",borderRadius:"10px",padding:"12px 14px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                            <span style={{fontSize:"12px",fontWeight:600,color:"#1A1A2E"}}>{table.name}</span>
                            <span style={{fontSize:"10px",color:"#6B6B80",background:"#F5F0EB",padding:"1px 6px",borderRadius:"4px"}}>{table.capacity} Pers.</span>
                            {tableRes.length===0&&<span style={{fontSize:"10px",color:"#34D399",background:"rgba(52,211,153,.1)",padding:"1px 6px",borderRadius:"4px"}}>Frei</span>}
                          </div>
                          <div style={{position:"relative",height:"32px",background:"rgba(0,0,0,.04)",borderRadius:"6px",overflow:"hidden"}}>
                            {["12","14","16","18","20","22"].map((h,i)=>(
                              <div key={i} style={{position:"absolute",left:`${(i/5)*100}%`,top:0,bottom:0,borderLeft:"1px solid rgba(0,0,0,.06)"}}>
                                <span style={{fontSize:"7px",color:"#6B6B80",position:"absolute",bottom:"2px",left:"2px"}}>{h}</span>
                              </div>
                            ))}
                            {tableRes.map(r=>{
                              const startMins=timeToMinutes(r.time)-12*60;
                              const totalMins=10*60;
                              const left=Math.max(0,(startMins/totalMins)*100);
                              const width=Math.min((stayDuration/totalMins)*100,100-left);
                              return (
                                <div key={r.id} title={`${r.guest_name} · ${r.time.slice(0,5)}`} style={{
                                  position:"absolute",left:`${left}%`,width:`${width}%`,top:"4px",bottom:"4px",
                                  background:"#FF5C35",borderRadius:"4px",opacity:.85,
                                  display:"flex",alignItems:"center",padding:"0 5px",overflow:"hidden",
                                }}>
                                  <span style={{fontSize:"9px",fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                                    {r.guest_name} ({r.party_size})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WALK-IN MODAL */}
      {showWalkin && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:"24px"}}
          onClick={e=>{if(e.target===e.currentTarget){setShowWalkin(false);setSuggestedTable(undefined);}}}>
          <div style={{background:"#fff",borderRadius:"16px",padding:"28px",width:"100%",maxWidth:"440px",boxShadow:"0 40px 80px rgba(0,0,0,.3)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"#1A1A2E"}}>Walk-in</h3>
              <button onClick={()=>{setShowWalkin(false);setSuggestedTable(undefined);}} style={{background:"transparent",border:"none",color:"#6B6B80",cursor:"pointer",fontSize:"18px"}}>✕</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"16px"}}>
              <div>
                <label style={{fontSize:"11px",fontWeight:600,color:"#6B6B80",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Name des Gastes</label>
                <input value={walkinName} onChange={e=>setWalkinName(e.target.value)} placeholder="Max Mustermann"
                  style={{width:"100%",padding:"9px 12px",borderRadius:"8px",border:"1px solid #EDE8E3",background:"#fff",color:"#1A1A2E",fontSize:"14px",fontFamily:"inherit",outline:"none"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                <div>
                  <label style={{fontSize:"11px",fontWeight:600,color:"#6B6B80",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Personen</label>
                  <select value={walkinParty} onChange={e=>setWalkinParty(e.target.value)}
                    style={{width:"100%",padding:"9px 12px",borderRadius:"8px",border:"1px solid #EDE8E3",background:"#fff",color:"#1A1A2E",fontSize:"14px",fontFamily:"inherit",outline:"none"}}>
                    {[1,2,3,4,5,6,7,8,10,12,15,20].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:"11px",fontWeight:600,color:"#6B6B80",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Datum</label>
                  <input type="date" value={walkinDate} onChange={e=>setWalkinDate(e.target.value)}
                    style={{width:"100%",padding:"9px 8px",borderRadius:"8px",border:"1px solid #EDE8E3",background:"#fff",color:"#1A1A2E",fontSize:"12px",fontFamily:"inherit",outline:"none"}}/>
                </div>
                <div>
                  <label style={{fontSize:"11px",fontWeight:600,color:"#6B6B80",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"5px"}}>Uhrzeit</label>
                  <input type="time" value={walkinTime} onChange={e=>setWalkinTime(e.target.value)}
                    style={{width:"100%",padding:"9px 8px",borderRadius:"8px",border:"1px solid #EDE8E3",background:"#fff",color:"#1A1A2E",fontSize:"12px",fontFamily:"inherit",outline:"none"}}/>
                </div>
              </div>
              <button onClick={suggestTable} style={{
                padding:"10px",borderRadius:"8px",background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.2)",
                color:"#FF5C35",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
              }}>KI: Tisch vorschlagen →</button>
              {suggestedTable !== undefined && (
                <div style={{background:suggestedTable?"rgba(52,211,153,.08)":"rgba(239,68,68,.08)",border:`1px solid ${suggestedTable?"rgba(52,211,153,.2)":"rgba(239,68,68,.2)"}`,borderRadius:"10px",padding:"12px 14px"}}>
                  {suggestedTable ? (
                    <>
                      <div style={{fontSize:"12px",fontWeight:600,color:"#34D399",marginBottom:"4px"}}>✓ Tisch verfügbar</div>
                      <div style={{fontSize:"14px",color:"#1A1A2E",fontWeight:500}}>{suggestedTable.name} — {suggestedTable.capacity} Personen</div>
                      <div style={{fontSize:"11px",color:"#6B6B80",marginTop:"2px"}}>{walkinTime} – {minutesToTime(timeToMinutes(walkinTime)+stayDuration)} Uhr</div>
                    </>
                  ) : (
                    <>
                      <div style={{fontSize:"12px",fontWeight:600,color:"#F87171",marginBottom:"4px"}}>✗ Kein freier Tisch</div>
                      <div style={{fontSize:"13px",color:"#6B6B80"}}>Kein passender Tisch für {walkinParty} Personen.</div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{setShowWalkin(false);setSuggestedTable(undefined);}} style={{flex:1,padding:"10px",borderRadius:"8px",background:"transparent",border:"1px solid #EDE8E3",color:"#6B6B80",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Abbrechen</button>
              {suggestedTable && (
                <button onClick={()=>saveWalkin(suggestedTable.id)} disabled={!walkinName||savingWalkin} style={{flex:2,padding:"10px",borderRadius:"8px",background:"#FF5C35",border:"none",color:"#fff",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:!walkinName||savingWalkin?0.6:1}}>
                  {savingWalkin?"Wird gespeichert...":"✓ Bestätigen & eintragen"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{maxWidth:"700px",margin:"0 auto",padding:"0 24px 100px",textAlign:"center"}}>
        <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:"20px",padding:"40px 32px",marginBottom:"16px"}}>
          <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"#FF5C35",marginBottom:"12px"}}>Bereit loszulegen?</div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,4vw,30px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-.5px",marginBottom:"12px"}}>Das willst du für dein Restaurant.</h3>
          <p style={{fontSize:"15px",color:"rgba(255,255,255,.4)",fontWeight:300,marginBottom:"24px",lineHeight:1.7}}>30 Tage kostenlos testen. Nur 20 Plätze verfügbar.</p>
          <a href="/#waitlist" style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#FF5C35",color:"#fff",padding:"13px 28px",borderRadius:"10px",fontSize:"15px",fontWeight:500,textDecoration:"none"}}>
            Jetzt Platz sichern — 30 Tage kostenlos →
          </a>
        </div>
      </div>
    </div>
  );
}