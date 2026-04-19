"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

const DEMO_SLUG = "alpengasthof-";

type Reservation = {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  party_size: number;
  date: string;
  time: string;
  status: string;
  channel: string;
  created_at: string;
};

export default function DemoPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<string | null>(null);

  const loadReservations = useCallback(async () => {
    const supabase = createClient();
    const { data: rest } = await supabase
      .from("restaurants").select("id").eq("slug", DEMO_SLUG).single();
    if (!rest) return;
    setRestaurantId(rest.id);
    const { data } = await supabase
      .from("reservations").select("*").eq("restaurant_id", rest.id)
      .order("created_at", { ascending: false }).limit(15);
    setReservations(data || []);
  }, []);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  useEffect(() => {
    if (!restaurantId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("demo-live")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "reservations",
        filter: `restaurant_id=eq.${restaurantId}`,
      }, (payload) => {
        const newRes = payload.new as Reservation;
        setReservations(prev => [newRes, ...prev.slice(0, 14)]);
        setNewEntry(newRes.id);
        setTimeout(() => setNewEntry(null), 4000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  return (
    <div style={{
      minHeight:"100vh",
      background:"#0A0A0F",
      fontFamily:"'DM Sans',sans-serif",
      overflowX:"hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-16px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(255,92,53,0)}40%{box-shadow:0 0 32px 6px rgba(255,92,53,.25)}}
        @keyframes arrowBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}
        .new-entry{animation:slideDown .5s cubic-bezier(.22,1,.36,1),glow 2s ease .1s;}
        .back-link:hover{color:#FF5C35!important;}
        iframe{display:block;}
      `}</style>

      {/* NAV */}
      <nav style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"14px 32px",borderBottom:"1px solid rgba(255,255,255,.05)",
        background:"rgba(10,10,15,.98)",backdropFilter:"blur(20px)",
        position:"sticky",top:0,zIndex:200,
      }}>
        <a href="/" className="back-link" style={{display:"flex",alignItems:"center",gap:"8px",color:"rgba(255,255,255,.35)",textDecoration:"none",fontSize:"13px",fontWeight:400,transition:"color .2s"}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Zurück
        </a>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"#FFFAF5",letterSpacing:"-.3px"}}>
          table<span style={{color:"#FF5C35"}}>ly</span>
          <span style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,.25)",marginLeft:"8px",letterSpacing:"0"}}>Demo</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"6px",background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.2)",borderRadius:"20px",padding:"4px 12px"}}>
          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",animation:"pulse 2s infinite",flexShrink:0}}/>
          <span style={{fontSize:"11px",color:"#FF5C35",fontWeight:500,letterSpacing:".3px"}}>LIVE</span>
        </div>
      </nav>

      {/* HERO TEXT */}
      <div style={{textAlign:"center",padding:"72px 24px 56px",background:"linear-gradient(to bottom,rgba(255,92,53,.04),transparent)"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.2)",borderRadius:"20px",padding:"5px 14px",marginBottom:"20px"}}>
          <span style={{fontSize:"11px",color:"#FF5C35",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px"}}>Interaktive Demo</span>
        </div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(36px,5vw,56px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-2px",lineHeight:1.05,marginBottom:"20px"}}>
          Buch unten — sieh es sofort.
        </h1>
        <p style={{fontSize:"17px",color:"rgba(255,255,255,.35)",fontWeight:300,maxWidth:"520px",margin:"0 auto",lineHeight:1.75}}>
          Mach eine echte Reservierung auf dem iPhone. Die Buchung erscheint automatisch im Dashboard auf dem MacBook — ohne Reload, in Echtzeit.
        </p>
      </div>

      {/* STEP 1 — iPhone */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"0 24px 80px"}}>
        
        {/* Label */}
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"32px"}}>
          <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#FF5C35",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,color:"#fff",flexShrink:0}}>1</div>
          <div>
            <div style={{fontSize:"16px",fontWeight:500,color:"#FFFAF5",marginBottom:"2px"}}>Gast bucht eine Reservierung</div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,.35)",fontWeight:300}}>Genau so wie deine echten Gäste es machen</div>
          </div>
        </div>

        {/* iPhone 15 Pro — 393 x 852px (1:1 scale) */}
        <div style={{
          position:"relative",
          width:"393px",
          height:"852px",
          flexShrink:0,
        }}>
          {/* Outer frame */}
          <div style={{
            position:"absolute",inset:0,
            background:"linear-gradient(135deg,#3A3A3A 0%,#1C1C1C 40%,#2A2A2A 100%)",
            borderRadius:"54px",
            boxShadow:`
              0 0 0 1px rgba(255,255,255,.08),
              0 0 0 10px #1A1A1A,
              0 0 0 11px rgba(255,255,255,.05),
              0 60px 120px rgba(0,0,0,.8),
              inset 0 1px 0 rgba(255,255,255,.12),
              inset 0 -1px 0 rgba(0,0,0,.5)
            `,
          }}/>

          {/* Screen cutout */}
          <div style={{
            position:"absolute",
            top:"10px",left:"10px",right:"10px",bottom:"10px",
            background:"#000",
            borderRadius:"46px",
            overflow:"hidden",
          }}>
            {/* Dynamic Island */}
            <div style={{
              position:"absolute",top:"12px",left:"50%",transform:"translateX(-50%)",
              width:"120px",height:"34px",
              background:"#000",
              borderRadius:"20px",
              zIndex:20,
              boxShadow:"0 0 0 1px rgba(255,255,255,.06)",
              display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
            }}>
              <div style={{width:"12px",height:"12px",borderRadius:"50%",background:"#1A1A1A",border:"1px solid rgba(255,255,255,.06)"}}/>
              <div style={{width:"52px",height:"8px",borderRadius:"6px",background:"#1A1A1A"}}/>
            </div>

            {/* iframe — full screen */}
            <iframe
              src={`/book/${DEMO_SLUG}`}
              style={{
                width:"393px",
                height:"852px",
                border:"none",
                borderRadius:"0",
              }}
              title="Tablely Booking"
            />
          </div>

          {/* Side buttons */}
          <div style={{position:"absolute",right:"-3px",top:"160px",width:"3px",height:"80px",background:"#2A2A2A",borderRadius:"0 2px 2px 0"}}/>
          <div style={{position:"absolute",left:"-3px",top:"140px",width:"3px",height:"50px",background:"#2A2A2A",borderRadius:"2px 0 0 2px"}}/>
          <div style={{position:"absolute",left:"-3px",top:"200px",width:"3px",height:"90px",background:"#2A2A2A",borderRadius:"2px 0 0 2px"}}/>
          <div style={{position:"absolute",left:"-3px",top:"300px",width:"3px",height:"50px",background:"#2A2A2A",borderRadius:"2px 0 0 2px"}}/>
        </div>
      </div>

      {/* ARROW */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",padding:"0 0 80px",color:"rgba(255,255,255,.2)"}}>
        <div style={{width:"1px",height:"60px",background:"linear-gradient(to bottom,rgba(255,92,53,.5),rgba(255,92,53,.1))"}}/>
        <div style={{animation:"arrowBounce 1.5s ease-in-out infinite"}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M5 13l7 7 7-7" stroke="#FF5C35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{width:"1px",height:"40px",background:"linear-gradient(to bottom,rgba(255,92,53,.1),transparent)"}}/>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,.3)",fontWeight:300,marginTop:"4px",letterSpacing:".3px"}}>
          Erscheint sofort im Dashboard
        </div>
      </div>

      {/* STEP 2 — MacBook */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"0 24px 120px"}}>

        {/* Label */}
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"40px"}}>
          <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#FF5C35",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,color:"#fff",flexShrink:0}}>2</div>
          <div>
            <div style={{fontSize:"16px",fontWeight:500,color:"#FFFAF5",marginBottom:"2px"}}>Restaurant verwaltet alles hier</div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,.35)",fontWeight:300}}>Neue Buchungen erscheinen automatisch — in Echtzeit</div>
          </div>
        </div>

        {/* MacBook Pro 16" — 3456 x 2234 px, display is 1512 x 982 */}
        {/* We show at 900px wide which is roughly 60% scale */}
        <div style={{width:"min(900px, 95vw)",position:"relative"}}>
          
          {/* Lid / Screen */}
          <div style={{
            background:"linear-gradient(to bottom,#E8E4E0 0%,#D8D4D0 100%)",
            borderRadius:"16px 16px 0 0",
            padding:"16px 16px 0",
            boxShadow:"0 0 0 1px rgba(0,0,0,.3),0 -4px 20px rgba(0,0,0,.2)",
            position:"relative",
          }}>
            {/* Camera */}
            <div style={{position:"absolute",top:"8px",left:"50%",transform:"translateX(-50%)",width:"6px",height:"6px",borderRadius:"50%",background:"#B0ACA8"}}/>
            
            {/* Screen bezel */}
            <div style={{
              background:"#0A0A0A",
              borderRadius:"8px 8px 0 0",
              padding:"0",
              overflow:"hidden",
              boxShadow:"inset 0 0 0 1px rgba(255,255,255,.04)",
            }}>
              {/* Browser chrome */}
              <div style={{
                background:"#1C1C28",
                padding:"8px 14px",
                display:"flex",alignItems:"center",gap:"10px",
                borderBottom:"1px solid rgba(255,255,255,.05)",
              }}>
                <div style={{display:"flex",gap:"5px"}}>
                  {[["#FF5F57","#D94F45"],["#FEBC2E","#D4A028"],["#28C840","#22A836"]].map(([c,s],i)=>(
                    <div key={i} style={{width:"10px",height:"10px",borderRadius:"50%",background:c,boxShadow:`0 0 0 .5px ${s}`}}/>
                  ))}
                </div>
                <div style={{flex:1,background:"rgba(255,255,255,.06)",borderRadius:"5px",padding:"4px 12px",fontSize:"10px",color:"rgba(255,255,255,.2)",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
                  <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#34D399"}}/>
                  tablely.at/dashboard — Live Demo
                </div>
                <div style={{width:"60px"}}/>
              </div>

              {/* Dashboard UI */}
              <div style={{background:"#0F0F14",height:"520px",overflowY:"auto",padding:"20px"}}>
                
                {/* Greeting */}
                <div style={{marginBottom:"20px"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#FFFAF5",letterSpacing:"-.5px",marginBottom:"4px"}}>
                    Guten Abend, Alpengasthof
                  </div>
                  <div style={{fontSize:"12px",color:"rgba(255,255,255,.25)"}}>
                    {new Date().toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                  </div>
                </div>

                {/* Stats */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px",marginBottom:"24px"}}>
                  {[
                    {l:"Heute",v:reservations.filter(r=>r.date===new Date().toISOString().split("T")[0]).length,c:"#FF5C35",bg:"rgba(255,92,53,.1)"},
                    {l:"Gesamt",v:reservations.length,c:"#818CF8",bg:"rgba(129,140,248,.1)"},
                    {l:"Online",v:reservations.filter(r=>r.channel==="online").length,c:"#34D399",bg:"rgba(52,211,153,.1)"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,.04)",borderRadius:"12px",padding:"14px 16px",border:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",gap:"12px"}}>
                      <div style={{width:"36px",height:"36px",borderRadius:"10px",background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:700,color:s.c}}>{s.v}</div>
                      </div>
                      <div style={{fontSize:"12px",color:"rgba(255,255,255,.35)"}}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Reservations header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
                  <div style={{fontSize:"11px",fontWeight:600,color:"rgba(255,255,255,.25)",textTransform:"uppercase",letterSpacing:".8px"}}>Reservierungen</div>
                  <div style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"10px",color:"#34D399",fontWeight:500}}>
                    <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34D399",animation:"pulse 2s infinite"}}/>
                    Echtzeit-Updates aktiv
                  </div>
                </div>

                {/* List */}
                {reservations.length === 0 ? (
                  <div style={{
                    textAlign:"center",padding:"60px 20px",
                    border:"1px dashed rgba(255,255,255,.08)",borderRadius:"12px",
                  }}>
                    <div style={{fontSize:"32px",marginBottom:"12px",opacity:.3}}>📅</div>
                    <div style={{fontSize:"14px",color:"rgba(255,255,255,.2)",fontWeight:300,lineHeight:1.6}}>
                      Noch keine Reservierungen.<br/>Mach eine Buchung oben auf dem iPhone!
                    </div>
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                    {reservations.map((r)=>(
                      <div key={r.id} className={r.id===newEntry?"new-entry":""} style={{
                        display:"flex",alignItems:"center",gap:"12px",
                        padding:"12px 14px",borderRadius:"10px",
                        background:r.id===newEntry?"rgba(255,92,53,.12)":"rgba(255,255,255,.04)",
                        border:r.id===newEntry?"1px solid rgba(255,92,53,.35)":"1px solid rgba(255,255,255,.06)",
                        transition:"background .3s,border .3s",
                      }}>
                        <div style={{
                          width:"36px",height:"36px",borderRadius:"50%",
                          background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.25)",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:"14px",fontWeight:700,color:"#FF5C35",flexShrink:0,
                        }}>
                          {r.guest_name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:"13px",fontWeight:500,color:"#FFFAF5",marginBottom:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {r.guest_name}
                            {r.id===newEntry&&<span style={{marginLeft:"8px",fontSize:"11px",color:"#FF5C35",fontWeight:600}}>✓ Neu</span>}
                          </div>
                          <div style={{fontSize:"11px",color:"rgba(255,255,255,.3)"}}>
                            {new Date(r.date).toLocaleDateString("de-AT",{weekday:"short",day:"numeric",month:"short"})} · {r.time.slice(0,5)} Uhr · {r.party_size} {r.party_size===1?"Person":"Personen"}
                          </div>
                        </div>
                        <div style={{
                          fontSize:"10px",fontWeight:600,padding:"3px 8px",borderRadius:"6px",flexShrink:0,
                          background:r.channel==="online"?"rgba(99,102,241,.15)":r.channel==="whatsapp"?"rgba(37,211,102,.15)":"rgba(255,92,53,.15)",
                          color:r.channel==="online"?"#818CF8":r.channel==="whatsapp"?"#25D366":"#FF5C35",
                          border:`1px solid ${r.channel==="online"?"rgba(99,102,241,.2)":r.channel==="whatsapp"?"rgba(37,211,102,.2)":"rgba(255,92,53,.2)"}`,
                        }}>
                          {r.channel==="online"?"Online":r.channel==="whatsapp"?"WhatsApp":"Telefon"}
                        </div>
                        <div style={{
                          fontSize:"10px",fontWeight:600,padding:"3px 8px",borderRadius:"6px",flexShrink:0,
                          background:"rgba(52,211,153,.1)",color:"#34D399",border:"1px solid rgba(52,211,153,.2)",
                        }}>
                          Bestätigt
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Base / Hinge */}
          <div style={{
            background:"linear-gradient(to bottom,#C8C4C0,#B0ACA8)",
            height:"18px",
            borderRadius:"0 0 6px 6px",
            boxShadow:"0 0 0 1px rgba(0,0,0,.3),0 4px 12px rgba(0,0,0,.3)",
            position:"relative",
          }}>
            {/* Notch */}
            <div style={{
              position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
              width:"180px",height:"10px",
              background:"#A8A4A0",
              borderRadius:"0 0 8px 8px",
            }}/>
          </div>

          {/* Foot */}
          <div style={{
            background:"linear-gradient(to bottom,#B0ACA8,transparent)",
            height:"8px",
            borderRadius:"0 0 8px 8px",
            margin:"0 40px",
          }}/>

          {/* Shadow */}
          <div style={{
            height:"20px",
            background:"radial-gradient(ellipse at center,rgba(0,0,0,.3) 0%,transparent 70%)",
            margin:"0 20px",
          }}/>
        </div>
      </div>

      {/* CTA unten */}
      <div style={{
        maxWidth:"700px",margin:"0 auto",padding:"0 24px 100px",
        display:"flex",flexDirection:"column",gap:"16px",
      }}>
        <div style={{
          background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",
          borderRadius:"16px",padding:"28px 32px",textAlign:"center",
        }}>
          <p style={{fontSize:"15px",color:"rgba(255,255,255,.45)",lineHeight:1.7,fontWeight:300,marginBottom:"20px"}}>
            Willst du sehen wie es per <strong style={{color:"#25D366"}}>WhatsApp</strong> oder <strong style={{color:"#FF5C35"}}>Telefon</strong> läuft — wo ein Gast einfach eine Nachricht schreibt und die KI antwortet und bucht?
          </p>
          <a href="/#waitlist" style={{
            display:"inline-flex",alignItems:"center",gap:"8px",
            background:"#FF5C35",color:"#fff",padding:"13px 28px",
            borderRadius:"10px",fontSize:"14px",fontWeight:500,textDecoration:"none",
          }}>
            Kontakt aufnehmen →
          </a>
        </div>
      </div>
    </div>
  );
}