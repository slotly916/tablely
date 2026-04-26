"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

const DEMO_SLUG = "alpengasthof-";
const WA_NUMBER = "+436705540779";
const WA_LINK = "https://wa.me/436705540779?text=Hallo!%20Ich%20m%C3%B6chte%20einen%20Tisch%20reservieren.";

type Reservation = {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  party_size: number;
  date: string;
  time: string;
  status: string;
  channel: string;
  notes: string | null;
  table_id?: string | null;
};

type Table = { id: string; name: string; capacity: number; };

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number) {
  return `${Math.floor(m/60).toString().padStart(2,"0")}:${(m%60).toString().padStart(2,"0")}`;
}

const STATUS_COLORS: Record<string, {bg:string;color:string}> = {
  confirmed: { bg:"rgba(52,211,153,.12)", color:"#34D399" },
  pending:   { bg:"rgba(251,191,36,.12)", color:"#FCD34D" },
  cancelled: { bg:"rgba(239,68,68,.12)",  color:"#F87171" },
  completed: { bg:"rgba(99,102,241,.12)", color:"#818CF8" },
};

const CHANNEL_LABELS: Record<string,string> = {
  online:"Online", whatsapp:"WhatsApp", phone:"Telefon", walkin:"Walk-in"
};

const CHANNEL_COLORS: Record<string,{bg:string;color:string}> = {
  online:   { bg:"rgba(99,102,241,.15)",  color:"#818CF8" },
  whatsapp: { bg:"rgba(37,211,102,.15)",  color:"#25D366" },
  phone:    { bg:"rgba(255,92,53,.15)",   color:"#FF5C35" },
  walkin:   { bg:"rgba(251,191,36,.15)",  color:"#FCD34D" },
};

