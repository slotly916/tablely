"use client";

import { useState, useEffect, useRef } from "react";

function RegisterModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleGoogleLogin() {
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/callback?next=/onboarding` },
    });
  }

  async function handleRegister() {
    if (!name || !email || !password) { setErrorMsg("Bitte alle Felder ausfüllen."); return; }
    if (password.length < 8) { setErrorMsg("Passwort muss mindestens 8 Zeichen lang sein."); return; }
    setStatus("loading"); setErrorMsg("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.error) { setStatus("error"); setErrorMsg(data.error); return; }
      setStatus("success");
    } catch { setStatus("error"); setErrorMsg("Verbindungsfehler."); }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,26,46,.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:"20px",fontFamily:"'DM Sans',sans-serif"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#FFFAF5",borderRadius:"16px",padding:"36px",width:"100%",maxWidth:"420px",boxShadow:"0 24px 64px rgba(26,26,46,.18)",border:"1px solid #F0EBE3"}}>
        {status==="success" ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"#E8F8F1",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#25C281" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#1A1A2E",marginBottom:"10px"}}>Konto erstellt</h2>
            <p style={{color:"#6B6B80",fontSize:"14px",lineHeight:1.7,marginBottom:"20px"}}>Bestätigungsmail wurde an <strong>{email}</strong> gesendet.</p>
            <button onClick={onClose} style={{background:"#FF5C35",color:"#fff",border:"none",padding:"12px 28px",borderRadius:"8px",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>Schließen</button>
          </div>
        ) : (
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E"}}>30 Tage gratis testen</h2>
              <button onClick={onClose} style={{background:"transparent",border:"none",color:"#6B6B80",cursor:"pointer",fontSize:"20px",lineHeight:1}}>✕</button>
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(255,92,53,.08)",border:"1px solid rgba(255,92,53,.18)",borderRadius:"6px",padding:"4px 12px",marginBottom:"20px"}}>
              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#FF5C35"}}/>
              <span style={{fontSize:"11px",color:"#FF5C35",fontWeight:600}}>Noch 5 von 10 Plätzen frei</span>
            </div>
            <button onClick={handleGoogleLogin} className="btn-hover-light" style={{
              width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
              padding:"12px",borderRadius:"8px",border:"1px solid #F0EBE3",background:"#fff",
              fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:"#1A1A2E",
              marginBottom:"12px",transition:"all .2s",
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Mit Google registrieren
            </button>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
              <div style={{flex:1,height:"1px",background:"#F0EBE3"}}/>
              <span style={{fontSize:"12px",color:"#6B6B80"}}>oder mit E-Mail</span>
              <div style={{flex:1,height:"1px",background:"#F0EBE3"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"14px"}}>
              <input style={{width:"100%",padding:"11px 14px",border:"1px solid #F0EBE3",borderRadius:"8px",fontSize:"14px",fontFamily:"inherit",background:"#fff",color:"#1A1A2E",outline:"none"}} type="text" placeholder="Dein Name" value={name} onChange={e=>setName(e.target.value)} disabled={status==="loading"}/>
              <input style={{width:"100%",padding:"11px 14px",border:"1px solid #F0EBE3",borderRadius:"8px",fontSize:"14px",fontFamily:"inherit",background:"#fff",color:"#1A1A2E",outline:"none"}} type="email" placeholder="deine@email.at" value={email} onChange={e=>setEmail(e.target.value)} disabled={status==="loading"}/>
              <input style={{width:"100%",padding:"11px 14px",border:"1px solid #F0EBE3",borderRadius:"8px",fontSize:"14px",fontFamily:"inherit",background:"#fff",color:"#1A1A2E",outline:"none"}} type="password" placeholder="Passwort (min. 8 Zeichen)" value={password} onChange={e=>setPassword(e.target.value)} disabled={status==="loading"} onKeyDown={e=>e.key==="Enter"&&handleRegister()}/>
            </div>
            {errorMsg && <p style={{color:"#E24B4A",fontSize:"13px",marginBottom:"10px"}}>{errorMsg}</p>}
            <button onClick={handleRegister} disabled={status==="loading"} className="btn-hover-primary" style={{width:"100%",background:"#FF5C35",color:"#fff",border:"none",padding:"14px",borderRadius:"8px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:status==="loading"?0.7:1,marginBottom:"12px",transition:"all .2s"}}>
              {status==="loading" ? "Wird registriert..." : "Kostenlos starten"}
            </button>
            <p style={{fontSize:"11px",color:"#6B6B80",textAlign:"center",lineHeight:1.6}}>
              Erste 10 Restaurants: 30 Tage gratis + 3 Monate 10% Rabatt.<br/>
              Alle Features außer KI Telefon (in Entwicklung).
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// Sanfter Fade-in beim Scrollen
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(16px)",
      transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Banner nur zeigen, wenn noch keine Entscheidung getroffen wurde
    try {
      const choice = localStorage.getItem("tablely_cookie_consent");
      if (!choice) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function decide(value: "accepted" | "declined") {
    try { localStorage.setItem("tablely_cookie_consent", value); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position:"fixed", left:"20px", right:"20px", bottom:"20px", zIndex:600,
      display:"flex", justifyContent:"center", fontFamily:"'DM Sans',sans-serif",
      pointerEvents:"none",
    }}>
      <div style={{
        pointerEvents:"auto",
        background:"#FFFAF5", border:"1px solid #F0EBE3", borderRadius:"14px",
        boxShadow:"0 16px 48px rgba(26,26,46,.16)", padding:"22px 24px",
        maxWidth:"720px", width:"100%",
        display:"flex", alignItems:"center", gap:"24px", flexWrap:"wrap",
      }}>
        <div style={{flex:1, minWidth:"240px"}}>
          <div style={{display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px"}}>
            <div style={{width:"22px",height:"22px",borderRadius:"6px",background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#FF5C35" strokeWidth="1.2"/><circle cx="4.5" cy="5" r=".8" fill="#FF5C35"/><circle cx="7.5" cy="7" r=".8" fill="#FF5C35"/><circle cx="5" cy="8" r=".6" fill="#FF5C35"/></svg>
            </div>
            <span style={{fontSize:"14px", fontWeight:600, color:"#1A1A2E"}}>Wir verwenden Cookies</span>
          </div>
          <p style={{fontSize:"13px", color:"#6B6B80", lineHeight:1.6, fontWeight:300}}>
            Wir nutzen notwendige Cookies, damit die Seite funktioniert, sowie optionale Cookies um die Nutzung zu analysieren und Tablely zu verbessern. Du kannst selbst entscheiden. Mehr dazu in unserer{" "}
            <a href="/datenschutz" style={{color:"#FF5C35", textDecoration:"none", fontWeight:500}}>Datenschutzerklärung</a>.
          </p>
        </div>
        <div style={{display:"flex", gap:"10px", flexShrink:0}}>
          <button onClick={()=>decide("declined")} className="btn-hover-light" style={{
            background:"#fff", color:"#1A1A2E", border:"1px solid #F0EBE3",
            padding:"10px 18px", borderRadius:"8px", fontSize:"13px", fontWeight:500,
            cursor:"pointer", fontFamily:"inherit", transition:"all .2s",
          }}>
            Nur notwendige
          </button>
          <button onClick={()=>decide("accepted")} className="btn-hover-primary" style={{
            background:"#FF5C35", color:"#fff", border:"none",
            padding:"10px 20px", borderRadius:"8px", fontSize:"13px", fontWeight:500,
            cursor:"pointer", fontFamily:"inherit", transition:"all .2s",
          }}>
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--orange:#FF5C35;--dark:#1A1A2E;--cream:#FFFAF5;--muted:#6B6B80;--border:#F0EBE3;}
        html{scroll-behavior:smooth;}
        body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--dark);overflow-x:hidden;-webkit-font-smoothing:antialiased;}

        /* Dezente, ruhige Hover-Effekte statt 3D */
        .btn-hover-primary{transition:background .2s ease, box-shadow .2s ease;}
        .btn-hover-primary:hover{background:#F04E28!important;box-shadow:0 6px 20px rgba(255,92,53,.22);}
        .btn-hover-light:hover{border-color:#D9D2C8!important;background:#FBF8F3!important;}
        .btn-hover-dark{transition:background .2s ease;}
        .btn-hover-dark:hover{background:#2A2A45!important;}
        .nav-cta{transition:background .2s ease,color .2s ease;}
        .nav-cta:hover{background:var(--orange)!important;color:#fff!important;border-color:var(--orange)!important;}
        .nav-link{transition:color .2s ease;}
        .nav-link:hover{color:var(--dark)!important;}

        /* Cards: nur sanftes Anheben, kein Kippen */
        .soft-card{transition:transform .25s ease, box-shadow .25s ease;}
        .soft-card:hover{transform:translateY(-4px);box-shadow:0 16px 36px rgba(26,26,46,.10);}

        .link-arrow{transition:gap .2s ease;}
        .link-arrow:hover{gap:12px!important;}

        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr!important;gap:40px!important;padding:56px 20px!important;}
          .hero-mockup{display:none!important;}
          .pain-grid{grid-template-columns:1fr!important;gap:40px!important;}
          .feat-big-grid{grid-template-columns:1fr!important;}
          .feat-mini-grid{grid-template-columns:1fr 1fr!important;}
          .numbers-grid{grid-template-columns:1fr!important;}
          .number-item{border-right:none!important;border-bottom:1px solid rgba(255,255,255,.08)!important;}
          .wa-section-grid{grid-template-columns:1fr!important;gap:48px!important;}
          .wa-mockup{display:none!important;}
          .booking-grid{grid-template-columns:1fr!important;gap:40px!important;}
          .demo-split{grid-template-columns:1fr!important;gap:40px!important;}
          .nav-links-hide{display:none!important;}
        }
      `}</style>

      {/* NAV */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 32px",position:"sticky",top:0,background:"rgba(255,250,245,0.92)",backdropFilter:"blur(16px)",zIndex:100,borderBottom:"1px solid var(--border)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.5px"}}>table<span style={{color:"var(--orange)"}}>ly</span></div>
        <div style={{display:"flex",alignItems:"center",gap:"28px"}}>
          <div className="nav-links-hide" style={{display:"flex",gap:"28px",alignItems:"center"}}>
            {[["#features","Funktionen"],["#screenshots","App"],["/presse","Presse"],["/demo","Demo"]].map(([h,l])=>(
              <a key={h} href={h} className="nav-link" style={{textDecoration:"none",color:"var(--muted)",fontSize:"14px",fontWeight:500}}>{l}</a>
            ))}
          </div>
          <button className="nav-cta" onClick={()=>setShowModal(true)} style={{background:"var(--dark)",color:"#fff",border:"1px solid var(--dark)",padding:"9px 18px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
            Jetzt testen
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{background:"var(--dark)",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",top:"-200px",right:"-120px",width:"520px",height:"520px",background:"radial-gradient(circle,rgba(255,92,53,.10) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div className="hero-grid" style={{maxWidth:"1200px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"72px",alignItems:"center",padding:"96px 32px"}}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.2)",borderRadius:"6px",padding:"6px 14px",marginBottom:"24px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0}}/>
              <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600,letterSpacing:"0.2px"}}>Noch 5 Plätze — 30 Tage gratis + 3 Monate 10% Rabatt</span>
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(40px,5vw,56px)",fontWeight:700,lineHeight:1.07,letterSpacing:"-1.5px",color:"#FFFAF5",marginBottom:"22px"}}>
              Kein Anruf.<br/>Kein Buch.<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>Kein Chaos.</span>
            </h1>
            <p style={{color:"rgba(255,255,255,.6)",fontSize:"17px",lineHeight:1.75,fontWeight:300,marginBottom:"36px",maxWidth:"450px"}}>
              Stoßzeit. Küche brennt. Telefon klingelt. Dein Kellner blättert im Reservierungsbuch — 3 Minuten für eine Reservierung. <strong style={{color:"rgba(255,255,255,.88)",fontWeight:500}}>Tablely macht das in 3 Sekunden.</strong>
            </p>
            <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
              <button className="btn-hover-primary" onClick={()=>setShowModal(true)} style={{background:"#FF5C35",color:"#fff",border:"none",padding:"15px 28px",borderRadius:"8px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
                30 Tage kostenlos testen
              </button>
              <a href="/demo" className="link-arrow" style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"transparent",color:"#FFFAF5",border:"1px solid rgba(255,255,255,.22)",padding:"14px 24px",borderRadius:"8px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",textDecoration:"none",transition:"border-color .2s ease, gap .2s ease"}}>
                Live Demo ansehen
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3.5 7.5h8M8 4l3.5 3.5L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,.35)",marginTop:"16px"}}>Keine Kreditkarte · Demo ohne Anmeldung</div>
          </div>
          <div className="hero-mockup">
            <div style={{background:"#1E1E2E",borderRadius:"12px",overflow:"hidden",boxShadow:"0 30px 70px rgba(0,0,0,.45)",border:"1px solid rgba(255,255,255,.08)"}}>
              <div style={{background:"#2A2A3E",padding:"10px 14px",display:"flex",alignItems:"center",gap:"8px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{display:"flex",gap:"6px"}}>
                  {["#FF5F57","#FEBC2E","#28C840"].map((c,i)=><div key={i} style={{width:"10px",height:"10px",borderRadius:"50%",background:c}}/>)}
                </div>
                <div style={{flex:1,background:"rgba(255,255,255,.05)",borderRadius:"5px",padding:"4px 10px",fontSize:"10px",color:"rgba(255,255,255,.3)",textAlign:"center"}}>tablely.at/dashboard</div>
              </div>
              <img src="/dashboard-dunkel.png" alt="Tablely Dashboard" style={{width:"100%",height:"auto",display:"block"}}/>
            </div>
          </div>
        </div>
      </div>

      {/* PAIN */}
      <section style={{background:"var(--cream)",padding:"104px 32px"}}>
        <Reveal>
        <div className="pain-grid" style={{maxWidth:"1100px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"72px",alignItems:"center"}}>
          <div style={{background:"#fff",borderRadius:"16px",padding:"32px",border:"1px solid var(--border)",boxShadow:"0 4px 24px rgba(26,26,46,.04)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"22px"}}>
              <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#FEE8E8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <span style={{fontSize:"13px",fontWeight:600,color:"var(--dark)"}}>So läuft es in den meisten Restaurants</span>
            </div>
            {[
              {t:"Telefon klingelt mitten in der Stoßzeit",d:"Kellner unterbricht alles — Gäste warten, Tische warten."},
              {t:"Im Buch blättern, rechnen, nachdenken",d:"Passt Tisch 3? Kann ich die 4 Personen dazwischen schieben?"},
              {t:"No-Show um 20:00 Uhr",d:"Tisch für 4 bleibt leer. Umsatz weg. Nichts zu machen."},
              {t:"WhatsApp-Chaos, Zettel, Missverständnisse",d:"Wer hat was gebucht? Doppelbuchung. Peinlich."},
            ].map((s,i,arr)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"12px",padding:"13px 0",borderBottom:i<arr.length-1?"1px solid var(--border)":"none"}}>
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
            <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"14px"}}>Das Problem</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,38px)",fontWeight:700,letterSpacing:"-0.8px",lineHeight:1.15,marginBottom:"20px"}}>Das Reservierungsbuch kostet dich täglich Geld.</h2>
            <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:300,marginBottom:"16px"}}>Jeder Anruf während der Stoßzeit ist eine Ablenkung. Jede Minute im Buch blättern ist verschwendete Zeit.</p>
            <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:300}}>Österreichische Restaurants verlieren täglich bis zu <strong style={{color:"var(--dark)",fontWeight:600}}>2 Stunden</strong> durch manuelle Reservierungen. Tablely gibt dir diese Zeit zurück.</p>
          </div>
        </div>
        </Reveal>
      </section>

      {/* DEMO HIGHLIGHT */}
      <section style={{background:"var(--dark)",padding:"96px 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-150px",left:"-120px",width:"480px",height:"480px",background:"radial-gradient(circle,rgba(255,92,53,.10) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <Reveal>
        <div className="demo-split" style={{maxWidth:"1100px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"64px",alignItems:"center",position:"relative",zIndex:1}}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.22)",borderRadius:"6px",padding:"6px 14px",marginBottom:"22px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35"}}/>
              <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>Live Demo · keine Anmeldung nötig</span>
            </div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,4vw,40px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1px",lineHeight:1.12,marginBottom:"18px"}}>
              Sieh in <span style={{color:"#FF5C35",fontStyle:"italic"}}>30 Sekunden</span> wie es funktioniert.
            </h2>
            <p style={{color:"rgba(255,255,255,.6)",fontSize:"16px",lineHeight:1.75,fontWeight:300,marginBottom:"30px"}}>
              Reserviere selbst als Gast — und beobachte wie die Reservierung in Echtzeit im Dashboard auftaucht. Kein Konto, keine E-Mail, einfach ausprobieren.
            </p>
            <a href="/demo" className="btn-hover-primary link-arrow" style={{display:"inline-flex",alignItems:"center",gap:"10px",background:"#FF5C35",color:"#fff",padding:"15px 30px",borderRadius:"8px",fontSize:"16px",fontWeight:500,textDecoration:"none"}}>
              Demo jetzt starten
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>

          <div className="demo-steps-grid" style={{display:"grid",gridTemplateColumns:"1fr",gap:"12px"}}>
            {[
              {n:"1",t:"Du buchst als Gast",d:"Datum, Uhrzeit, Personen — wie ein echter Gast auf der Buchungsseite."},
              {n:"2",t:"Tablely verarbeitet alles",d:"Tisch wird automatisch zugewiesen, Bestätigung sofort."},
              {n:"3",t:"Erscheint live im Dashboard",d:"Du siehst die Reservierung in Echtzeit im Restaurant-Dashboard."},
            ].map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"16px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"12px",padding:"18px 20px"}}>
                <div style={{width:"30px",height:"30px",borderRadius:"8px",background:"rgba(255,92,53,.12)",border:"1px solid rgba(255,92,53,.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Playfair Display',serif",fontSize:"14px",fontWeight:700,color:"#FF5C35"}}>{s.n}</div>
                <div>
                  <div style={{fontSize:"15px",fontWeight:600,color:"#FFFAF5",marginBottom:"3px"}}>{s.t}</div>
                  <div style={{fontSize:"13px",color:"rgba(255,255,255,.5)",lineHeight:1.5,fontWeight:300}}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      {/* FEATURES */}
      <section id="features" style={{background:"#F5F0EB",padding:"104px 32px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <Reveal>
          <div style={{textAlign:"center",marginBottom:"60px"}}>
            <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"14px"}}>Wie es funktioniert</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,38px)",fontWeight:700,letterSpacing:"-0.8px",marginBottom:"16px"}}>Drei Wege zu buchen.<br/>Ein Dashboard für alles.</h2>
            <p style={{color:"var(--muted)",fontSize:"16px",fontWeight:300,maxWidth:"480px",margin:"0 auto"}}>WhatsApp, Telefon oder online — deine Gäste wählen wie sie buchen.</p>
          </div>
          </Reveal>
          <Reveal delay={80}>
          <div className="feat-big-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"20px"}}>
            <div className="soft-card" style={{background:"var(--dark)",borderRadius:"16px",padding:"32px"}}>
              <div style={{background:"rgba(255,92,53,.12)",border:"1px solid rgba(255,92,53,.2)",borderRadius:"6px",padding:"3px 10px",fontSize:"10px",fontWeight:600,textTransform:"uppercase",letterSpacing:".8px",color:"#FF5C35",display:"inline-block",marginBottom:"20px"}}>WhatsApp KI</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#FFFAF5",marginBottom:"12px"}}>Gäste schreiben — KI antwortet und bucht</h3>
              <p style={{color:"rgba(255,255,255,.5)",fontSize:"14px",lineHeight:1.7,fontWeight:300,marginBottom:"24px"}}>Deine Gäste schreiben per WhatsApp. Die KI versteht alles, antwortet in Sekunden und trägt die Reservierung automatisch ein.</p>
              <div style={{background:"rgba(255,255,255,.04)",borderRadius:"10px",padding:"16px",border:"1px solid rgba(255,255,255,.07)"}}>
                <div style={{fontSize:"11px",padding:"8px 12px",borderRadius:"10px 10px 10px 2px",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.8)",maxWidth:"80%",marginBottom:"8px",lineHeight:1.5}}>Hallo! Tisch für 3 am Freitag um 19:30?</div>
                <div style={{fontSize:"11px",padding:"8px 12px",borderRadius:"10px 10px 2px 10px",background:"#25D366",color:"#fff",maxWidth:"80%",marginLeft:"auto",lineHeight:1.5}}>Perfekt! Tisch für 3 am Fr. 20.03. um 19:30 reserviert. Wir freuen uns auf euch!</div>
              </div>
            </div>
            <div className="soft-card" style={{background:"#fff",border:"1px solid var(--border)",borderRadius:"16px",padding:"32px"}}>
              <div style={{background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.2)",borderRadius:"6px",padding:"3px 10px",fontSize:"10px",fontWeight:600,textTransform:"uppercase",letterSpacing:".8px",color:"#FF5C35",display:"inline-block",marginBottom:"20px"}}>KI Telefon</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"var(--dark)",marginBottom:"12px"}}>KI nimmt Anrufe entgegen — automatisch</h3>
              <p style={{color:"var(--muted)",fontSize:"14px",lineHeight:1.7,fontWeight:300,marginBottom:"24px"}}>Kein Anruf geht verloren. Die KI nimmt ab, versteht den Gast und trägt alles ein.</p>
              <div style={{background:"#FAFAF8",borderRadius:"10px",padding:"16px",border:"1px solid var(--border)"}}>
                {[["Gast ruft an","KI nimmt ab"],["Tisch, Zeit, Personen","KI versteht alles"],["Reservierung","Automatisch gespeichert"]].map(([l,r],i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<2?"1px solid var(--border)":"none",fontSize:"11px"}}>
                    <span style={{color:"var(--muted)"}}>{l}</span>
                    <span style={{color:"var(--dark)",fontWeight:600}}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </Reveal>
          <Reveal delay={120}>
          <div className="feat-mini-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px"}}>
            {[
              {icon:<svg viewBox="0 0 28 28" fill="none" width="26" height="26"><rect x="3" y="5" width="22" height="18" rx="3" stroke="#FF5C35" strokeWidth="1.4"/><path d="M3 11h22M9 4v3M19 4v3" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>,t:"Online Buchung",d:"Eigene Booking Page — Gäste buchen direkt rund um die Uhr."},
              {icon:<svg viewBox="0 0 28 28" fill="none" width="26" height="26"><rect x="2" y="2" width="24" height="24" rx="4" stroke="#FF5C35" strokeWidth="1.4"/><path d="M2 11h24" stroke="#FF5C35" strokeWidth="1.4"/><rect x="6" y="15" width="7" height="5" rx="1.5" fill="#FF5C35" fillOpacity=".15" stroke="#FF5C35" strokeWidth="1.2"/></svg>,t:"Alles im Dashboard",d:"WhatsApp, Telefon, Online — alles an einem Ort."},
              {icon:<svg viewBox="0 0 28 28" fill="none" width="26" height="26"><path d="M14 3v3M14 3a8 8 0 0 1 8 8c0 4-1.5 5.5-1.5 5.5H7.5S6 15 6 11A8 8 0 0 1 14 3Z" stroke="#FF5C35" strokeWidth="1.4" strokeLinejoin="round"/><path d="M10 19s0 4 4 4 4-4 4-4" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>,t:"Auto-Erinnerungen",d:"Gäste werden 24h und 2h vorher erinnert. No-Shows sinken auf fast null."},
              {icon:<svg viewBox="0 0 28 28" fill="none" width="26" height="26"><path d="M14 2C8.48 2 4 6.48 4 12c0 1.9.5 3.7 1.4 5.3L4 22l4.9-1.4C10.3 21.5 12.1 22 14 22c5.52 0 10-4.48 10-10S19.52 2 14 2z" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,t:"Eigene Nummer inklusive",d:"Wir stellen dir eine österreichische WhatsApp Nummer — kein Setup, einfach loslegen."},
            ].map((f,i)=>(
              <div key={i} className="soft-card" style={{background:"#fff",borderRadius:"14px",padding:"24px",border:"1px solid var(--border)"}}>
                <div style={{marginBottom:"14px"}}>{f.icon}</div>
                <div style={{fontSize:"14px",fontWeight:600,color:"var(--dark)",marginBottom:"6px"}}>{f.t}</div>
                <p style={{fontSize:"13px",color:"var(--muted)",lineHeight:1.6,fontWeight:300}}>{f.d}</p>
              </div>
            ))}
          </div>
          </Reveal>
        </div>
      </section>

      {/* WHATSAPP NUMMER SEKTION */}
      <section style={{background:"var(--dark)",padding:"104px 32px"}}>
        <Reveal>
        <div className="wa-section-grid" style={{maxWidth:"1100px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"72px",alignItems:"center"}}>
          <div>
            <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"#25D366",marginBottom:"14px"}}>Inklusive</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,38px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-0.8px",lineHeight:1.15,marginBottom:"20px"}}>
              Deine eigene<br/><span style={{color:"#25D366",fontStyle:"italic"}}>WhatsApp Nummer.</span>
            </h2>
            <p style={{color:"rgba(255,255,255,.55)",fontSize:"16px",lineHeight:1.8,fontWeight:300,marginBottom:"20px"}}>
              Wir stellen dir eine eigene österreichische WhatsApp Business Nummer zur Verfügung — vollständig eingerichtet, sofort einsatzbereit. Deine Gäste schreiben auf diese Nummer, die KI antwortet automatisch.
            </p>
            <p style={{color:"rgba(255,255,255,.55)",fontSize:"16px",lineHeight:1.8,fontWeight:300,marginBottom:"32px"}}>
              Deine private Nummer bleibt komplett unberührt. Kein Setup, kein technisches Wissen nötig — wir kümmern uns um alles.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              {[
                {t:"Eigene +43 Nummer",d:"Eine professionelle österreichische Nummer speziell für Reservierungen."},
                {t:"Sofort einsatzbereit",d:"Wir richten alles ein — du musst nichts tun."},
                {t:"Private Nummer bleibt privat",d:"Dein persönliches Handy bekommt keine Reservierungsanfragen mehr."},
                {t:"24/7 automatisch",d:"Die KI antwortet auch nachts, am Wochenende und an Feiertagen."},
              ].map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                  <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"rgba(37,211,102,.12)",border:"1px solid rgba(37,211,102,.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#25D366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <div style={{fontSize:"14px",fontWeight:600,color:"#FFFAF5",marginBottom:"2px"}}>{item.t}</div>
                    <div style={{fontSize:"13px",color:"rgba(255,255,255,.45)",fontWeight:300,lineHeight:1.5}}>{item.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{position:"relative"}}>
            <div className="wa-mockup" style={{position:"relative",zIndex:1,background:"#111B21",borderRadius:"14px",overflow:"hidden",boxShadow:"0 30px 70px rgba(0,0,0,.45)",border:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{background:"#202C33",padding:"12px 16px",display:"flex",alignItems:"center",gap:"10px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 1.5C5.3 1.5 1.5 5.3 1.5 10c0 1.5.4 2.9 1.1 4.2L1.5 18.5l4.4-1.1C7.1 18.1 8.5 18.5 10 18.5c4.7 0 8.5-3.8 8.5-8.5S14.7 1.5 10 1.5z" fill="white"/></svg>
                </div>
                <div>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#E9EDEF"}}>Alpengasthof</div>
                  <div style={{fontSize:"11px",color:"#8696A0"}}>+43 720 123 456 · Online</div>
                </div>
              </div>
              <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"10px",background:"#0B141A",minHeight:"280px"}}>
                <div style={{alignSelf:"flex-end",background:"#005C4B",padding:"8px 12px",borderRadius:"10px 10px 2px 10px",maxWidth:"75%"}}>
                  <div style={{fontSize:"13px",color:"#E9EDEF",lineHeight:1.5}}>Hallo! Ich möchte für Freitag 20. Mai einen Tisch für 4 Personen um 19 Uhr reservieren. Mein Name ist Maria Huber.</div>
                  <div style={{fontSize:"10px",color:"rgba(255,255,255,.4)",textAlign:"right",marginTop:"4px"}}>18:42</div>
                </div>
                <div style={{alignSelf:"flex-start",background:"#202C33",padding:"8px 12px",borderRadius:"10px 10px 10px 2px",maxWidth:"75%"}}>
                  <div style={{fontSize:"13px",color:"#E9EDEF",lineHeight:1.5}}>Hallo Frau Huber! Perfekt — ich habe einen Tisch für 4 Personen am Freitag, 20. Mai um 19:00 Uhr für Sie reserviert. Wir freuen uns auf Sie!</div>
                  <div style={{fontSize:"10px",color:"rgba(255,255,255,.4)",textAlign:"right",marginTop:"4px"}}>18:42</div>
                </div>
                <div style={{alignSelf:"flex-start",background:"#202C33",padding:"8px 12px",borderRadius:"10px 10px 10px 2px",maxWidth:"60%"}}>
                  <div style={{fontSize:"11px",color:"#8696A0",fontStyle:"italic"}}>Tablely KI · automatisch geantwortet</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      {/* BUCHUNGSWEGE SEKTION */}
      <section style={{background:"#F5F0EB",padding:"104px 32px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <Reveal>
          <div style={{textAlign:"center",marginBottom:"72px"}}>
            <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"14px"}}>Unsere Mission</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,5vw,46px)",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1.5px",lineHeight:1.08,marginBottom:"20px"}}>
              Wir geben Restaurants<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>ihre Zeit zurück.</span>
            </h2>
            <p style={{fontSize:"17px",color:"#6B6B80",fontWeight:300,maxWidth:"600px",margin:"0 auto",lineHeight:1.8}}>
              Tablely verbindet alle Buchungskanäle in einem System — WhatsApp, Online und Telefon. Deine Gäste buchen wie sie möchten. Du siehst alles an einem Ort.
            </p>
          </div>
          </Reveal>

          <Reveal>
          <div style={{background:"#1A1A2E",borderRadius:"16px",padding:"28px 36px",marginBottom:"72px",display:"flex",alignItems:"center",gap:"20px",flexWrap:"wrap"}}>
            <div style={{width:"44px",height:"44px",borderRadius:"10px",background:"rgba(255,92,53,.12)",border:"1px solid rgba(255,92,53,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2l2.4 7.4H21l-6.2 4.5 2.4 7.4L11 17l-6.2 3.8 2.4-7.4L1 9.4h7.6z" stroke="#FF5C35" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
            <div style={{flex:1,minWidth:"260px"}}>
              <div style={{fontSize:"15px",fontWeight:600,color:"#FFFAF5",marginBottom:"4px"}}>Wir sind der einzige Anbieter in Österreich der alle drei Kanäle vereint.</div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,.45)",fontWeight:300,lineHeight:1.6}}>WhatsApp KI + Online Buchung + KI Telefon — alles in einem Dashboard. Kein anderer Anbieter in Österreich macht das. Deine Gäste buchen dort wo sie sind — du hast alles im Blick.</div>
            </div>
          </div>
          </Reveal>

          <Reveal delay={80}>
          <div className="booking-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"32px",alignItems:"start"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
              <div style={{background:"#1A1A2E",borderRadius:"36px",padding:"10px",boxShadow:"0 30px 50px rgba(0,0,0,.2)",marginBottom:"28px",width:"280px"}}>
                <img src="/iphone_whatsapp.png" alt="WhatsApp KI" style={{width:"100%",borderRadius:"28px",display:"block"}}/>
              </div>
              <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(37,211,102,.08)",border:"1px solid rgba(37,211,102,.2)",borderRadius:"6px",padding:"4px 12px",marginBottom:"12px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#25D366"}}/>
                <span style={{fontSize:"11px",color:"#1A9D52",fontWeight:600}}>WhatsApp KI</span>
              </div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"#1A1A2E",marginBottom:"10px",letterSpacing:"-.5px"}}>Gäste schreiben —<br/>KI bucht automatisch</h3>
              <p style={{fontSize:"13px",color:"#6B6B80",lineHeight:1.7,fontWeight:300}}>Deine Gäste schreiben per WhatsApp wie mit einem Freund. Die KI versteht auch wenn jemand nicht perfekt schreibt — fragt nach was fehlt und bestätigt die Reservierung in Sekunden. Auch um Mitternacht.</p>
            </div>

            <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
              <div style={{background:"#1A1A2E",borderRadius:"36px",padding:"10px",boxShadow:"0 30px 50px rgba(0,0,0,.2)",marginBottom:"28px",width:"280px"}}>
                <img src="/iphone_bookingpage.png" alt="Online Buchung" style={{width:"100%",borderRadius:"28px",display:"block"}}/>
              </div>
              <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.2)",borderRadius:"6px",padding:"4px 12px",marginBottom:"12px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#818CF8"}}/>
                <span style={{fontSize:"11px",color:"#5B5FC7",fontWeight:600}}>Online Buchung</span>
              </div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"#1A1A2E",marginBottom:"10px",letterSpacing:"-.5px"}}>Deine eigene<br/>Buchungsseite</h3>
              <p style={{fontSize:"13px",color:"#6B6B80",lineHeight:1.7,fontWeight:300}}>Jedes Restaurant bekommt eine eigene Buchungsseite — deinen Link teilst du auf Instagram, Google oder deiner Website. Gäste wählen Datum, Uhrzeit und Personenzahl. Fertig in 30 Sekunden.</p>
            </div>

            <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",position:"relative"}}>
              <div style={{position:"relative",marginBottom:"28px",width:"280px"}}>
                <div style={{background:"#1A1A2E",borderRadius:"36px",padding:"10px",boxShadow:"0 30px 50px rgba(0,0,0,.2)",width:"280px"}}>
                  <img src="/iphone_tel.png" alt="KI Telefon" style={{width:"100%",borderRadius:"28px",display:"block",filter:"brightness(.6)"}}/>
                </div>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"36px"}}>
                  <div style={{background:"rgba(26,26,46,.92)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"8px",padding:"8px 14px",fontSize:"11px",fontWeight:600,color:"rgba(255,255,255,.7)"}}>
                    In Entwicklung
                  </div>
                </div>
              </div>
              <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(255,92,53,.08)",border:"1px solid rgba(255,92,53,.2)",borderRadius:"6px",padding:"4px 12px",marginBottom:"12px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35"}}/>
                <span style={{fontSize:"11px",color:"#FF5C35",fontWeight:600}}>KI Telefon · bald</span>
              </div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"#1A1A2E",marginBottom:"10px",letterSpacing:"-.5px"}}>KI nimmt Anrufe<br/>automatisch entgegen</h3>
              <p style={{fontSize:"13px",color:"#6B6B80",lineHeight:1.7,fontWeight:300}}>Kein Anruf geht mehr verloren. Die KI nimmt ab, versteht den Gast und trägt die Reservierung automatisch ein — egal wie voll es im Restaurant ist. Kommt bald.</p>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* PRODUKT BILD */}
      <section id="screenshots" style={{background:"#F5F0EB",padding:"80px 20px 0",overflow:"hidden"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <Reveal>
          <div style={{textAlign:"center",marginBottom:"40px"}}>
            <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"#FF5C35",marginBottom:"14px"}}>Das Produkt</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,38px)",fontWeight:700,letterSpacing:"-0.8px",color:"#1A1A2E",marginBottom:"12px"}}>Vom Gast direkt ins Dashboard.</h2>
            <p style={{color:"#6B6B80",fontSize:"16px",fontWeight:300,maxWidth:"480px",margin:"0 auto",lineHeight:1.7}}>Gäste buchen auf dem iPhone — du verwaltest alles auf dem Mac.</p>
          </div>
          </Reveal>
          <Reveal>
          <div style={{borderRadius:"16px 16px 0 0",overflow:"hidden",boxShadow:"0 -8px 50px rgba(26,26,46,.10)"}}>
            <img src="/mac_iohon.png" alt="Tablely Dashboard" style={{width:"100%",height:"auto",display:"block"}}/>
          </div>
          </Reveal>
        </div>
      </section>

      {/* DEMO CTA */}
      <section style={{background:"var(--cream)",padding:"72px 20px"}}>
        <Reveal>
        <div style={{maxWidth:"700px",margin:"0 auto",textAlign:"center",padding:"52px 32px",background:"var(--dark)",borderRadius:"16px"}}>
          <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"14px"}}>Noch nicht überzeugt?</div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,4vw,28px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-0.5px",marginBottom:"12px"}}>Dann probier es einfach aus.</h3>
          <p style={{fontSize:"15px",color:"rgba(255,255,255,.5)",fontWeight:300,marginBottom:"28px",lineHeight:1.7}}>
            Reserviere als Gast — sieh wie es sofort im Dashboard erscheint. Keine Anmeldung, kostenlos.
          </p>
          <a href="/demo" className="btn-hover-primary link-arrow" style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#FF5C35",color:"#fff",padding:"14px 30px",borderRadius:"8px",fontSize:"15px",fontWeight:500,textDecoration:"none"}}>
            Demo starten
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3.5 7.5h8M8 4l3.5 3.5L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>
        </Reveal>
      </section>

      {/* NUMBERS */}
      <div style={{background:"var(--dark)",padding:"96px 32px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <Reveal>
          <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"14px"}}>Was Tablely bewirkt</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,38px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-0.8px",marginBottom:"40px"}}>Zahlen die sprechen.</h2>
          <div className="numbers-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"14px",overflow:"hidden"}}>
            {[
              {v:"-60%",l:"weniger No-Shows durch automatische Erinnerungen"},
              {v:"2h",l:"täglich gespart — keine Reservierungsanrufe mehr"},
              {v:"24/7",l:"Buchungen annehmen — auch wenn du schläfst"},
            ].map((n,i)=>(
              <div key={i} className="number-item" style={{padding:"40px 32px",textAlign:"center",borderRight:i<2?"1px solid rgba(255,255,255,.08)":"none"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"48px",fontWeight:700,color:"var(--orange)",letterSpacing:"-1.5px",marginBottom:"10px"}}>{n.v}</div>
                <div style={{fontSize:"14px",color:"rgba(255,255,255,.45)",fontWeight:300,lineHeight:1.5}}>{n.l}</div>
              </div>
            ))}
          </div>
          </Reveal>
        </div>
      </div>

      {/* CTA SEKTION */}
      <section id="cta" style={{background:"#1A1A2E",padding:"96px 20px"}}>
        <Reveal>
        <div style={{maxWidth:"640px",margin:"0 auto",textAlign:"center"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.22)",borderRadius:"6px",padding:"5px 14px",marginBottom:"22px"}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0}}/>
            <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>Noch 5 von 10 Plätzen frei</span>
          </div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,5vw,40px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1px",lineHeight:1.12,marginBottom:"16px"}}>
            30 Tage gratis.<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>Nur für die ersten 10.</span>
          </h2>
          <p style={{color:"rgba(255,255,255,.5)",fontSize:"15px",lineHeight:1.75,fontWeight:300,marginBottom:"24px"}}>
            Die ersten 10 Restaurants testen alle Features 30 Tage kostenlos — danach 3 Monate mit <strong style={{color:"rgba(255,255,255,.75)",fontWeight:600}}>10% Rabatt</strong>. Ab dem 11. Restaurant gibt es nur noch 14 Tage ohne Vergünstigung.
          </p>
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",justifyContent:"center",marginBottom:"32px"}}>
            {["Online Buchungsseite","WhatsApp KI","Erinnerungen","Dashboard","Walk-in Assistent","KI Telefon (bald)"].map((f,i)=>{
              const isDev=f.includes("bald");
              return (
              <div key={i} style={{fontSize:"12px",fontWeight:500,padding:"6px 13px",borderRadius:"6px",background:isDev?"rgba(255,255,255,.04)":"rgba(255,92,53,.1)",color:isDev?"rgba(255,255,255,.35)":"#FF5C35",border:`1px solid ${isDev?"rgba(255,255,255,.08)":"rgba(255,92,53,.2)"}`}}>{f}</div>
            );})}
          </div>
          <button onClick={()=>setShowModal(true)} className="btn-hover-primary" style={{background:"#FF5C35",color:"#fff",border:"none",padding:"15px 34px",borderRadius:"8px",fontSize:"16px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginBottom:"14px"}}>
            30 Tage kostenlos testen
          </button>
          <p style={{fontSize:"12px",color:"rgba(255,255,255,.3)"}}>Keine Kreditkarte. Keine Verpflichtung.</p>
        </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer style={{padding:"28px 32px",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:700,color:"var(--dark)"}}>table<span style={{color:"var(--orange)"}}>ly</span></div>
        <div style={{display:"flex",gap:"24px"}}>
          {[["Presse","/presse"],["Impressum","/impressum"],["Datenschutz","/datenschutz"],["AGB","/agb"]].map(([l,h])=>(
            <a key={h} href={h} className="nav-link" style={{fontSize:"12px",color:"var(--muted)",textDecoration:"none"}}>{l}</a>
          ))}
        </div>
        <p style={{fontSize:"12px",color:"var(--muted)"}}>© 2026 Tablely · Michael Kleinlercher e.U.</p>
      </footer>

      {showModal && <RegisterModal onClose={()=>setShowModal(false)}/>}
      <CookieBanner />
    </>
  );
}