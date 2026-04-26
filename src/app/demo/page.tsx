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
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const stayDuration = 150;

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: rest } = await supabase.from("restaurants").select("*").eq("slug", DEMO_SLUG).single();
    if (!rest) return;
    setRestaurantId(rest.id);
    setRestaurantName(rest.name);
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
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [restaurantId]);

  const today = new Date().toISOString().split("T")[0];
  const todayRes = reservations.filter(r => r.date === today);
  const filteredRes = reservations.filter(r => r.date === filterDate);

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
        select{appearance:none;}
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

        {/* iPhone 17 Pro Mockup */}
        <div style={{position:"relative",width:"393px",flexShrink:0}}>
          {/* Outer shell */}
          <div style={{
            background:"linear-gradient(145deg,#3A3A3C 0%,#1C1C1E 50%,#2C2C2E 100%)",
            borderRadius:"52px",
            padding:"14px",
            boxShadow:`
              0 0 0 1px rgba(255,255,255,.1),
              0 0 0 3px #1C1C1E,
              0 0 0 4px rgba(255,255,255,.06),
              0 60px 120px rgba(0,0,0,.8),
              inset 0 1px 0 rgba(255,255,255,.12),
              inset 0 -1px 0 rgba(0,0,0,.5)
            `,
            position:"relative",
          }}>
            {/* Dynamic Island */}
            <div style={{
              position:"absolute",top:"14px",left:"50%",transform:"translateX(-50%)",
              width:"120px",height:"34px",
              background:"#000",borderRadius:"20px",zIndex:10,
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"0 12px",
            }}>
              <div style={{width:"12px",height:"12px",borderRadius:"50%",background:"#1A1A1A",border:"1px solid rgba(255,255,255,.06)"}}/>
              <div style={{width:"48px",height:"8px",borderRadius:"5px",background:"#1A1A1A"}}/>
            </div>
            {/* Screen */}
            <div style={{borderRadius:"40px",overflow:"hidden",height:"620px",background:"#FFFAF5",position:"relative"}}>
              <iframe
                src={`/book/${DEMO_SLUG}`}
                style={{width:"393px",height:"852px",border:"none",transform:"scale(0.728)",transformOrigin:"top left"}}
                title="Tablely Booking"
              />
            </div>
          </div>
          {/* Buttons */}
          <div style={{position:"absolute",right:"-4px",top:"150px",width:"4px",height:"72px",background:"#2C2C2E",borderRadius:"0 3px 3px 0"}}/>
          <div style={{position:"absolute",left:"-4px",top:"130px",width:"4px",height:"46px",background:"#2C2C2E",borderRadius:"3px 0 0 3px"}}/>
          <div style={{position:"absolute",left:"-4px",top:"186px",width:"4px",height:"46px",background:"#2C2C2E",borderRadius:"3px 0 0 3px"}}/>
          <div style={{position:"absolute",left:"-4px",top:"242px",width:"4px",height:"30px",background:"#2C2C2E",borderRadius:"3px 0 0 3px"}}/>
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
            <div style={{fontSize:"12px",color:"rgba(255,255,255,.35)",fontWeight:300}}>Neue Buchungen erscheinen automatisch — in Echtzeit</div>
          </div>
        </div>

        {/* iPad Pro Mockup */}
        <div style={{width:"min(900px,95vw)",position:"relative"}}>
          {/* iPad frame */}
          <div style={{
            background:"linear-gradient(145deg,#3A3A3C 0%,#1C1C1E 50%,#2C2C2E 100%)",
            borderRadius:"28px",
            padding:"20px",
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
            {/* Home button bottom */}
            <div style={{position:"absolute",bottom:"7px",left:"50%",transform:"translateX(-50%)",width:"40px",height:"5px",background:"rgba(255,255,255,.08)",borderRadius:"3px"}}/>

            {/* Screen */}
            <div style={{borderRadius:"14px",overflow:"hidden",background:"#F5F0EB"}}>

              {/* Dashboard inside iPad */}
              <div style={{display:"flex",height:"580px"}}>

                {/* Mini Sidebar */}
                <div style={{width:"180px",background:"#1A1A2E",display:"flex",flexDirection:"column",padding:"16px 10px",flexShrink:0}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"16px",fontWeight:700,color:"#FFFAF5",marginBottom:"24px",paddingLeft:"6px"}}>
                    table<span style={{color:"#FF5C35"}}>ly</span>
                  </div>
                  {[{l:"Dashboard",a:true},{l:"Neue Reservierung",a:false},{l:"Einstellungen",a:false}].map((item,i)=>(
                    <div key={i} style={{
                      padding:"8px 10px",borderRadius:"8px",fontSize:"11px",fontWeight:500,marginBottom:"2px",
                      background:item.a?"rgba(255,92,53,.15)":"transparent",
                      color:item.a?"#FF5C35":"rgba(255,255,255,.4)",
                      border:item.a?"1px solid rgba(255,92,53,.2)":"1px solid transparent",
                    }}>{item.l}</div>
                  ))}
                  <div style={{marginTop:"auto"}}>
                    <div style={{background:"rgba(255,255,255,.05)",borderRadius:"8px",padding:"10px"}}>
                      <div style={{fontSize:"9px",color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"2px"}}>Restaurant</div>
                      <div style={{fontSize:"11px",color:"#FFFAF5",fontWeight:500}}>{restaurantName}</div>
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

                  {/* Header */}
                  <div style={{background:"rgba(245,240,235,.95)",borderBottom:"1px solid #EDE8E3",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                    <div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"15px",fontWeight:700,color:"#1A1A2E"}}>
                        {new Date().getHours()<12?"Guten Morgen":new Date().getHours()<18?"Guten Tag":"Guten Abend"}
                      </div>
                      <div style={{fontSize:"10px",color:"#6B6B80"}}>{new Date().toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long"})}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"10px",color:"#34D399",background:"rgba(52,211,153,.1)",padding:"3px 8px",borderRadius:"10px",border:"1px solid rgba(52,211,153,.2)"}}>
                      <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#34D399",animation:"pulse 2s infinite"}}/>
                      Echtzeit
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px",padding:"12px 14px",background:"#F5F0EB",flexShrink:0}}>
                    {[
                      {l:"Heute",v:stats.heute,c:"#FF5C35"},
                      {l:"WhatsApp",v:stats.whatsapp,c:"#25D366"},
                      {l:"Online",v:stats.online,c:"#818CF8"},
                      {l:"Walk-in",v:stats.walkin,c:"#FCD34D"},
                      {l:"Ausstehend",v:stats.pending,c:"#FCD34D"},
                    ].map((s,i)=>(
                      <div key={i} style={{background:"#fff",border:"1px solid #EDE8E3",borderRadius:"10px",padding:"10px 8px",textAlign:"center"}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:s.c,letterSpacing:"-1px",lineHeight:1,marginBottom:"3px"}}>{s.v}</div>
                        <div style={{fontSize:"9px",color:"#6B6B80"}}>{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Date filter */}
                  <div style={{padding:"8px 14px",background:"#F5F0EB",borderBottom:"1px solid #EDE8E3",display:"flex",alignItems:"center",gap:"8px",flexShrink:0}}>
                    <span style={{fontSize:"11px",color:"#6B6B80",fontWeight:500}}>Datum:</span>
                    <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}
                      style={{padding:"4px 8px",borderRadius:"6px",border:"1px solid #EDE8E3",background:"#fff",color:"#1A1A2E",fontSize:"11px",fontFamily:"inherit",outline:"none"}}
                    />
                  </div>

                  {/* Table header */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 60px 80px 60px 90px 100px",gap:"8px",padding:"8px 14px",background:"#FAFAF8",borderBottom:"1px solid #EDE8E3",flexShrink:0}}>
                    {["Gast","Pers.","Datum","Zeit","Kanal","Status"].map((h,i)=>(
                      <div key={i} style={{fontSize:"9px",fontWeight:600,color:"#6B6B80",textTransform:"uppercase",letterSpacing:".6px"}}>{h}</div>
                    ))}
                  </div>

                  {/* Reservations */}
                  <div style={{flex:1,overflowY:"auto"}}>
                    {filteredRes.length === 0 ? (
                      <div style={{padding:"40px 20px",textAlign:"center",color:"#6B6B80",fontSize:"13px",fontWeight:300,lineHeight:1.6}}>
                        Noch keine Reservierungen für diesen Tag.<br/>
                        <span style={{fontSize:"11px"}}>Mach eine Buchung oben auf dem iPhone!</span>
                      </div>
                    ) : filteredRes.map((r,i)=>(
                      <div key={r.id} style={{
                        display:"grid",gridTemplateColumns:"1fr 60px 80px 60px 90px 100px",gap:"8px",
                        padding:"10px 14px",borderBottom:i<filteredRes.length-1?"1px solid #F5F0EB":"none",
                        alignItems:"center",background:"#fff",animation:"slideIn .4s ease",
                      }}>
                        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
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
                        <div style={{...(STATUS_COLORS[r.status]||{bg:"rgba(0,0,0,.05)",color:"#6B6B80",border:"transparent"}),fontSize:"9px",fontWeight:600,padding:"2px 6px",borderRadius:"5px",width:"fit-content",border:"1px solid transparent"}}>
                          {r.status==="confirmed"?"✓ Bestätigt":r.status==="pending"?"◐ Ausstehend":r.status==="cancelled"?"✕ Storniert":"● Done"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{maxWidth:"700px",margin:"0 auto",padding:"0 24px 100px",textAlign:"center"}}>
        <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:"20px",padding:"40px 32px",marginBottom:"16px"}}>
          <p style={{fontSize:"15px",color:"rgba(255,255,255,.4)",lineHeight:1.7,fontWeight:300,marginBottom:"20px"}}>
            Willst du sehen wie es per <strong style={{color:"#25D366"}}>WhatsApp</strong> läuft? Schreib einfach an:
          </p>
          <a href={WA_LINK} target="_blank" className="wa-btn" style={{
            display:"inline-flex",alignItems:"center",gap:"8px",
            background:"#25D366",color:"#fff",padding:"12px 24px",
            borderRadius:"10px",fontSize:"14px",fontWeight:500,textDecoration:"none",transition:"all .2s",marginBottom:"8px",
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 1.5C5.3 1.5 1.5 5.3 1.5 10c0 1.5.4 2.9 1.1 4.2L1.5 18.5l4.4-1.1C7.1 18.1 8.5 18.5 10 18.5c4.7 0 8.5-3.8 8.5-8.5S14.7 1.5 10 1.5zm4.2 12c-.2.5-1 1-1.4 1-.4 0-.8.1-2.5-.5s-2.8-2-3.2-2.6c-.4-.6-1-1.6-1-2.6s.5-1.4.7-1.6c.2-.2.4-.3.6-.3h.4c.2 0 .3.1.5.5l.8 2c.1.2.1.4 0 .6l-.3.4c-.1.2-.2.3-.1.5.5.8 1.1 1.4 1.9 1.9.2.1.4.1.5-.1l.5-.6c.2-.2.3-.2.5-.1l2 1c.2.1.3.2.3.4-.1.3-.2.8-.4 1z" fill="white"/></svg>
            {WA_NUMBER} — WhatsApp öffnen
          </a>
        </div>
        <a href="/#waitlist" style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#FF5C35",color:"#fff",padding:"13px 28px",borderRadius:"10px",fontSize:"15px",fontWeight:500,textDecoration:"none"}}>
          Jetzt Platz sichern — 40 Tage kostenlos →
        </a>
      </div>
    </div>
  );
}