export default function DemoPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list"|"tables">("list");
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

    const { data: tbls } = await supabase.from("tables").select("*").eq("restaurant_id", rest.id).order("name");
    setTables(tbls || []);

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime
  useEffect(() => {
    if (!restaurantId) return;
    const supabase = createClient();
    const channel = supabase.channel("demo-dashboard")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"reservations" }, (payload) => {
        const r = payload.new as Reservation & { restaurant_id: string };
        if (r.restaurant_id !== restaurantId) return;
        setReservations(prev => [...prev, r]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  const today = new Date().toISOString().split("T")[0];
  const todayRes = reservations.filter(r => r.date === today);
  const filteredRes = reservations.filter(r => r.date === filterDate);

  const stats = {
    today: todayRes.length,
    whatsapp: todayRes.filter(r => r.channel==="whatsapp").length,
    online: todayRes.filter(r => r.channel==="online").length,
    walkin: todayRes.filter(r => r.channel==="walkin").length,
    pending: reservations.filter(r => r.status==="pending").length,
  };

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F5F0EB",fontFamily:"'DM Sans',sans-serif",flexDirection:"column",gap:"12px"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:"24px",height:"24px",borderRadius:"50%",border:"2px solid #F0EBE3",borderTopColor:"#FF5C35",animation:"spin 0.7s linear infinite"}}/>
      <div style={{color:"#6B6B80",fontSize:"13px"}}>Demo wird geladen...</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F5F0EB",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        select{appearance:none;-webkit-appearance:none;}
        .res-row:hover{background:#FAFAF8!important;}
        .wa-btn:hover{background:#20BA5A!important;transform:translateY(-1px);box-shadow:0 8px 24px rgba(37,211,102,.3)!important;}
      `}</style>

      {/* NAV */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",background:"rgba(255,250,245,.97)",backdropFilter:"blur(16px)",borderBottom:"1px solid #F0EBE3",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <a href="/" style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:700,color:"#1A1A2E",textDecoration:"none"}}>
            table<span style={{color:"#FF5C35"}}>ly</span>
          </a>
          <span style={{fontSize:"12px",color:"#6B6B80",background:"#F0EBE3",padding:"2px 10px",borderRadius:"20px"}}>Live Demo</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"12px",color:"#34D399",background:"rgba(52,211,153,.1)",padding:"4px 10px",borderRadius:"20px",border:"1px solid rgba(52,211,153,.2)"}}>
            <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#34D399",animation:"pulse 2s infinite"}}/>
            Echtzeit
          </div>
          <a href="/" style={{fontSize:"13px",color:"#6B6B80",textDecoration:"none"}}>← Zurück</a>
        </div>
      </nav>

      {/* HERO BANNER */}
      <div style={{background:"#1A1A2E",padding:"40px 24px",textAlign:"center"}}>
        <div style={{maxWidth:"700px",margin:"0 auto"}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,4vw,36px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1px",marginBottom:"12px"}}>
            Probier Tablely live aus.
          </h1>
          <p style={{fontSize:"15px",color:"rgba(255,255,255,.5)",fontWeight:300,lineHeight:1.7,marginBottom:"24px"}}>
            Schreib uns per WhatsApp und reserviere einen Tisch — sieh wie die KI antwortet und die Buchung sofort unten im Dashboard erscheint.
          </p>
          <div style={{display:"flex",flexWrap:"wrap",gap:"12px",justifyContent:"center",alignItems:"center"}}>
            <a href={WA_LINK} target="_blank" className="wa-btn" style={{
              display:"inline-flex",alignItems:"center",gap:"10px",
              background:"#25D366",color:"#fff",padding:"12px 24px",
              borderRadius:"10px",fontSize:"15px",fontWeight:500,textDecoration:"none",transition:"all .2s",
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 1.5C5.3 1.5 1.5 5.3 1.5 10c0 1.5.4 2.9 1.1 4.2L1.5 18.5l4.4-1.1C7.1 18.1 8.5 18.5 10 18.5c4.7 0 8.5-3.8 8.5-8.5S14.7 1.5 10 1.5zm4.2 12c-.2.5-1 1-1.4 1-.4 0-.8.1-2.5-.5s-2.8-2-3.2-2.6c-.4-.6-1-1.6-1-2.6s.5-1.4.7-1.6c.2-.2.4-.3.6-.3h.4c.2 0 .3.1.5.5l.8 2c.1.2.1.4 0 .6l-.3.4c-.1.2-.2.3-.1.5.5.8 1.1 1.4 1.9 1.9.2.1.4.1.5-.1l.5-.6c.2-.2.3-.2.5-.1l2 1c.2.1.3.2.3.4-.1.3-.2.8-.4 1z" fill="white"/></svg>
              Per WhatsApp reservieren
            </a>
            <div style={{fontSize:"14px",color:"rgba(255,255,255,.4)"}}>
              oder schreib direkt an <strong style={{color:"#25D366"}}>{WA_NUMBER}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD CLONE */}
      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"24px"}}>

        {/* SIDEBAR + MAIN LAYOUT */}
        <div style={{display:"flex",gap:"20px"}}>

          {/* SIDEBAR */}
          <div style={{width:"200px",flexShrink:0}}>
            <div style={{background:"#1A1A2E",borderRadius:"14px",padding:"16px 12px",display:"flex",flexDirection:"column",gap:"4px",marginBottom:"12px"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"16px",fontWeight:700,color:"#FFFAF5",padding:"4px 8px",marginBottom:"8px"}}>
                table<span style={{color:"#FF5C35"}}>ly</span>
              </div>
              {[
                {l:"Dashboard",active:true},
                {l:"Neue Reservierung",active:false},
                {l:"Einstellungen",active:false},
              ].map((item,i)=>(
                <div key={i} style={{
                  padding:"8px 10px",borderRadius:"8px",fontSize:"12px",fontWeight:500,
                  background:item.active?"rgba(255,92,53,.15)":"transparent",
                  color:item.active?"#FF5C35":"rgba(255,255,255,.4)",
                  border:item.active?"1px solid rgba(255,92,53,.2)":"1px solid transparent",
                }}>{item.l}</div>
              ))}
              <div style={{marginTop:"auto",paddingTop:"12px"}}>
                <div style={{background:"rgba(255,255,255,.05)",borderRadius:"8px",padding:"10px",marginTop:"8px"}}>
                  <div style={{fontSize:"9px",color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"2px"}}>Restaurant</div>
                  <div style={{fontSize:"12px",color:"#FFFAF5",fontWeight:500}}>{restaurantName}</div>
                </div>
              </div>
            </div>

            {/* Hinweis */}
            <div style={{background:"rgba(255,92,53,.08)",border:"1px solid rgba(255,92,53,.15)",borderRadius:"10px",padding:"12px",fontSize:"11px",color:"#FF5C35",lineHeight:1.5}}>
              💡 Dies ist eine Live-Demo. Buchungen werden nach 3 Tagen automatisch zurückgesetzt.
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div style={{flex:1,minWidth:0}}>

            {/* HEADER */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"10px"}}>
              <div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-.5px",marginBottom:"3px"}}>
                  {new Date().getHours()<12?"Guten Morgen":new Date().getHours()<18?"Guten Tag":"Guten Abend"}, {restaurantName}
                </h2>
                <p style={{fontSize:"12px",color:"#6B6B80",fontWeight:300}}>
                  {new Date().toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                </p>
              </div>
              <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}
                style={{padding:"7px 12px",borderRadius:"8px",border:"1px solid #F0EBE3",background:"#fff",color:"#1A1A2E",fontSize:"13px",fontFamily:"inherit",outline:"none"}}
              />
            </div>

            {/* STATS */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"10px",marginBottom:"20px"}}>
              {[
                {l:"Heute",v:stats.today,c:"#FF5C35"},
                {l:"WhatsApp",v:stats.whatsapp,c:"#25D366"},
                {l:"Online",v:stats.online,c:"#818CF8"},
                {l:"Walk-in",v:stats.walkin,c:"#FCD34D"},
                {l:"Ausstehend",v:stats.pending,c:"#FCD34D"},
              ].map((s,i)=>(
                <div key={i} style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:"12px",padding:"14px 12px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:s.c,letterSpacing:"-1px",marginBottom:"3px"}}>{s.v}</div>
                  <div style={{fontSize:"10px",color:"#6B6B80"}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* VIEW TOGGLE */}
            <div style={{display:"flex",gap:"4px",background:"#fff",border:"1px solid #F0EBE3",borderRadius:"9px",padding:"3px",marginBottom:"16px",width:"fit-content"}}>
              {[{k:"list",l:"Liste"},{k:"tables",l:"Tischkarte"}].map(v=>(
                <button key={v.k} onClick={()=>setView(v.k as "list"|"tables")} style={{
                  padding:"6px 16px",borderRadius:"7px",fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:"none",transition:"all .15s",
                  background:view===v.k?"#1A1A2E":"transparent",
                  color:view===v.k?"#fff":"#6B6B80",
                }}>{v.l}</button>
              ))}
            </div>

            {/* LIST VIEW */}
            {view === "list" && (
              <div style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:"14px",overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 80px 100px 80px 110px 130px",gap:"12px",padding:"10px 16px",borderBottom:"1px solid #F0EBE3",background:"#FAFAF8"}}>
                  {["Gast","Personen","Datum","Uhrzeit","Kanal","Status"].map((h,i)=>(
                    <div key={i} style={{fontSize:"10px",fontWeight:600,color:"#6B6B80",textTransform:"uppercase",letterSpacing:".7px"}}>{h}</div>
                  ))}
                </div>
                {filteredRes.length === 0 ? (
                  <div style={{padding:"48px",textAlign:"center",color:"#6B6B80",fontSize:"14px",fontWeight:300}}>
                    Noch keine Reservierungen für diesen Tag.<br/>
                    <span style={{fontSize:"12px"}}>Schreib uns per WhatsApp und teste es!</span>
                  </div>
                ) : filteredRes.map((r,i)=>(
                  <div key={r.id} className="res-row" style={{
                    display:"grid",gridTemplateColumns:"1fr 80px 100px 80px 110px 130px",gap:"12px",
                    padding:"12px 16px",borderBottom:i<filteredRes.length-1?"1px solid #F5F0EB":"none",
                    alignItems:"center",background:"#fff",transition:"background .12s",animation:"slideIn .3s ease",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"rgba(255,92,53,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:600,color:"#FF5C35",flexShrink:0}}>
                        {r.guest_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontSize:"13px",fontWeight:500,color:"#1A1A2E"}}>{r.guest_name}</div>
                        {r.notes && <div style={{fontSize:"10px",color:"#6B6B80",fontStyle:"italic"}}>„{r.notes}"</div>}
                      </div>
                    </div>
                    <div style={{fontSize:"13px",color:"#6B6B80"}}>{r.party_size} Pers.</div>
                    <div style={{fontSize:"12px",color:"#6B6B80"}}>{new Date(r.date).toLocaleDateString("de-AT",{day:"numeric",month:"short"})}</div>
                    <div style={{fontSize:"13px",fontWeight:500,color:"#1A1A2E"}}>{r.time.slice(0,5)}</div>
                    <div style={{...CHANNEL_COLORS[r.channel]||{bg:"rgba(0,0,0,.05)",color:"#6B6B80"},fontSize:"10px",fontWeight:600,padding:"3px 8px",borderRadius:"5px",width:"fit-content"}}>
                      {CHANNEL_LABELS[r.channel]||r.channel}
                    </div>
                    <div style={{...STATUS_COLORS[r.status]||{bg:"rgba(0,0,0,.05)",color:"#6B6B80"},fontSize:"10px",fontWeight:600,padding:"3px 8px",borderRadius:"5px",width:"fit-content"}}>
                      {r.status==="confirmed"?"✓ Bestätigt":r.status==="pending"?"◐ Ausstehend":r.status==="cancelled"?"✕ Storniert":"● Abgeschlossen"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TABLE VIEW */}
            {view === "tables" && (
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {tables.length === 0 ? (
                  <div style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:"14px",padding:"48px",textAlign:"center",color:"#6B6B80",fontSize:"14px"}}>
                    Noch keine Tische konfiguriert.
                  </div>
                ) : tables.map(table => {
                  const tableRes = filteredRes.filter(r => r.table_id === table.id);
                  return (
                    <div key={table.id} style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:"12px",padding:"14px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                        <div style={{fontSize:"13px",fontWeight:600,color:"#1A1A2E"}}>{table.name}</div>
                        <div style={{fontSize:"11px",color:"#6B6B80",background:"#F5F0EB",padding:"2px 8px",borderRadius:"5px"}}>{table.capacity} Pers.</div>
                        {tableRes.length===0 && <div style={{fontSize:"11px",color:"#34D399",background:"rgba(52,211,153,.1)",padding:"2px 8px",borderRadius:"5px",border:"1px solid rgba(52,211,153,.2)"}}>Frei</div>}
                      </div>
                      <div style={{position:"relative",height:"36px",background:"rgba(0,0,0,.04)",borderRadius:"8px",overflow:"hidden"}}>
                        {["12","14","16","18","20","22"].map((h,i)=>(
                          <div key={i} style={{position:"absolute",left:`${(i/5)*100}%`,top:0,bottom:0,borderLeft:"1px solid rgba(0,0,0,.06)",display:"flex",alignItems:"flex-end",paddingBottom:"2px"}}>
                            <span style={{fontSize:"8px",color:"#6B6B80",paddingLeft:"2px"}}>{h}:00</span>
                          </div>
                        ))}
                        {tableRes.map(r=>{
                          const startMins = timeToMinutes(r.time)-12*60;
                          const totalMins = 10*60;
                          const left = Math.max(0,(startMins/totalMins)*100);
                          const width = Math.min((stayDuration/totalMins)*100,100-left);
                          return (
                            <div key={r.id} title={`${r.guest_name} · ${r.time.slice(0,5)}`} style={{
                              position:"absolute",left:`${left}%`,width:`${width}%`,top:"4px",bottom:"4px",
                              background:"#FF5C35",borderRadius:"5px",opacity:.8,
                              display:"flex",alignItems:"center",padding:"0 6px",overflow:"hidden",
                            }}>
                              <span style={{fontSize:"10px",fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                                {r.guest_name} ({r.party_size})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {tableRes.length>0 && (
                        <div style={{marginTop:"6px",display:"flex",gap:"8px",flexWrap:"wrap"}}>
                          {tableRes.map(r=>(
                            <div key={r.id} style={{fontSize:"10px",color:"#6B6B80"}}>
                              {r.time.slice(0,5)} – {minutesToTime(timeToMinutes(r.time)+stayDuration)} · {r.guest_name}
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
        </div>

        {/* CTA UNTEN */}
        <div style={{marginTop:"40px",background:"#1A1A2E",borderRadius:"20px",padding:"40px 32px",textAlign:"center"}}>
          <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"#FF5C35",marginBottom:"12px"}}>Bereit loszulegen?</div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,4vw,30px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-0.5px",marginBottom:"12px"}}>
            Das willst du für dein Restaurant.
          </h3>
          <p style={{fontSize:"15px",color:"rgba(255,255,255,.4)",fontWeight:300,marginBottom:"28px",maxWidth:"440px",margin:"0 auto 28px",lineHeight:1.7}}>
            40 Tage kostenlos testen. Nur 20 Plätze verfügbar.
          </p>
          <a href="/#waitlist" style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#FF5C35",color:"#fff",padding:"13px 28px",borderRadius:"10px",fontSize:"15px",fontWeight:500,textDecoration:"none"}}>
            Jetzt Platz sichern →
          </a>
        </div>
      </div>
    </div>
  );
}