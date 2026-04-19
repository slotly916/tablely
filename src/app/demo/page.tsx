"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

const DEMO_SLUG = "15948a01-381a-484e-ac23-d019683cd506"; // deinen echten Slug hier eintragen

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
      .order("created_at", { ascending: false }).limit(10);
    setReservations(data || []);
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  useEffect(() => {
    if (!restaurantId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("demo-reservations")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "reservations",
        filter: `restaurant_id=eq.${restaurantId}`,
      }, (payload) => {
        const newRes = payload.new as Reservation;
        setReservations(prev => [newRes, ...prev.slice(0, 9)]);
        setNewEntry(newRes.id);
        setTimeout(() => setNewEntry(null), 3000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  return (
    <div style={{minHeight:"100vh",background:"#0F0F14",fontFamily:"'DM Sans',sans-serif",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(255,92,53,0)}50%{box-shadow:0 0 24px 4px rgba(255,92,53,.3)}}
        .new-entry{animation:slideIn .4s ease,glow 1.5s ease 2;}
        .back-btn:hover{color:#FF5C35!important;}
      `}</style>

      {/* NAV */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 32px",borderBottom:"1px solid rgba(255,255,255,.06)",background:"rgba(15,15,20,.95)",backdropFilter:"blur(16px)",position:"sticky",top:0,zIndex:100}}>
        <a href="/" className="back-btn" style={{display:"flex",alignItems:"center",gap:"8px",color:"rgba(255,255,255,.4)",textDecoration:"none",fontSize:"14px",transition:"color .2s"}}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Zurück
        </a>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"#FFFAF5"}}>
          table<span style={{color:"#FF5C35"}}>ly</span>
          <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,.3)",marginLeft:"10px"}}>Live Demo</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"6px",background:"rgba(255,92,53,.12)",border:"1px solid rgba(255,92,53,.2)",borderRadius:"20px",padding:"5px 12px"}}>
          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:"11px",color:"#FF5C35",fontWeight:500}}>Live</span>
        </div>
      </nav>

      {/* INTRO */}
      <div style={{textAlign:"center",padding:"60px 24px 40px"}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,4vw,44px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1px",lineHeight:1.1,marginBottom:"16px"}}>Probier es selbst aus.</h1>
        <p style={{fontSize:"16px",color:"rgba(255,255,255,.4)",fontWeight:300,maxWidth:"480px",margin:"0 auto",lineHeight:1.7}}>
          Reserviere links als Gast — und sieh wie die Buchung sofort rechts im Dashboard erscheint. In Echtzeit.
        </p>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"48px",maxWidth:"1200px",margin:"0 auto",padding:"0 32px 80px",alignItems:"start"}}>

        {/* LEFT — iPhone */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px"}}>
          <div style={{fontSize:"12px",fontWeight:600,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:"1px",display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{width:"20px",height:"1px",background:"rgba(255,255,255,.15)"}}/>Gast bucht hier<div style={{width:"20px",height:"1px",background:"rgba(255,255,255,.15)"}}/>
          </div>
          <div style={{position:"relative",width:"320px",flexShrink:0}}>
            <div style={{background:"linear-gradient(135deg,#2A2A2A 0%,#1A1A1A 100%)",borderRadius:"48px",padding:"14px",boxShadow:"0 0 0 1px #3A3A3A,0 0 0 3px #1A1A1A,0 40px 80px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.08)",position:"relative"}}>
              <div style={{position:"absolute",top:"14px",left:"50%",transform:"translateX(-50%)",width:"110px",height:"30px",background:"#0A0A0A",borderRadius:"20px",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#111",border:"1px solid #222"}}/>
                <div style={{width:"46px",height:"8px",borderRadius:"6px",background:"#111"}}/>
              </div>
              <div style={{borderRadius:"38px",overflow:"hidden",height:"600px",background:"#FFFAF5",position:"relative"}}>
                <iframe src={`/book/${DEMO_SLUG}`} style={{width:"390px",height:"844px",border:"none",transform:"scale(0.82)",transformOrigin:"top left"}} title="Booking Demo"/>
              </div>
            </div>
            <div style={{position:"absolute",right:"-4px",top:"140px",width:"4px",height:"70px",background:"#2A2A2A",borderRadius:"0 3px 3px 0"}}/>
            <div style={{position:"absolute",left:"-4px",top:"120px",width:"4px",height:"44px",background:"#2A2A2A",borderRadius:"3px 0 0 3px"}}/>
            <div style={{position:"absolute",left:"-4px",top:"174px",width:"4px",height:"44px",background:"#2A2A2A",borderRadius:"3px 0 0 3px"}}/>
          </div>
        </div>

        {/* RIGHT — MacBook */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px"}}>
          <div style={{fontSize:"12px",fontWeight:600,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:"1px",display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{width:"20px",height:"1px",background:"rgba(255,255,255,.15)"}}/>Restaurant sieht das hier<div style={{width:"20px",height:"1px",background:"rgba(255,255,255,.15)"}}/>
          </div>
          <div style={{width:"100%",maxWidth:"560px"}}>
            <div style={{background:"linear-gradient(to bottom,#C8C4C0,#B8B4B0)",borderRadius:"12px 12px 0 0",padding:"10px 10px 0",border:"1px solid #A8A4A0",borderBottom:"none",position:"relative"}}>
              <div style={{position:"absolute",top:"6px",left:"50%",transform:"translateX(-50%)",width:"5px",height:"5px",borderRadius:"50%",background:"#888"}}/>
              <div style={{background:"#111",borderRadius:"6px 6px 0 0",padding:"0",overflow:"hidden"}}>
                <div style={{background:"#1E1E2E",padding:"8px 12px",display:"flex",alignItems:"center",gap:"8px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                  <div style={{display:"flex",gap:"4px"}}>
                    {["#FF5F57","#FEBC2E","#28C840"].map((c,i)=><div key={i} style={{width:"8px",height:"8px",borderRadius:"50%",background:c}}/>)}
                  </div>
                  <div style={{flex:1,background:"rgba(255,255,255,.05)",borderRadius:"4px",padding:"3px 8px",fontSize:"9px",color:"rgba(255,255,255,.2)",textAlign:"center"}}>tablely.at/dashboard — Live</div>
                </div>
                <div style={{background:"#0F0F14",minHeight:"400px",padding:"16px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"16px"}}>
                    {[
                      {l:"Heute",v:reservations.filter(r=>r.date===new Date().toISOString().split("T")[0]).length,c:"#FF5C35"},
                      {l:"Gesamt",v:reservations.length,c:"#818CF8"},
                      {l:"Online",v:reservations.filter(r=>r.channel==="online").length,c:"#34D399"},
                    ].map((s,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,.04)",borderRadius:"8px",padding:"10px 12px",border:"1px solid rgba(255,255,255,.06)"}}>
                        <div style={{fontSize:"9px",color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"4px"}}>{s.l}</div>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:s.c,letterSpacing:"-1px"}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                    <div style={{fontSize:"10px",fontWeight:600,color:"rgba(255,255,255,.25)",textTransform:"uppercase",letterSpacing:".8px"}}>Reservierungen</div>
                    <div style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"9px",color:"#34D399"}}>
                      <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#34D399"}}/>
                      Echtzeit
                    </div>
                  </div>
                  {reservations.length === 0 ? (
                    <div style={{textAlign:"center",padding:"40px 20px",color:"rgba(255,255,255,.2)",fontSize:"13px",fontWeight:300}}>
                      Noch keine Reservierungen —<br/>mach eine Buchung links!
                    </div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                      {reservations.slice(0,7).map((r)=>(
                        <div key={r.id} className={r.id===newEntry?"new-entry":""} style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",borderRadius:"8px",background:r.id===newEntry?"rgba(255,92,53,.15)":"rgba(255,255,255,.04)",border:r.id===newEntry?"1px solid rgba(255,92,53,.3)":"1px solid rgba(255,255,255,.06)",transition:"all .3s"}}>
                          <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:600,color:"#FF5C35",flexShrink:0}}>
                            {r.guest_name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:"11px",fontWeight:500,color:"#FFFAF5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.guest_name}</div>
                            <div style={{fontSize:"9px",color:"rgba(255,255,255,.3)"}}>{new Date(r.date).toLocaleDateString("de-AT",{day:"numeric",month:"short"})} · {r.time.slice(0,5)} · {r.party_size} Pers.</div>
                          </div>
                          <div style={{fontSize:"9px",fontWeight:600,padding:"2px 6px",borderRadius:"5px",flexShrink:0,background:r.channel==="online"?"rgba(99,102,241,.15)":r.channel==="whatsapp"?"rgba(37,211,102,.15)":"rgba(255,92,53,.15)",color:r.channel==="online"?"#818CF8":r.channel==="whatsapp"?"#25D366":"#FF5C35"}}>
                            {r.channel==="online"?"Online":r.channel==="whatsapp"?"WhatsApp":"Telefon"}
                          </div>
                          {r.id===newEntry&&<div style={{fontSize:"9px",fontWeight:700,color:"#FF5C35",flexShrink:0}}>NEU ✓</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{background:"linear-gradient(to bottom,#B8B4B0,#A8A4A0)",height:"12px",borderRadius:"0 0 4px 4px",border:"1px solid #989490",borderTop:"none"}}>
              <div style={{width:"40px",height:"2px",background:"rgba(0,0,0,.1)",borderRadius:"1px",margin:"4px auto 0"}}/>
            </div>
            <div style={{height:"12px",background:"radial-gradient(ellipse at center,rgba(0,0,0,.1) 0%,transparent 70%)"}}/>
          </div>

          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"12px",padding:"16px 20px",maxWidth:"560px",width:"100%",textAlign:"center"}}>
            <p style={{fontSize:"13px",color:"rgba(255,255,255,.4)",lineHeight:1.7,fontWeight:300}}>
              Buchung links gemacht? Sie erscheint automatisch hier — ohne Reload.
            </p>
          </div>

          <div style={{background:"rgba(37,211,102,.06)",border:"1px solid rgba(37,211,102,.15)",borderRadius:"12px",padding:"16px 20px",maxWidth:"560px",width:"100%",textAlign:"center"}}>
            <p style={{fontSize:"14px",color:"rgba(255,255,255,.5)",marginBottom:"12px",fontWeight:300}}>
              Willst du sehen wie es per <strong style={{color:"#25D366"}}>WhatsApp</strong> oder <strong style={{color:"#FF5C35"}}>Telefon</strong> läuft?
            </p>
            <a href="/#waitlist" style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"#FF5C35",color:"#fff",padding:"10px 20px",borderRadius:"8px",fontSize:"13px",fontWeight:500,textDecoration:"none"}}>
              Kontakt aufnehmen →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}