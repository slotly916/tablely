"use client";

import { useState, useEffect } from "react";

function WaitlistSection() {
  const [name, setName] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number|null>(null);

  useEffect(() => {
    fetch("/api/waitlist-count").then(r=>r.json()).then(d=>setWaitlistCount(d.count)).catch(()=>{});
  }, []);

  async function handleSubmit() {
    if (!name || !restaurant || !email) { setErrorMsg("Bitte alle Felder ausfüllen."); return; }
    setStatus("loading"); setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name,restaurant,email}) });
      const data = await res.json();
      if (data.success) { setStatus("success"); setWaitlistCount(c => c !== null ? c+1 : 1); }
      else { setStatus("error"); setErrorMsg(data.error || "Fehler."); }
    } catch { setStatus("error"); setErrorMsg("Verbindungsfehler."); }
  }

  if (status === "success") return (
    <section id="waitlist" style={{padding:"80px 24px",textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{maxWidth:"480px",margin:"0 auto"}}>
        <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"#E8F8F1",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#25C281" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700,color:"#1A1A2E",marginBottom:"12px"}}>Du bist dabei!</h2>
        <p style={{color:"#6B6B80",fontSize:"16px",lineHeight:1.7,fontWeight:300}}>Wir melden uns persönlich. Versprochen.</p>
      </div>
    </section>
  );

  const spotsLeft = waitlistCount !== null ? Math.max(0, 20 - waitlistCount) : null;

  return (
    <section id="waitlist" style={{background:"#1A1A2E",padding:"80px 24px"}}>
      <div style={{maxWidth:"560px",margin:"0 auto",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(255,92,53,0.15)",border:"1px solid rgba(255,92,53,0.25)",borderRadius:"20px",padding:"5px 14px",marginBottom:"20px"}}>
          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:500}}>
            {spotsLeft !== null ? `Noch ${spotsLeft} von 20 Plätzen frei` : "Nur 20 Plätze verfügbar"}
          </span>
        </div>

        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"36px",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1px",lineHeight:1.1,marginBottom:"16px"}}>
          40 Tage kostenlos.<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>Danach vergünstigt.</span>
        </h2>
        <p style={{color:"rgba(255,255,255,0.45)",fontSize:"15px",lineHeight:1.75,fontWeight:300,marginBottom:"32px"}}>
          Wir suchen Restaurants die uns helfen Tablely zu perfektionieren. Du testest kostenlos, gibst uns Feedback — und bekommst dafür dauerhaft bessere Konditionen als alle nach dir.
        </p>

        {waitlistCount !== null && (
          <div style={{marginBottom:"28px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
              <span style={{fontSize:"12px",color:"rgba(255,255,255,0.35)"}}>{waitlistCount} Restaurants eingetragen</span>
              <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:500}}>Ziel: 20</span>
            </div>
            <div style={{height:"4px",background:"rgba(255,255,255,0.08)",borderRadius:"2px",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.min(100,(waitlistCount/20)*100)}%`,background:"#FF5C35",borderRadius:"2px",transition:"width 1s ease"}}/>
            </div>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"12px"}}>
          <input style={inputStyle} type="text" placeholder="Dein Name" value={name} onChange={e=>setName(e.target.value)} disabled={status==="loading"}/>
          <input style={inputStyle} type="text" placeholder="Name deines Restaurants" value={restaurant} onChange={e=>setRestaurant(e.target.value)} disabled={status==="loading"}/>
          <input style={inputStyle} type="email" placeholder="deine@email.at" value={email} onChange={e=>setEmail(e.target.value)} disabled={status==="loading"} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          <button onClick={handleSubmit} disabled={status==="loading"} style={{background:"#FF5C35",color:"#fff",border:"none",padding:"15px",borderRadius:"10px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:status==="loading"?0.7:1,transition:"all .2s"}}>
            {status==="loading" ? "Wird eingetragen..." : "Jetzt Platz sichern →"}
          </button>
        </div>
        {errorMsg && <p style={{color:"#F87171",fontSize:"13px",marginBottom:"8px"}}>{errorMsg}</p>}
        <p style={{fontSize:"12px",color:"rgba(255,255,255,0.25)"}}>Kein Spam. Nur eine E-Mail wenn es losgeht.</p>
      </div>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  width:"100%", padding:"13px 16px", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px",
  fontSize:"15px", fontFamily:"inherit", background:"rgba(255,255,255,0.06)", color:"#FFFAF5", outline:"none",
};

export default function Home() {
  const [dark, setDark] = useState(true);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [mins, setMins] = useState(0);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const target = new Date("2026-04-30T00:00:00");
    function tick() {
      const d = target.getTime() - Date.now();
      if (d <= 0) return;
      setDays(Math.floor(d/86400000));
      setHours(Math.floor((d%86400000)/3600000));
      setMins(Math.floor((d%3600000)/60000));
      setSecs(Math.floor((d%60000)/1000));
    }
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=DM+Sans:wght@300;400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--orange:#FF5C35;--dark:#1A1A2E;--cream:#FFFAF5;--muted:#6B6B80;--border:#F0EBE3;}
        html{scroll-behavior:smooth;}
        body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--dark);overflow-x:hidden;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .nav-cta:hover{background:var(--orange)!important;}
        .btn-main:hover{background:#FF7A5A!important;transform:translateY(-2px);box-shadow:0 12px 32px rgba(255,92,53,.4)!important;}
        .feat-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(26,26,46,.1)!important;}
        .stress-item{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);}
        .stress-item:last-child{border:none;padding-bottom:0;}
        .demo-btn:hover{background:#FF7A5A!important;transform:translateY(-2px);box-shadow:0 12px 32px rgba(255,92,53,.4)!important;}
      `}</style>

      {/* NAV */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 32px",position:"sticky",top:0,background:"rgba(255,250,245,0.97)",backdropFilter:"blur(16px)",zIndex:100,borderBottom:"1px solid var(--border)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"var(--dark)"}}>table<span style={{color:"var(--orange)"}}>ly</span></div>
        <div style={{display:"flex",alignItems:"center",gap:"28px"}}>
          <div style={{display:"flex",gap:"24px",listStyle:"none"}}>
            {[["#features","Funktionen"],["#screenshots","App"],["#waitlist","Warteliste"]].map(([h,l])=>(
              <a key={h} href={h} style={{textDecoration:"none",color:"var(--muted)",fontSize:"14px",transition:"color .2s"}}>{l}</a>
            ))}
          </div>
          <button className="nav-cta" onClick={()=>document.getElementById("waitlist")?.scrollIntoView({behavior:"smooth"})} style={{background:"var(--dark)",color:"#fff",border:"none",padding:"10px 20px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
            Jetzt bewerben
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{background:"var(--dark)",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",top:"-200px",right:"-200px",width:"600px",height:"600px",background:"radial-gradient(circle,rgba(255,92,53,.15) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:"-100px",left:"-100px",width:"400px",height:"400px",background:"radial-gradient(circle,rgba(255,92,53,.06) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:"1200px",margin:"0 auto",padding:"80px 32px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"flex-end"}}>
          <div style={{paddingBottom:"80px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.25)",borderRadius:"20px",padding:"6px 14px",marginBottom:"12px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:500}}>40 Tage kostenlos testen — nur 20 Plätze</span>
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"56px",fontWeight:700,lineHeight:1.05,letterSpacing:"-2px",color:"#FFFAF5",marginBottom:"20px"}}>
              Kein Anruf.<br/>Kein Buch.<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>Kein Chaos.</span>
            </h1>
            <p style={{color:"rgba(255,255,255,.5)",fontSize:"17px",lineHeight:1.75,fontWeight:300,marginBottom:"36px",maxWidth:"440px"}}>
              Stoßzeit. Küche brennt. Telefon klingelt. Dein Kellner blättert im Reservierungsbuch — sucht, rechnet, schreibt. 3 Minuten. Für eine Reservierung. <strong style={{color:"rgba(255,255,255,.8)",fontWeight:500}}>Tablely macht das in 3 Sekunden. Automatisch.</strong>
            </p>
            <div style={{display:"flex",gap:"10px",marginBottom:"32px",flexWrap:"wrap"}}>
              {[[days,"T"],[hours,"Std"],[mins,"Min"],[secs,"Sek"]].map(([v,l],i)=>(
                <div key={i} style={{textAlign:"center"}}>
                  <div style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"10px",padding:"10px 14px",fontFamily:"'Playfair Display',serif",fontSize:"26px",fontWeight:700,color:"#fff",lineHeight:1,minWidth:"52px"}}>
                    {String(v).padStart(2,"0")}
                  </div>
                  <div style={{fontSize:"10px",color:"rgba(255,255,255,.3)",marginTop:"4px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{l}</div>
                </div>
              ))}
              <div style={{display:"flex",alignItems:"flex-start",paddingTop:"6px"}}>
                <div style={{background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.3)",borderRadius:"8px",padding:"8px 12px",fontSize:"11px",fontWeight:600,color:"#FF5C35"}}>Beta 30. April</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"}}>
              <button className="btn-main" onClick={()=>document.getElementById("waitlist")?.scrollIntoView({behavior:"smooth"})} style={{background:"#FF5C35",color:"#fff",border:"none",padding:"16px 28px",borderRadius:"10px",fontSize:"16px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
                Jetzt Platz sichern →
              </button>
              <span style={{fontSize:"13px",color:"rgba(255,255,255,.3)"}}>Kostenlos · Keine Kreditkarte</span>
            </div>
          </div>
          <div style={{position:"relative",paddingBottom:0,animation:"float 6s ease-in-out infinite"}}>
            <div style={{position:"absolute",inset:"-20px",background:"radial-gradient(ellipse,rgba(255,92,53,.2) 0%,transparent 70%)",filter:"blur(20px)",zIndex:0}}/>
            <div style={{position:"relative",zIndex:1,background:"#1E1E2E",borderRadius:"14px",overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.08)"}}>
              <div style={{background:"#2A2A3E",padding:"10px 14px",display:"flex",alignItems:"center",gap:"8px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{display:"flex",gap:"5px"}}>
                  {["#FF5F57","#FEBC2E","#28C840"].map((c,i)=><div key={i} style={{width:"10px",height:"10px",borderRadius:"50%",background:c}}/>)}
                </div>
                <div style={{flex:1,background:"rgba(255,255,255,.05)",borderRadius:"5px",padding:"4px 10px",fontSize:"10px",color:"rgba(255,255,255,.25)",textAlign:"center"}}>tablely.at/dashboard</div>
              </div>
              <img src="/dashboard-dunkel.png" alt="Tablely Dashboard" style={{width:"100%",height:"auto",display:"block"}}/>
            </div>
          </div>
        </div>
      </div>

      {/* PAIN */}
      <section style={{background:"var(--cream)",padding:"100px 32px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"center"}}>
          <div style={{background:"#fff",borderRadius:"20px",padding:"28px",border:"1.5px solid var(--border)",boxShadow:"0 8px 32px rgba(26,26,46,.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"20px"}}>
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#FEE8E8",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <span style={{fontSize:"13px",fontWeight:600,color:"var(--dark)"}}>So läuft es in den meisten Restaurants</span>
            </div>
            {[
              {t:"Telefon klingelt mitten in der Stoßzeit",d:"Kellner unterbricht alles — Gäste warten, Tische warten."},
              {t:"Im Buch blättern, rechnen, nachdenken",d:"Passt Tisch 3? Kann ich die 4 Personen dazwischen schieben?"},
              {t:"No-Show um 20:00 Uhr",d:"Tisch für 4 bleibt leer. Umsatz weg. Nichts zu machen."},
              {t:"WhatsApp-Chaos, Zettel, Missverständnisse",d:"Wer hat was gebucht? Doppelbuchung. Peinlich."},
            ].map((s,i)=>(
              <div key={i} className="stress-item">
                <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"#FEE8E8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div style={{fontSize:"13px",fontWeight:500,color:"var(--dark)",marginBottom:"2px"}}>{s.t}</div>
                  <div style={{fontSize:"12px",color:"var(--muted)",lineHeight:1.5}}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"12px"}}>Das Problem</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"40px",fontWeight:700,letterSpacing:"-1px",lineHeight:1.1,marginBottom:"20px"}}>Das Reservierungsbuch kostet dich täglich Geld.</h2>
            <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:300,marginBottom:"16px"}}>Jeder Anruf während der Stoßzeit ist eine Ablenkung. Jede Minute im Buch blättern ist verschwendete Zeit. Jeder No-Show ohne Erinnerung ist bares Geld.</p>
            <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:300}}>Österreichische Restaurants verlieren täglich bis zu <strong style={{color:"var(--dark)"}}>2 Stunden</strong> durch manuelle Reservierungen. Tablely gibt dir diese Zeit zurück.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{background:"#F5F0EB",padding:"100px 32px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"60px"}}>
            <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"12px"}}>Wie es funktioniert</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"40px",fontWeight:700,letterSpacing:"-1px",marginBottom:"16px"}}>Drei Wege zu buchen.<br/>Ein Dashboard für alles.</h2>
            <p style={{color:"var(--muted)",fontSize:"16px",fontWeight:300,maxWidth:"480px",margin:"0 auto"}}>WhatsApp, Telefon oder online — deine Gäste wählen wie sie buchen. Tablely übernimmt den Rest.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"20px"}}>
            <div className="feat-card" style={{background:"var(--dark)",borderRadius:"20px",padding:"32px",transition:"all .25s",boxShadow:"0 8px 24px rgba(26,26,46,.12)"}}>
              <div style={{background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.2)",borderRadius:"8px",padding:"3px 10px",fontSize:"10px",fontWeight:600,textTransform:"uppercase",letterSpacing:".8px",color:"#FF5C35",display:"inline-block",marginBottom:"20px"}}>WhatsApp KI</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#FFFAF5",marginBottom:"12px"}}>Gäste schreiben — KI antwortet & bucht</h3>
              <p style={{color:"rgba(255,255,255,.45)",fontSize:"14px",lineHeight:1.7,fontWeight:300,marginBottom:"24px"}}>Deine Gäste schreiben per WhatsApp. Die KI versteht alles, antwortet in Sekunden und trägt die Reservierung automatisch ein.</p>
              <div style={{background:"rgba(255,255,255,.05)",borderRadius:"12px",padding:"16px",border:"1px solid rgba(255,255,255,.08)"}}>
                <div style={{fontSize:"11px",padding:"8px 12px",borderRadius:"10px 10px 10px 2px",background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.8)",maxWidth:"80%",marginBottom:"8px",lineHeight:1.5}}>Hallo! Tisch für 3 am Freitag um 19:30? 🙏</div>
                <div style={{fontSize:"11px",padding:"8px 12px",borderRadius:"10px 10px 2px 10px",background:"#25D366",color:"#fff",maxWidth:"80%",marginLeft:"auto",lineHeight:1.5}}>Perfekt! Tisch für 3 am Fr. 20.03. um 19:30 ✅ Wir freuen uns auf euch!</div>
              </div>
            </div>
            <div className="feat-card" style={{background:"var(--orange)",borderRadius:"20px",padding:"32px",transition:"all .25s",boxShadow:"0 8px 24px rgba(255,92,53,.25)"}}>
              <div style={{background:"rgba(255,255,255,.2)",borderRadius:"8px",padding:"3px 10px",fontSize:"10px",fontWeight:600,textTransform:"uppercase",letterSpacing:".8px",color:"#fff",display:"inline-block",marginBottom:"20px"}}>KI Telefon</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#fff",marginBottom:"12px"}}>KI nimmt Anrufe entgegen — automatisch</h3>
              <p style={{color:"rgba(255,255,255,.8)",fontSize:"14px",lineHeight:1.7,fontWeight:300,marginBottom:"24px"}}>Kein Anruf geht verloren. Die KI nimmt ab, versteht den Gast und trägt alles ein. Bei Bedarf wird sofort weitergeleitet.</p>
              <div style={{background:"rgba(255,255,255,.12)",borderRadius:"12px",padding:"16px",border:"1px solid rgba(255,255,255,.15)"}}>
                {[["Gast ruft an","KI nimmt ab"],["Tisch, Zeit, Personen","KI versteht alles"],["Reservierung","Automatisch gespeichert"]].map(([l,r],i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<2?"1px solid rgba(255,255,255,.1)":"none",fontSize:"11px"}}>
                    <span style={{color:"rgba(255,255,255,.6)"}}>{l}</span>
                    <span style={{color:"#fff",fontWeight:500}}>→ {r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}}>
            {[
              {icon:<svg viewBox="0 0 28 28" fill="none" width="28" height="28"><rect x="3" y="5" width="22" height="18" rx="3" stroke="#FF5C35" strokeWidth="1.4"/><path d="M3 11h22M9 4v3M19 4v3" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>,t:"Online Buchung",d:"Eigene Booking Page — Gäste buchen direkt rund um die Uhr."},
              {icon:<svg viewBox="0 0 28 28" fill="none" width="28" height="28"><rect x="2" y="2" width="24" height="24" rx="4" stroke="#FF5C35" strokeWidth="1.4"/><path d="M2 11h24" stroke="#FF5C35" strokeWidth="1.4"/><rect x="6" y="15" width="7" height="5" rx="1.5" fill="#FF5C35" fillOpacity=".2" stroke="#FF5C35" strokeWidth="1.2"/></svg>,t:"Alles im Dashboard",d:"WhatsApp, Telefon, Online — alles an einem Ort. Live, übersichtlich."},
              {icon:<svg viewBox="0 0 28 28" fill="none" width="28" height="28"><path d="M14 3v3M14 3a8 8 0 0 1 8 8c0 4-1.5 5.5-1.5 5.5H7.5S6 15 6 11A8 8 0 0 1 14 3Z" stroke="#FF5C35" strokeWidth="1.4" strokeLinejoin="round"/><path d="M10 19s0 4 4 4 4-4 4-4" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>,t:"Auto-Erinnerungen",d:"Gäste werden 24h und 2h vor der Reservierung erinnert. No-Shows sinken auf fast null."},
            ].map((f,i)=>(
              <div key={i} className="feat-card" style={{background:"#fff",borderRadius:"16px",padding:"24px",border:"1.5px solid var(--border)",transition:"all .25s",boxShadow:"0 4px 16px rgba(26,26,46,.05)"}}>
                <div style={{marginBottom:"14px"}}>{f.icon}</div>
                <div style={{fontSize:"14px",fontWeight:600,color:"var(--dark)",marginBottom:"6px"}}>{f.t}</div>
                <p style={{fontSize:"13px",color:"var(--muted)",lineHeight:1.6,fontWeight:300}}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCREENSHOTS — MacBook + Demo Link */}
      <section id="screenshots" style={{background:"var(--cream)",padding:"100px 32px",overflow:"hidden"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"56px"}}>
            <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"12px"}}>Das Produkt</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"40px",fontWeight:700,letterSpacing:"-1px",marginBottom:"16px"}}>Schluss mit dem Reservierungsbuch.</h2>
            <p style={{color:"var(--muted)",fontSize:"16px",fontWeight:300,maxWidth:"480px",margin:"0 auto 28px"}}>Ein Dashboard das jeder sofort versteht. Kein Training. Kein Handbuch. Einfach öffnen und loslegen.</p>
            <div style={{display:"inline-flex",gap:"4px",background:"#EDE8E3",borderRadius:"10px",padding:"4px"}}>
              {[["Dunkel",true],["Hell",false]].map(([l,d])=>(
                <button key={String(l)} onClick={()=>setDark(d as boolean)} style={{padding:"7px 20px",borderRadius:"7px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:"none",transition:"all .2s",background:dark===(d as boolean)?"var(--dark)":"transparent",color:dark===(d as boolean)?"#fff":"var(--muted)"}}>
                  {l as string}
                </button>
              ))}
            </div>
          </div>

          {/* MacBook */}
          <div style={{maxWidth:"860px",margin:"0 auto 60px",filter:"drop-shadow(0 40px 80px rgba(26,26,46,.2))"}}>
            <div style={{background:"linear-gradient(to bottom,#D8D4D0,#C8C4C0)",borderRadius:"16px 16px 0 0",padding:"18px 18px 0",border:"1px solid #B8B4B0",borderBottom:"none",position:"relative"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#888",margin:"0 auto 12px"}}/>
              <div style={{background:"#111",borderRadius:"8px 8px 0 0",padding:"6px 6px 0",overflow:"hidden"}}>
                <div style={{borderRadius:"5px 5px 0 0",overflow:"hidden",lineHeight:0}}>
                  <img src={dark?"/dashboard-dunkel.png":"/dashboard-hell.png"} alt="Dashboard" style={{width:"100%",height:"auto",display:"block",transition:"opacity .4s"}}/>
                </div>
              </div>
            </div>
            <div style={{background:"linear-gradient(to bottom,#C0BCBA,#B0ACAA)",height:"14px",borderRadius:"0 0 6px 6px",border:"1px solid #A8A4A2",borderTop:"none",position:"relative"}}>
              <div style={{position:"absolute",top:"4px",left:"50%",transform:"translateX(-50%)",width:"50px",height:"3px",background:"rgba(0,0,0,.12)",borderRadius:"2px"}}/>
            </div>
            <div style={{height:"6px",background:"linear-gradient(to bottom,#989490,transparent)",borderRadius:"0 0 6px 6px"}}/>
            <div style={{height:"16px",background:"radial-gradient(ellipse at center,rgba(0,0,0,.12) 0%,transparent 70%)"}}/>
          </div>

          {/* Two smaller mockups */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"40px",maxWidth:"760px",margin:"0 auto 60px"}}>
            {[
              {src:dark?"/reservierung-dunkel.png":"/reservierung-hell.png",t:"Neue Reservierung",s:"In Sekunden eingetragen"},
              {src:"/bookingpage.png",t:"Deine Booking Page",s:"Gäste buchen direkt — 24/7"},
            ].map((m,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{background:"#1A1A1A",borderRadius:"16px",padding:"10px 10px 0",boxShadow:"0 20px 48px rgba(26,26,46,.18)",border:"1px solid rgba(255,255,255,.06)",display:"inline-block",width:"100%"}}>
                  <div style={{width:"32px",height:"4px",borderRadius:"2px",background:"#333",margin:"0 auto 8px"}}/>
                  <div style={{borderRadius:"8px 8px 0 0",overflow:"hidden",lineHeight:0}}>
                    <img src={m.src} alt={m.t} style={{width:"100%",height:"auto",display:"block",transition:"opacity .3s"}}/>
                  </div>
                </div>
                <div style={{marginTop:"16px",fontSize:"15px",fontWeight:600,color:"var(--dark)",marginBottom:"4px"}}>{m.t}</div>
                <div style={{fontSize:"13px",color:"var(--muted)",fontWeight:300}}>{m.s}</div>
              </div>
            ))}
          </div>

          {/* Demo CTA */}
          <div style={{textAlign:"center",padding:"48px",background:"var(--dark)",borderRadius:"20px"}}>
            <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"12px"}}>Live Demo</div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,color:"#FFFAF5",letterSpacing:"-0.5px",marginBottom:"12px"}}>Probier es selbst aus.</h3>
            <p style={{fontSize:"15px",color:"rgba(255,255,255,.45)",fontWeight:300,marginBottom:"28px",maxWidth:"420px",margin:"0 auto 28px",lineHeight:1.7}}>
              Reserviere als Gast auf dem iPhone — sieh wie es sofort im MacBook Dashboard erscheint. Live, in Echtzeit.
            </p>
            <a href="/demo" className="demo-btn" style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#FF5C35",color:"#fff",padding:"14px 32px",borderRadius:"10px",fontSize:"15px",fontWeight:500,textDecoration:"none",transition:"all .2s"}}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.4"/><path d="M6 8h4M8 6v4" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Demo starten →
            </a>
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <div style={{background:"var(--dark)",padding:"80px 32px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"12px"}}>Was Tablely bewirkt</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"40px",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1px",marginBottom:"40px"}}>Zahlen die sprechen.</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",border:"1px solid rgba(255,255,255,.07)",borderRadius:"16px",overflow:"hidden"}}>
            {[
              {v:"–60%",l:"weniger No-Shows durch automatische Erinnerungen"},
              {v:"2h",l:"täglich gespart — keine Reservierungsanrufe mehr"},
              {v:"24/7",l:"Buchungen annehmen — auch wenn du schläfst"},
            ].map((n,i)=>(
              <div key={i} style={{padding:"40px 32px",textAlign:"center",borderRight:i<2?"1px solid rgba(255,255,255,.07)":"none"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"48px",fontWeight:700,color:"var(--orange)",letterSpacing:"-2px",marginBottom:"10px"}}>{n.v}</div>
                <div style={{fontSize:"14px",color:"rgba(255,255,255,.4)",fontWeight:300,lineHeight:1.5}}>{n.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WAITLIST */}
      <WaitlistSection />

      {/* FOOTER */}
      <footer style={{padding:"24px 32px",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:700,color:"var(--dark)"}}>table<span style={{color:"var(--orange)"}}>ly</span></div>
        <div style={{display:"flex",gap:"20px"}}>
          {[["Impressum","/impressum"],["Datenschutz","/datenschutz"],["AGB","/agb"]].map(([l,h])=>(
            <a key={h} href={h} style={{fontSize:"12px",color:"var(--muted)",textDecoration:"none"}}>{l}</a>
          ))}
        </div>
        <p style={{fontSize:"12px",color:"var(--muted)"}}>© 2026 Tablely · Michael Kleinlercher e.U.</p>
      </footer>
    </>
  );
}