"use client";

import { useState, useEffect, useRef } from "react";

/* ============ HOOKS ============ */

function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return y;
}

/* ============ APPLE-STYLE REVEAL (Blur + Scale + Rise) ============ */

function Reveal({ children, delay = 0, y = 28 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const { ref, inView } = useInView(0.15);
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0) scale(1)" : `translateY(${y}px) scale(.985)`,
      filter: inView ? "blur(0px)" : "blur(8px)",
      transition: `opacity .9s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .9s cubic-bezier(.16,1,.3,1) ${delay}ms, filter .9s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      willChange: "opacity, transform, filter",
    }}>
      {children}
    </div>
  );
}

/* ============ INTERAKTIVE DEMOS ============ */

function TypingDots({ color = "#8696A0" }: { color?: string }) {
  return (
    <span style={{display:"inline-flex",gap:"4px",alignItems:"center",padding:"2px 0"}}>
      <span className="t-dot" style={{background:color,animationDelay:"0ms"}}/>
      <span className="t-dot" style={{background:color,animationDelay:"160ms"}}/>
      <span className="t-dot" style={{background:color,animationDelay:"320ms"}}/>
    </span>
  );
}

function FeatureChatDemo() {
  const { ref, inView } = useInView(0.45);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 1400);
    const t3 = setTimeout(() => setStep(3), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [inView]);
  const show = (n: number) => ({
    opacity: step >= n ? 1 : 0,
    transform: step >= n ? "translateY(0)" : "translateY(8px)",
    transition: "opacity .45s ease, transform .45s ease",
  });
  return (
    <div ref={ref} style={{background:"rgba(255,255,255,.04)",borderRadius:"16px",padding:"18px",border:"1px solid rgba(255,255,255,.06)",minHeight:"122px"}}>
      <div style={{...show(1),fontSize:"12px",padding:"9px 13px",borderRadius:"14px 14px 14px 3px",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.85)",maxWidth:"80%",marginBottom:"8px",lineHeight:1.5}}>Hallo! Tisch für 3 am Freitag um 19:30?</div>
      {step === 2 ? (
        <div style={{fontSize:"12px",padding:"9px 13px",borderRadius:"14px 14px 3px 14px",background:"#25D366",maxWidth:"62px",marginLeft:"auto",display:"flex",justifyContent:"center"}}>
          <TypingDots color="rgba(255,255,255,.85)"/>
        </div>
      ) : (
        <div style={{...show(3),fontSize:"12px",padding:"9px 13px",borderRadius:"14px 14px 3px 14px",background:"#25D366",color:"#fff",maxWidth:"80%",marginLeft:"auto",lineHeight:1.5}}>Perfekt! Tisch für 3 am Fr. 20.03. um 19:30 reserviert. Wir freuen uns auf euch!</div>
      )}
    </div>
  );
}

function WhatsAppChatDemo() {
  const { ref, inView } = useInView(0.35);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setStep(1), 500);
    const t2 = setTimeout(() => setStep(2), 1700);
    const t3 = setTimeout(() => setStep(3), 3300);
    const t4 = setTimeout(() => setStep(4), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [inView]);
  const show = (n: number) => ({
    opacity: step >= n ? 1 : 0,
    transform: step >= n ? "translateY(0)" : "translateY(8px)",
    transition: "opacity .45s ease, transform .45s ease",
  });
  return (
    <div ref={ref} style={{padding:"18px",display:"flex",flexDirection:"column",gap:"10px",background:"#0B141A",minHeight:"290px"}}>
      <div style={{...show(1),alignSelf:"flex-end",background:"#005C4B",padding:"9px 13px",borderRadius:"14px 14px 3px 14px",maxWidth:"75%"}}>
        <div style={{fontSize:"13px",color:"#E9EDEF",lineHeight:1.5}}>Hallo! Ich möchte für Freitag 20. Mai einen Tisch für 4 Personen um 19 Uhr reservieren. Mein Name ist Maria Huber.</div>
        <div style={{fontSize:"10px",color:"rgba(255,255,255,.4)",textAlign:"right",marginTop:"4px"}}>18:42</div>
      </div>
      {step === 2 && (
        <div style={{alignSelf:"flex-start",background:"#202C33",padding:"11px 15px",borderRadius:"14px 14px 14px 3px"}}>
          <TypingDots/>
        </div>
      )}
      <div style={{...show(3),alignSelf:"flex-start",background:"#202C33",padding:"9px 13px",borderRadius:"14px 14px 14px 3px",maxWidth:"75%",display:step>=3?"block":"none"}}>
        <div style={{fontSize:"13px",color:"#E9EDEF",lineHeight:1.5}}>Hallo Frau Huber! Perfekt — ich habe einen Tisch für 4 Personen am Freitag, 20. Mai um 19:00 Uhr für Sie reserviert. Wir freuen uns auf Sie!</div>
        <div style={{fontSize:"10px",color:"rgba(255,255,255,.4)",textAlign:"right",marginTop:"4px"}}>18:42</div>
      </div>
      <div style={{...show(4),alignSelf:"flex-start",background:"#202C33",padding:"8px 12px",borderRadius:"14px 14px 14px 3px",maxWidth:"60%"}}>
        <div style={{fontSize:"11px",color:"#8696A0",fontStyle:"italic"}}>Tablely KI · automatisch geantwortet</div>
      </div>
    </div>
  );
}

function PhoneSteps() {
  const { ref, inView } = useInView(0.45);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    if (!inView) return;
    setActive(0);
    const iv = setInterval(() => setActive(a => (a + 1) % 3), 1500);
    return () => clearInterval(iv);
  }, [inView]);
  const rows: [string, string][] = [["Gast ruft an","KI nimmt ab"],["Tisch, Zeit, Personen","KI versteht alles"],["Reservierung","Automatisch gespeichert"]];
  return (
    <div ref={ref} style={{background:"#FAF7F2",borderRadius:"16px",padding:"18px",border:"1px solid #F0EBE3"}}>
      {rows.map(([l,r],i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 10px",margin:"0 -10px",borderBottom:i<2?"1px solid #F0EBE3":"none",fontSize:"12px",borderRadius:"8px",background:active===i?"rgba(255,92,53,.06)":"transparent",transition:"background .4s ease"}}>
          <span style={{color:active===i?"#1A1A2E":"#6B6B80",transition:"color .4s ease",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{width:"5px",height:"5px",borderRadius:"50%",background:active===i?"#FF5C35":"#D9D2C8",transition:"background .4s ease",flexShrink:0}}/>
            {l}
          </span>
          <span style={{color:active===i?"#FF5C35":"#1A1A2E",fontWeight:600,transition:"color .4s ease"}}>{r}</span>
        </div>
      ))}
    </div>
  );
}

function CountUp({ end, prefix = "", suffix = "", duration = 1300 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const { ref, inView } = useInView(0.6);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    let raf = 0;
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);
  return <span ref={ref as React.RefObject<HTMLDivElement>} style={{display:"inline-block"}}>{prefix}{val}{suffix}</span>;
}

/* ============ REGISTER MODAL ============ */

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
    <div style={{position:"fixed",inset:0,background:"rgba(26,26,46,.5)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:"20px",fontFamily:"'DM Sans',sans-serif"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#FFFAF5",borderRadius:"24px",padding:"40px",width:"100%",maxWidth:"430px",boxShadow:"0 32px 90px rgba(26,26,46,.25)"}}>
        {status==="success" ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"#E8F8F1",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#25C281" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#1A1A2E",marginBottom:"10px"}}>Konto erstellt</h2>
            <p style={{color:"#6B6B80",fontSize:"14px",lineHeight:1.7,marginBottom:"22px"}}>Bestätigungsmail wurde an <strong>{email}</strong> gesendet.</p>
            <button onClick={onClose} className="btn-hover-primary" style={{background:"#FF5C35",color:"#fff",border:"none",padding:"13px 32px",borderRadius:"100px",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>Schließen</button>
          </div>
        ) : (
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"23px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-0.3px"}}>6 Monate gratis sichern</h2>
              <button onClick={onClose} style={{background:"transparent",border:"none",color:"#6B6B80",cursor:"pointer",fontSize:"20px",lineHeight:1}}>✕</button>
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(255,92,53,.07)",borderRadius:"100px",padding:"5px 13px",marginBottom:"22px"}}>
              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#FF5C35"}}/>
              <span style={{fontSize:"11px",color:"#FF5C35",fontWeight:600}}>Nur die ersten 3 Restaurants</span>
            </div>
            <button onClick={handleGoogleLogin} className="btn-hover-light" style={{
              width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
              padding:"13px",borderRadius:"100px",border:"1px solid #EAE4DA",background:"#fff",
              fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:"#1A1A2E",
              marginBottom:"14px",transition:"all .2s",
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Mit Google registrieren
            </button>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
              <div style={{flex:1,height:"1px",background:"#F0EBE3"}}/>
              <span style={{fontSize:"12px",color:"#6B6B80"}}>oder mit E-Mail</span>
              <div style={{flex:1,height:"1px",background:"#F0EBE3"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"14px"}}>
              <input className="input-soft" type="text" placeholder="Dein Name" value={name} onChange={e=>setName(e.target.value)} disabled={status==="loading"}/>
              <input className="input-soft" type="email" placeholder="deine@email.at" value={email} onChange={e=>setEmail(e.target.value)} disabled={status==="loading"}/>
              <input className="input-soft" type="password" placeholder="Passwort (min. 8 Zeichen)" value={password} onChange={e=>setPassword(e.target.value)} disabled={status==="loading"} onKeyDown={e=>e.key==="Enter"&&handleRegister()}/>
            </div>
            {errorMsg && <p style={{color:"#E24B4A",fontSize:"13px",marginBottom:"10px"}}>{errorMsg}</p>}
            <button onClick={handleRegister} disabled={status==="loading"} className="btn-hover-primary" style={{width:"100%",background:"#FF5C35",color:"#fff",border:"none",padding:"15px",borderRadius:"100px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:status==="loading"?0.7:1,marginBottom:"14px"}}>
              {status==="loading" ? "Wird registriert..." : "Kostenlos starten"}
            </button>
            <p style={{fontSize:"11px",color:"#6B6B80",textAlign:"center",lineHeight:1.6}}>
              Die ersten 3 Restaurants: 6 Monate gratis + persönliche Betreuung.<br/>
              Alle Features außer KI Telefon (in Entwicklung).
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ============ COOKIE BANNER ============ */

function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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
    <div style={{position:"fixed",left:"20px",right:"20px",bottom:"20px",zIndex:600,display:"flex",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",pointerEvents:"none"}}>
      <div style={{
        pointerEvents:"auto",
        background:"rgba(255,250,245,.92)",backdropFilter:"blur(20px)",
        border:"1px solid rgba(240,235,227,.9)",borderRadius:"20px",
        boxShadow:"0 20px 60px rgba(26,26,46,.16)",padding:"22px 26px",
        maxWidth:"720px",width:"100%",
        display:"flex",alignItems:"center",gap:"24px",flexWrap:"wrap",
      }}>
        <div style={{flex:1,minWidth:"240px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
            <div style={{width:"22px",height:"22px",borderRadius:"7px",background:"rgba(255,92,53,.08)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#FF5C35" strokeWidth="1.2"/><circle cx="4.5" cy="5" r=".8" fill="#FF5C35"/><circle cx="7.5" cy="7" r=".8" fill="#FF5C35"/><circle cx="5" cy="8" r=".6" fill="#FF5C35"/></svg>
            </div>
            <span style={{fontSize:"14px",fontWeight:600,color:"#1A1A2E"}}>Wir verwenden Cookies</span>
          </div>
          <p style={{fontSize:"13px",color:"#6B6B80",lineHeight:1.6,fontWeight:300}}>
            Wir nutzen notwendige Cookies, damit die Seite funktioniert, sowie optionale Cookies um die Nutzung zu analysieren und Tablely zu verbessern. Du kannst selbst entscheiden. Mehr dazu in unserer{" "}
            <a href="/datenschutz" style={{color:"#FF5C35",textDecoration:"none",fontWeight:500}}>Datenschutzerklärung</a>.
          </p>
        </div>
        <div style={{display:"flex",gap:"10px",flexShrink:0}}>
          <button onClick={()=>decide("declined")} className="btn-hover-light" style={{
            background:"#fff",color:"#1A1A2E",border:"1px solid #EAE4DA",
            padding:"11px 20px",borderRadius:"100px",fontSize:"13px",fontWeight:500,
            cursor:"pointer",fontFamily:"inherit",transition:"all .2s",
          }}>
            Nur notwendige
          </button>
          <button onClick={()=>decide("accepted")} className="btn-hover-primary" style={{
            background:"#FF5C35",color:"#fff",border:"none",
            padding:"11px 22px",borderRadius:"100px",fontSize:"13px",fontWeight:500,
            cursor:"pointer",fontFamily:"inherit",
          }}>
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ PILOT-POPUP (automatisch beim Betreten) ============ */

function PilotPopup({ onClose, onRegister }: { onClose: () => void; onRegister: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{
      position:"fixed",inset:0,zIndex:700,
      background:"rgba(26,26,46,.5)",backdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",
      fontFamily:"'DM Sans',sans-serif",
      opacity:show?1:0,transition:"opacity .4s ease",
    }}>
      <div style={{
        position:"relative",background:"var(--dark)",borderRadius:"26px",
        padding:"clamp(34px,5vw,52px)",width:"100%",maxWidth:"520px",
        boxShadow:"0 40px 100px rgba(0,0,0,.5)",overflow:"hidden",textAlign:"center",
        transform:show?"translateY(0) scale(1)":"translateY(16px) scale(.96)",
        transition:"transform .5s cubic-bezier(.16,1,.3,1)",
      }}>
        {/* Schließen-Button oben links */}
        <button onClick={onClose} aria-label="Schließen" style={{
          position:"absolute",top:"18px",left:"18px",zIndex:2,
          width:"32px",height:"32px",borderRadius:"50%",
          background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",
          color:"rgba(255,255,255,.7)",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:"inherit",transition:"background .2s ease",
        }}
        onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,.16)")}
        onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,.08)")}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>

        <div style={{position:"absolute",top:"-160px",right:"-120px",width:"420px",height:"420px",background:"radial-gradient(circle,rgba(255,92,53,.16) 0%,transparent 65%)",pointerEvents:"none"}}/>

        <div style={{position:"relative"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:"rgba(255,92,53,.12)",borderRadius:"100px",padding:"6px 15px",marginBottom:"22px"}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0}}/>
            <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>Nur die ersten 3 Restaurants</span>
          </div>

          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,36px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1.2px",lineHeight:1.12,marginBottom:"18px"}}>
            6 Monate gratis —<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>persönlich betreut.</span>
          </h2>

          <p style={{color:"rgba(255,255,255,.6)",fontSize:"15.5px",lineHeight:1.75,fontWeight:300,maxWidth:"400px",margin:"0 auto 28px"}}>
            Die ersten 3 Restaurants, die sich anmelden, bekommen Tablely 6 Monate komplett kostenlos — inklusive vollständiger Betreuung und Einrichtung österreichweit durch mich persönlich.
          </p>

          <div style={{display:"flex",flexDirection:"column",gap:"11px",marginBottom:"30px",textAlign:"left",maxWidth:"340px",marginLeft:"auto",marginRight:"auto"}}>
            {[
              "6 Monate Tablely komplett gratis",
              "Persönliche Einrichtung & Betreuung",
              "Österreichweit — direkt vom Gründer",
            ].map((t,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"11px"}}>
                <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"rgba(255,92,53,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#FF5C35" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{fontSize:"14px",color:"rgba(255,255,255,.85)",fontWeight:500}}>{t}</span>
              </div>
            ))}
          </div>

          <button onClick={onRegister} className="btn-hover-primary" style={{
            width:"100%",background:"#FF5C35",color:"#fff",border:"none",
            padding:"16px",borderRadius:"100px",fontSize:"16px",fontWeight:500,
            cursor:"pointer",fontFamily:"inherit",marginBottom:"14px",
          }}>
            Jetzt Platz sichern
          </button>
          <button onClick={onClose} style={{
            background:"transparent",border:"none",color:"rgba(255,255,255,.4)",
            fontSize:"13px",cursor:"pointer",fontFamily:"inherit",
          }}>
            Vielleicht später
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ PAGE ============ */

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showPilot, setShowPilot] = useState(true);
  const scrollY = useScrollY();
  const navScrolled = scrollY > 8;
  // Sanfte Parallaxe für das Hero-Mockup
  const heroShift = Math.min(scrollY * 0.06, 36);
  const heroScale = 1 + Math.min(scrollY / 6000, 0.02);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--orange:#FF5C35;--dark:#1A1A2E;--cream:#FFFAF5;--muted:#6B6B80;--border:#F0EBE3;}
        html{scroll-behavior:smooth;}
        body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--dark);overflow-x:hidden;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
        ::selection{background:rgba(255,92,53,.18);}

        .btn-hover-primary{transition:transform .25s cubic-bezier(.16,1,.3,1), background .2s ease, box-shadow .25s ease;}
        .btn-hover-primary:hover{background:#F04E28!important;transform:scale(1.02);box-shadow:0 10px 30px rgba(255,92,53,.25);}
        .btn-hover-primary:active{transform:scale(.99);}
        .btn-hover-light:hover{border-color:#D9D2C8!important;background:#FBF8F3!important;}
        .btn-ghost{transition:border-color .2s ease, background .2s ease;}
        .btn-ghost:hover{border-color:rgba(255,255,255,.45)!important;background:rgba(255,255,255,.05)!important;}
        .nav-link{transition:color .2s ease;}
        .nav-link:hover{color:var(--dark)!important;}
        .nav-cta{transition:background .25s ease,color .25s ease,transform .25s cubic-bezier(.16,1,.3,1);}
        .nav-cta:hover{background:var(--orange)!important;border-color:var(--orange)!important;color:#fff!important;transform:scale(1.03);}

        .soft-card{transition:transform .45s cubic-bezier(.16,1,.3,1), box-shadow .45s cubic-bezier(.16,1,.3,1);}
        .soft-card:hover{transform:translateY(-5px);box-shadow:0 24px 60px rgba(26,26,46,.10);}

        .input-soft{width:100%;padding:13px 16px;border:1px solid #EAE4DA;border-radius:14px;font-size:14px;font-family:inherit;background:#fff;color:#1A1A2E;outline:none;transition:border-color .2s ease, box-shadow .2s ease;}
        .input-soft:focus{border-color:#FF5C35;box-shadow:0 0 0 3px rgba(255,92,53,.1);}

        @keyframes dotPulse{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}
        .t-dot{width:5px;height:5px;border-radius:50%;display:inline-block;animation:dotPulse 1.2s infinite;}

        .link-arrow{transition:gap .25s cubic-bezier(.16,1,.3,1);}
        .link-arrow:hover{gap:13px!important;}

        @media(max-width:768px){
          .hero-h1{font-size:46px!important;letter-spacing:-1.5px!important;}
          .hero-sub{font-size:16px!important;}
          .pain-grid{grid-template-columns:1fr!important;gap:44px!important;}
          .feat-big-grid{grid-template-columns:1fr!important;}
          .feat-mini-grid{grid-template-columns:1fr 1fr!important;}
          .numbers-grid{grid-template-columns:1fr!important;}
          .number-item{border-right:none!important;border-bottom:1px solid rgba(255,255,255,.08)!important;}
          .wa-section-grid{grid-template-columns:1fr!important;gap:48px!important;}
          .wa-mockup-col{display:none!important;}
          .booking-grid{grid-template-columns:1fr!important;gap:48px!important;}
          .demo-split{grid-template-columns:1fr!important;gap:44px!important;}
          .nav-links-hide{display:none!important;}
          .statement-h{font-size:34px!important;letter-spacing:-1px!important;}
        }
      `}</style>

      {/* ===== NAV (Glas, verdichtet beim Scrollen) ===== */}
      <nav style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding: navScrolled ? "12px 32px" : "18px 32px",
        position:"sticky",top:0,zIndex:100,
        background: navScrolled ? "rgba(255,250,245,.82)" : "rgba(255,250,245,.6)",
        backdropFilter:"blur(24px) saturate(1.4)",
        borderBottom: navScrolled ? "1px solid rgba(240,235,227,.9)" : "1px solid transparent",
        transition:"padding .35s cubic-bezier(.16,1,.3,1), background .35s ease, border-color .35s ease",
      }}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.5px"}}>table<span style={{color:"var(--orange)"}}>ly</span></div>
        <div style={{display:"flex",alignItems:"center",gap:"30px"}}>
          <div className="nav-links-hide" style={{display:"flex",gap:"30px",alignItems:"center"}}>
            {[["#features","Funktionen"],["#screenshots","App"],["/presse","Presse"],["/demo","Demo"]].map(([h,l])=>(
              <a key={h} href={h} className="nav-link" style={{textDecoration:"none",color:"var(--muted)",fontSize:"14px",fontWeight:500}}>{l}</a>
            ))}
          </div>
          <button className="nav-cta" onClick={()=>setShowModal(true)} style={{background:"var(--dark)",color:"#fff",border:"1px solid var(--dark)",padding:"9px 20px",borderRadius:"100px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
            Jetzt testen
          </button>
        </div>
      </nav>

      {/* ===== HERO (zentriert, Apple-Bühne) ===== */}
      <div style={{background:"var(--dark)",overflow:"hidden",position:"relative",marginTop:"-73px",paddingTop:"73px"}}>
        <div style={{position:"absolute",top:"-260px",left:"50%",transform:"translateX(-50%)",width:"900px",height:"700px",background:"radial-gradient(ellipse at center,rgba(255,92,53,.13) 0%,transparent 65%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:"1100px",margin:"0 auto",padding:"110px 24px 0",textAlign:"center",position:"relative"}}>
          <Reveal y={20}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,92,53,.1)",borderRadius:"100px",padding:"7px 16px",marginBottom:"30px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0}}/>
              <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600,letterSpacing:"0.2px"}}>Die ersten 3 Restaurants — 6 Monate gratis, persönlich betreut</span>
            </div>
          </Reveal>
          <Reveal y={26} delay={80}>
            <h1 className="hero-h1" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(52px,7.5vw,88px)",fontWeight:700,lineHeight:1.02,letterSpacing:"-3px",color:"#FFFAF5",marginBottom:"26px"}}>
              Kein Anruf. Kein Buch.<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>Kein Chaos.</span>
            </h1>
          </Reveal>
          <Reveal y={24} delay={160}>
            <p className="hero-sub" style={{color:"rgba(255,255,255,.6)",fontSize:"18px",lineHeight:1.75,fontWeight:300,margin:"0 auto 40px",maxWidth:"560px"}}>
              Stoßzeit. Küche brennt. Telefon klingelt. Dein Kellner blättert im Reservierungsbuch — 3 Minuten für eine Reservierung. <strong style={{color:"rgba(255,255,255,.9)",fontWeight:500}}>Tablely macht das in 3 Sekunden.</strong>
            </p>
          </Reveal>
          <Reveal y={22} delay={240}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"14px",flexWrap:"wrap",marginBottom:"14px"}}>
              <button className="btn-hover-primary" onClick={()=>setShowModal(true)} style={{background:"#FF5C35",color:"#fff",border:"none",padding:"16px 34px",borderRadius:"100px",fontSize:"16px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
                30 Tage kostenlos testen
              </button>
              <a href="/demo" className="btn-ghost link-arrow" style={{display:"inline-flex",alignItems:"center",gap:"9px",background:"transparent",color:"#FFFAF5",border:"1px solid rgba(255,255,255,.25)",padding:"15px 28px",borderRadius:"100px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",textDecoration:"none"}}>
                Live Demo ansehen
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3.5 7.5h8M8 4l3.5 3.5L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,.35)"}}>Keine Kreditkarte · Demo ohne Anmeldung</div>
          </Reveal>
        </div>

        {/* Dashboard-Bühne mit sanfter Parallaxe */}
        <div style={{maxWidth:"1020px",margin:"64px auto 0",padding:"0 24px 96px",position:"relative"}}>
          <Reveal y={40} delay={150}>
            <div style={{
              transform:`translateY(${heroShift}px) scale(${heroScale})`,
              transition:"transform .1s linear",
              background:"#1E1E2E",borderRadius:"18px",overflow:"hidden",
              boxShadow:"0 60px 140px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.07)",
            }}>
              <div style={{background:"#2A2A3E",padding:"11px 16px",display:"flex",alignItems:"center",gap:"8px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{display:"flex",gap:"6px"}}>
                  {["#FF5F57","#FEBC2E","#28C840"].map((c,i)=><div key={i} style={{width:"11px",height:"11px",borderRadius:"50%",background:c}}/>)}
                </div>
                <div style={{flex:1,maxWidth:"320px",margin:"0 auto",background:"rgba(255,255,255,.05)",borderRadius:"6px",padding:"5px 12px",fontSize:"10px",color:"rgba(255,255,255,.3)",textAlign:"center"}}>tablely.at/dashboard</div>
                <div style={{width:"47px"}}/>
              </div>
              <img src="/dashboard-dunkel.png" alt="Tablely Dashboard" style={{width:"100%",height:"auto",display:"block"}}/>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ===== PAIN ===== */}
      <section style={{background:"var(--cream)",padding:"130px 32px"}}>
        <div className="pain-grid" style={{maxWidth:"1080px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"center"}}>
          <Reveal>
            <div style={{background:"#fff",borderRadius:"24px",padding:"34px",boxShadow:"0 2px 6px rgba(26,26,46,.03), 0 24px 60px rgba(26,26,46,.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:"9px",marginBottom:"22px"}}>
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
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"13px",padding:"14px 0",borderBottom:i<arr.length-1?"1px solid var(--border)":"none"}}>
                  <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"#FEE8E8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </div>
                  <div>
                    <div style={{fontSize:"13.5px",fontWeight:500,color:"var(--dark)",marginBottom:"2px"}}>{s.t}</div>
                    <div style={{fontSize:"12.5px",color:"var(--muted)",lineHeight:1.55}}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <div style={{fontSize:"12px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1.5px",color:"var(--orange)",marginBottom:"16px"}}>Das Problem</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(30px,4vw,44px)",fontWeight:700,letterSpacing:"-1.3px",lineHeight:1.1,marginBottom:"22px"}}>Das Reservierungsbuch kostet dich täglich Geld.</h2>
              <p style={{color:"var(--muted)",fontSize:"17px",lineHeight:1.85,fontWeight:300,marginBottom:"16px"}}>Jeder Anruf während der Stoßzeit ist eine Ablenkung. Jede Minute im Buch blättern ist verschwendete Zeit.</p>
              <p style={{color:"var(--muted)",fontSize:"17px",lineHeight:1.85,fontWeight:300}}>Österreichische Restaurants verlieren täglich bis zu <strong style={{color:"var(--dark)",fontWeight:600}}>2 Stunden</strong> durch manuelle Reservierungen. Tablely gibt dir diese Zeit zurück.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== STATEMENT (große Typo-Bühne) ===== */}
      <section style={{background:"#F5F0EB",padding:"150px 32px"}}>
        <div style={{maxWidth:"900px",margin:"0 auto",textAlign:"center"}}>
          <Reveal>
            <div style={{fontSize:"12px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1.5px",color:"var(--orange)",marginBottom:"22px"}}>Unsere Mission</div>
            <h2 className="statement-h" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(38px,6vw,64px)",fontWeight:700,color:"#1A1A2E",letterSpacing:"-2.5px",lineHeight:1.06,marginBottom:"28px"}}>
              Wir geben Restaurants<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>ihre Zeit zurück.</span>
            </h2>
            <p style={{fontSize:"18px",color:"#6B6B80",fontWeight:300,maxWidth:"620px",margin:"0 auto 44px",lineHeight:1.85}}>
              Tablely verbindet alle Buchungskanäle in einem System — WhatsApp, Online und Telefon. Deine Gäste buchen wie sie möchten. Du siehst alles an einem Ort.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"16px",background:"#1A1A2E",borderRadius:"100px",padding:"14px 28px 14px 18px",textAlign:"left"}}>
              <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,92,53,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M11 2l2.4 7.4H21l-6.2 4.5 2.4 7.4L11 17l-6.2 3.8 2.4-7.4L1 9.4h7.6z" stroke="#FF5C35" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              </div>
              <div style={{fontSize:"14px",fontWeight:500,color:"#FFFAF5",lineHeight:1.5}}>Der einzige Anbieter in Österreich, der alle drei Kanäle vereint.</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FEATURES (Bento) ===== */}
      <section id="features" style={{background:"var(--cream)",padding:"130px 32px"}}>
        <div style={{maxWidth:"1080px",margin:"0 auto"}}>
          <Reveal>
            <div style={{textAlign:"center",marginBottom:"70px"}}>
              <div style={{fontSize:"12px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1.5px",color:"var(--orange)",marginBottom:"16px"}}>Wie es funktioniert</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(30px,4.5vw,48px)",fontWeight:700,letterSpacing:"-1.5px",lineHeight:1.08,marginBottom:"18px"}}>Drei Wege zu buchen.<br/>Ein Dashboard für alles.</h2>
              <p style={{color:"var(--muted)",fontSize:"17px",fontWeight:300,maxWidth:"480px",margin:"0 auto"}}>WhatsApp, Telefon oder online — deine Gäste wählen wie sie buchen.</p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="feat-big-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"18px",marginBottom:"18px"}}>
              <div className="soft-card" style={{background:"var(--dark)",borderRadius:"24px",padding:"36px"}}>
                <div style={{background:"rgba(255,92,53,.12)",borderRadius:"100px",padding:"4px 13px",fontSize:"10px",fontWeight:600,textTransform:"uppercase",letterSpacing:".8px",color:"#FF5C35",display:"inline-block",marginBottom:"22px"}}>WhatsApp KI</div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#FFFAF5",marginBottom:"12px",letterSpacing:"-0.5px"}}>Gäste schreiben — KI antwortet und bucht</h3>
                <p style={{color:"rgba(255,255,255,.5)",fontSize:"14.5px",lineHeight:1.7,fontWeight:300,marginBottom:"26px"}}>Deine Gäste schreiben per WhatsApp. Die KI versteht alles, antwortet in Sekunden und trägt die Reservierung automatisch ein.</p>
                <FeatureChatDemo/>
              </div>
              <div className="soft-card" style={{background:"#fff",borderRadius:"24px",padding:"36px",boxShadow:"0 2px 6px rgba(26,26,46,.03)"}}>
                <div style={{background:"rgba(255,92,53,.08)",borderRadius:"100px",padding:"4px 13px",fontSize:"10px",fontWeight:600,textTransform:"uppercase",letterSpacing:".8px",color:"#FF5C35",display:"inline-block",marginBottom:"22px"}}>KI Telefon</div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"var(--dark)",marginBottom:"12px",letterSpacing:"-0.5px"}}>KI nimmt Anrufe entgegen — automatisch</h3>
                <p style={{color:"var(--muted)",fontSize:"14.5px",lineHeight:1.7,fontWeight:300,marginBottom:"26px"}}>Kein Anruf geht verloren. Die KI nimmt ab, versteht den Gast und trägt alles ein.</p>
                <PhoneSteps/>
              </div>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="feat-mini-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"18px"}}>
              {[
                {icon:<svg viewBox="0 0 28 28" fill="none" width="26" height="26"><rect x="3" y="5" width="22" height="18" rx="3" stroke="#FF5C35" strokeWidth="1.4"/><path d="M3 11h22M9 4v3M19 4v3" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>,t:"Online Buchung",d:"Eigene Booking Page — Gäste buchen direkt rund um die Uhr."},
                {icon:<svg viewBox="0 0 28 28" fill="none" width="26" height="26"><rect x="2" y="2" width="24" height="24" rx="4" stroke="#FF5C35" strokeWidth="1.4"/><path d="M2 11h24" stroke="#FF5C35" strokeWidth="1.4"/><rect x="6" y="15" width="7" height="5" rx="1.5" fill="#FF5C35" fillOpacity=".15" stroke="#FF5C35" strokeWidth="1.2"/></svg>,t:"Alles im Dashboard",d:"WhatsApp, Telefon, Online — alles an einem Ort."},
                {icon:<svg viewBox="0 0 28 28" fill="none" width="26" height="26"><path d="M14 3v3M14 3a8 8 0 0 1 8 8c0 4-1.5 5.5-1.5 5.5H7.5S6 15 6 11A8 8 0 0 1 14 3Z" stroke="#FF5C35" strokeWidth="1.4" strokeLinejoin="round"/><path d="M10 19s0 4 4 4 4-4 4-4" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>,t:"Auto-Erinnerungen",d:"Gäste werden 24h und 2h vorher erinnert. No-Shows sinken auf fast null."},
                {icon:<svg viewBox="0 0 28 28" fill="none" width="26" height="26"><path d="M14 2C8.48 2 4 6.48 4 12c0 1.9.5 3.7 1.4 5.3L4 22l4.9-1.4C10.3 21.5 12.1 22 14 22c5.52 0 10-4.48 10-10S19.52 2 14 2z" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,t:"Eigene Nummer inklusive",d:"Wir stellen dir eine österreichische WhatsApp Nummer — kein Setup, einfach loslegen."},
              ].map((f,i)=>(
                <div key={i} className="soft-card" style={{background:"#fff",borderRadius:"20px",padding:"26px",boxShadow:"0 2px 6px rgba(26,26,46,.03)"}}>
                  <div style={{marginBottom:"16px"}}>{f.icon}</div>
                  <div style={{fontSize:"14.5px",fontWeight:600,color:"var(--dark)",marginBottom:"6px"}}>{f.t}</div>
                  <p style={{fontSize:"13px",color:"var(--muted)",lineHeight:1.65,fontWeight:300}}>{f.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== WHATSAPP NUMMER ===== */}
      <section style={{background:"var(--dark)",padding:"130px 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",bottom:"-260px",right:"-180px",width:"640px",height:"640px",background:"radial-gradient(circle,rgba(37,211,102,.07) 0%,transparent 65%)",pointerEvents:"none"}}/>
        <div className="wa-section-grid" style={{maxWidth:"1080px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"center",position:"relative"}}>
          <Reveal>
            <div>
              <div style={{fontSize:"12px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1.5px",color:"#25D366",marginBottom:"16px"}}>Inklusive</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(30px,4vw,44px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1.3px",lineHeight:1.1,marginBottom:"22px"}}>
                Deine eigene<br/><span style={{color:"#25D366",fontStyle:"italic"}}>WhatsApp Nummer.</span>
              </h2>
              <p style={{color:"rgba(255,255,255,.55)",fontSize:"16px",lineHeight:1.85,fontWeight:300,marginBottom:"18px"}}>
                Wir stellen dir eine eigene österreichische WhatsApp Business Nummer zur Verfügung — vollständig eingerichtet, sofort einsatzbereit. Deine Gäste schreiben auf diese Nummer, die KI antwortet automatisch.
              </p>
              <p style={{color:"rgba(255,255,255,.55)",fontSize:"16px",lineHeight:1.85,fontWeight:300,marginBottom:"34px"}}>
                Deine private Nummer bleibt komplett unberührt. Kein Setup, kein technisches Wissen nötig — wir kümmern uns um alles.
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:"17px"}}>
                {[
                  {t:"Eigene +43 Nummer",d:"Eine professionelle österreichische Nummer speziell für Reservierungen."},
                  {t:"Sofort einsatzbereit",d:"Wir richten alles ein — du musst nichts tun."},
                  {t:"Private Nummer bleibt privat",d:"Dein persönliches Handy bekommt keine Reservierungsanfragen mehr."},
                  {t:"24/7 automatisch",d:"Die KI antwortet auch nachts, am Wochenende und an Feiertagen."},
                ].map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"13px"}}>
                    <div style={{width:"21px",height:"21px",borderRadius:"50%",background:"rgba(37,211,102,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#25D366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div>
                      <div style={{fontSize:"14.5px",fontWeight:600,color:"#FFFAF5",marginBottom:"2px"}}>{item.t}</div>
                      <div style={{fontSize:"13px",color:"rgba(255,255,255,.45)",fontWeight:300,lineHeight:1.55}}>{item.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="wa-mockup-col" style={{position:"relative"}}>
              <div style={{position:"relative",zIndex:1,background:"#111B21",borderRadius:"22px",overflow:"hidden",boxShadow:"0 50px 110px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05)"}}>
                <div style={{background:"#202C33",padding:"13px 17px",display:"flex",alignItems:"center",gap:"11px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                  <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 1.5C5.3 1.5 1.5 5.3 1.5 10c0 1.5.4 2.9 1.1 4.2L1.5 18.5l4.4-1.1C7.1 18.1 8.5 18.5 10 18.5c4.7 0 8.5-3.8 8.5-8.5S14.7 1.5 10 1.5z" fill="white"/></svg>
                  </div>
                  <div>
                    <div style={{fontSize:"13px",fontWeight:600,color:"#E9EDEF"}}>Alpengasthof</div>
                    <div style={{fontSize:"11px",color:"#8696A0"}}>+43 720 123 456 · Online</div>
                  </div>
                </div>
                <WhatsAppChatDemo/>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== BUCHUNGSWEGE (3 iPhones) ===== */}
      <section style={{background:"#F5F0EB",padding:"130px 32px"}}>
        <div style={{maxWidth:"1080px",margin:"0 auto"}}>
          <Reveal>
            <div style={{textAlign:"center",marginBottom:"76px"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(30px,4.5vw,48px)",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1.5px",lineHeight:1.08}}>
                Deine Gäste buchen,<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>wie sie möchten.</span>
              </h2>
            </div>
          </Reveal>

          <div className="booking-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"36px",alignItems:"start"}}>
            {[
              {
                img:"/iphone_whatsapp.png", alt:"WhatsApp KI", dev:false,
                dotColor:"#25D366", labelColor:"#1A9D52", label:"WhatsApp KI", labelBg:"rgba(37,211,102,.08)",
                h:<>Gäste schreiben —<br/>KI bucht automatisch</>,
                p:"Deine Gäste schreiben per WhatsApp wie mit einem Freund. Die KI versteht auch wenn jemand nicht perfekt schreibt — fragt nach was fehlt und bestätigt die Reservierung in Sekunden. Auch um Mitternacht.",
              },
              {
                img:"/iphone_bookingpage.png", alt:"Online Buchung", dev:false,
                dotColor:"#818CF8", labelColor:"#5B5FC7", label:"Online Buchung", labelBg:"rgba(99,102,241,.08)",
                h:<>Deine eigene<br/>Buchungsseite</>,
                p:"Jedes Restaurant bekommt eine eigene Buchungsseite — deinen Link teilst du auf Instagram, Google oder deiner Website. Gäste wählen Datum, Uhrzeit und Personenzahl. Fertig in 30 Sekunden.",
              },
              {
                img:"/iphone_tel.png", alt:"KI Telefon", dev:true,
                dotColor:"#FF5C35", labelColor:"#FF5C35", label:"KI Telefon · bald", labelBg:"rgba(255,92,53,.08)",
                h:<>KI nimmt Anrufe<br/>automatisch entgegen</>,
                p:"Kein Anruf geht mehr verloren. Die KI nimmt ab, versteht den Gast und trägt die Reservierung automatisch ein — egal wie voll es im Restaurant ist. Kommt bald.",
              },
            ].map((c,i)=>(
              <Reveal key={i} delay={i*120}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
                  <div style={{position:"relative",marginBottom:"30px",width:"272px"}}>
                    <div className="soft-card" style={{background:"#1A1A2E",borderRadius:"42px",padding:"10px",boxShadow:"0 40px 80px rgba(26,26,46,.18)"}}>
                      <img src={c.img} alt={c.alt} style={{width:"100%",borderRadius:"34px",display:"block",filter:c.dev?"brightness(.55)":"none"}}/>
                    </div>
                    {c.dev && (
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"42px"}}>
                        <div style={{background:"rgba(26,26,46,.92)",backdropFilter:"blur(4px)",borderRadius:"100px",padding:"9px 18px",fontSize:"11px",fontWeight:600,color:"rgba(255,255,255,.75)",letterSpacing:"0.3px"}}>
                          In Entwicklung
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:c.labelBg,borderRadius:"100px",padding:"5px 14px",marginBottom:"14px"}}>
                    <div style={{width:"6px",height:"6px",borderRadius:"50%",background:c.dotColor}}/>
                    <span style={{fontSize:"11px",color:c.labelColor,fontWeight:600}}>{c.label}</span>
                  </div>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"21px",fontWeight:700,color:"#1A1A2E",marginBottom:"11px",letterSpacing:"-.5px",lineHeight:1.2}}>{c.h}</h3>
                  <p style={{fontSize:"13.5px",color:"#6B6B80",lineHeight:1.75,fontWeight:300,maxWidth:"300px"}}>{c.p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRODUKT BILD ===== */}
      <section id="screenshots" style={{background:"#F5F0EB",padding:"40px 24px 0",overflow:"hidden"}}>
        <div style={{maxWidth:"1080px",margin:"0 auto"}}>
          <Reveal>
            <div style={{textAlign:"center",marginBottom:"48px"}}>
              <div style={{fontSize:"12px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1.5px",color:"#FF5C35",marginBottom:"16px"}}>Das Produkt</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(30px,4vw,44px)",fontWeight:700,letterSpacing:"-1.3px",color:"#1A1A2E",marginBottom:"14px"}}>Vom Gast direkt ins Dashboard.</h2>
              <p style={{color:"#6B6B80",fontSize:"17px",fontWeight:300,maxWidth:"480px",margin:"0 auto",lineHeight:1.7}}>Gäste buchen auf dem iPhone — du verwaltest alles auf dem Mac.</p>
            </div>
          </Reveal>
          <Reveal y={48}>
            <div style={{borderRadius:"24px 24px 0 0",overflow:"hidden",boxShadow:"0 -20px 80px rgba(26,26,46,.10)"}}>
              <img src="/mac_iohon.png" alt="Tablely Dashboard" style={{width:"100%",height:"auto",display:"block"}}/>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== DEMO HIGHLIGHT ===== */}
      <section style={{background:"var(--dark)",padding:"120px 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-180px",left:"-140px",width:"520px",height:"520px",background:"radial-gradient(circle,rgba(255,92,53,.1) 0%,transparent 65%)",pointerEvents:"none"}}/>
        <div className="demo-split" style={{maxWidth:"1080px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"72px",alignItems:"center",position:"relative",zIndex:1}}>
          <Reveal>
            <div>
              <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,92,53,.1)",borderRadius:"100px",padding:"7px 16px",marginBottom:"24px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35"}}/>
                <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>Live Demo · keine Anmeldung nötig</span>
              </div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(30px,4vw,46px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1.3px",lineHeight:1.1,marginBottom:"20px"}}>
                Sieh in <span style={{color:"#FF5C35",fontStyle:"italic"}}>30 Sekunden</span> wie es funktioniert.
              </h2>
              <p style={{color:"rgba(255,255,255,.6)",fontSize:"16px",lineHeight:1.8,fontWeight:300,marginBottom:"32px"}}>
                Reserviere selbst als Gast — und beobachte wie die Reservierung in Echtzeit im Dashboard auftaucht. Kein Konto, keine E-Mail, einfach ausprobieren.
              </p>
              <a href="/demo" className="btn-hover-primary link-arrow" style={{display:"inline-flex",alignItems:"center",gap:"10px",background:"#FF5C35",color:"#fff",padding:"16px 32px",borderRadius:"100px",fontSize:"16px",fontWeight:500,textDecoration:"none"}}>
                Demo jetzt starten
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:"13px"}}>
              {[
                {n:"1",t:"Du buchst als Gast",d:"Datum, Uhrzeit, Personen — wie ein echter Gast auf der Buchungsseite."},
                {n:"2",t:"Tablely verarbeitet alles",d:"Tisch wird automatisch zugewiesen, Bestätigung sofort."},
                {n:"3",t:"Erscheint live im Dashboard",d:"Du siehst die Reservierung in Echtzeit im Restaurant-Dashboard."},
              ].map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"17px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:"18px",padding:"20px 22px"}}>
                  <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"rgba(255,92,53,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Playfair Display',serif",fontSize:"15px",fontWeight:700,color:"#FF5C35"}}>{s.n}</div>
                  <div>
                    <div style={{fontSize:"15px",fontWeight:600,color:"#FFFAF5",marginBottom:"3px"}}>{s.t}</div>
                    <div style={{fontSize:"13px",color:"rgba(255,255,255,.5)",lineHeight:1.55,fontWeight:300}}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== NUMBERS ===== */}
      <section style={{background:"var(--cream)",padding:"130px 32px"}}>
        <div style={{maxWidth:"1080px",margin:"0 auto"}}>
          <Reveal>
            <div style={{textAlign:"center",marginBottom:"60px"}}>
              <div style={{fontSize:"12px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1.5px",color:"var(--orange)",marginBottom:"16px"}}>Was Tablely bewirkt</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(30px,4vw,44px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-1.3px"}}>Zahlen die sprechen.</h2>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="numbers-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",background:"var(--dark)",borderRadius:"24px",overflow:"hidden"}}>
              {[
                {v:<CountUp end={60} prefix="-" suffix="%"/>,l:"weniger No-Shows durch automatische Erinnerungen"},
                {v:<CountUp end={2} suffix="h" duration={900}/>,l:"täglich gespart — keine Reservierungsanrufe mehr"},
                {v:<CountUp end={24} suffix="/7"/>,l:"Buchungen annehmen — auch wenn du schläfst"},
              ].map((n,i)=>(
                <div key={i} className="number-item" style={{padding:"52px 32px",textAlign:"center",borderRight:i<2?"1px solid rgba(255,255,255,.08)":"none"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"56px",fontWeight:700,color:"var(--orange)",letterSpacing:"-2px",marginBottom:"12px"}}>{n.v}</div>
                  <div style={{fontSize:"14px",color:"rgba(255,255,255,.5)",fontWeight:300,lineHeight:1.55,maxWidth:"230px",margin:"0 auto"}}>{n.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== PILOTPROGRAMM OSTTIROL ===== */}
      <section style={{background:"#F5F0EB",padding:"130px 32px"}}>
        <div style={{maxWidth:"880px",margin:"0 auto"}}>
          <Reveal>
            <div style={{background:"var(--dark)",borderRadius:"28px",padding:"clamp(40px,6vw,64px)",position:"relative",overflow:"hidden",textAlign:"center"}}>
              <div style={{position:"absolute",top:"-180px",right:"-140px",width:"480px",height:"480px",background:"radial-gradient(circle,rgba(255,92,53,.14) 0%,transparent 65%)",pointerEvents:"none"}}/>
              <div style={{position:"relative"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:"rgba(255,92,53,.1)",borderRadius:"100px",padding:"6px 15px",marginBottom:"24px"}}>
                  <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0}}/>
                  <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>Noch 3 von 3 Plätzen frei</span>
                </div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(30px,4.5vw,46px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1.5px",lineHeight:1.1,marginBottom:"20px"}}>
                  Die ersten 3 —<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>Pilotprogramm Osttirol.</span>
                </h2>
                <p style={{color:"rgba(255,255,255,.6)",fontSize:"16px",lineHeight:1.8,fontWeight:300,maxWidth:"560px",margin:"0 auto 34px"}}>
                  Bevor Tablely in ganz Österreich durchstartet, gebe ich zuerst meiner Heimat etwas zurück. Ich suche die ersten 3 Restaurants Osttirols, die nie wieder einen Anruf verpassen.
                </p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"12px",justifyContent:"center",marginBottom:"38px"}}>
                  {[
                    "6 Monate Tablely komplett gratis",
                    "Persönliche Einrichtung von mir",
                    "Direkter Draht zum Gründer",
                  ].map((t,i)=>(
                    <div key={i} style={{display:"inline-flex",alignItems:"center",gap:"9px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:"100px",padding:"10px 18px"}}>
                      <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"rgba(255,92,53,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#FF5C35" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{fontSize:"13.5px",color:"rgba(255,255,255,.85)",fontWeight:500}}>{t}</span>
                    </div>
                  ))}
                </div>
                <a href="mailto:michael@tablely.at?subject=Pilotprogramm%20Osttirol%20%E2%80%94%20Platz%20sichern" className="btn-hover-primary link-arrow" style={{display:"inline-flex",alignItems:"center",gap:"10px",background:"#FF5C35",color:"#fff",padding:"16px 34px",borderRadius:"100px",fontSize:"16px",fontWeight:500,textDecoration:"none"}}>
                  Jetzt Platz sichern
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section id="cta" style={{background:"var(--dark)",padding:"140px 24px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-220px",left:"50%",transform:"translateX(-50%)",width:"800px",height:"600px",background:"radial-gradient(ellipse at center,rgba(255,92,53,.12) 0%,transparent 65%)",pointerEvents:"none"}}/>
        <Reveal>
          <div style={{maxWidth:"680px",margin:"0 auto",textAlign:"center",position:"relative"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:"rgba(255,92,53,.1)",borderRadius:"100px",padding:"6px 15px",marginBottom:"26px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0}}/>
              <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>Nur die ersten 3 Restaurants</span>
            </div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(36px,6vw,58px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-2px",lineHeight:1.06,marginBottom:"20px"}}>
              6 Monate gratis.<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>Nur für die ersten 3.</span>
            </h2>
            <p style={{color:"rgba(255,255,255,.5)",fontSize:"16px",lineHeight:1.8,fontWeight:300,marginBottom:"28px",maxWidth:"540px",marginLeft:"auto",marginRight:"auto"}}>
              Die ersten 3 Restaurants, die sich anmelden, bekommen Tablely 6 Monate komplett kostenlos — inklusive vollständiger Einrichtung und persönlicher Betreuung österreichweit durch mich.
            </p>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px",justifyContent:"center",marginBottom:"38px"}}>
              {["Online Buchungsseite","WhatsApp KI","Erinnerungen","Dashboard","Walk-in Assistent","KI Telefon (bald)"].map((f,i)=>{
                const isDev=f.includes("bald");
                return (
                <div key={i} style={{fontSize:"12px",fontWeight:500,padding:"7px 15px",borderRadius:"100px",background:isDev?"rgba(255,255,255,.04)":"rgba(255,92,53,.1)",color:isDev?"rgba(255,255,255,.35)":"#FF5C35"}}>{f}</div>
              );})}
            </div>
            <button onClick={()=>setShowModal(true)} className="btn-hover-primary" style={{background:"#FF5C35",color:"#fff",border:"none",padding:"17px 40px",borderRadius:"100px",fontSize:"16px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginBottom:"16px"}}>
              Jetzt Platz sichern
            </button>
            <p style={{fontSize:"12px",color:"rgba(255,255,255,.3)"}}>Keine Kreditkarte. Keine Verpflichtung.</p>
          </div>
        </Reveal>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{padding:"36px 32px",borderTop:"1px solid var(--border)",background:"var(--cream)"}}>
        <div style={{maxWidth:"1080px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"16px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"19px",fontWeight:700,color:"var(--dark)"}}>table<span style={{color:"var(--orange)"}}>ly</span></div>
          <div style={{display:"flex",gap:"26px"}}>
            {[["Presse","/presse"],["Impressum","/impressum"],["Datenschutz","/datenschutz"],["AGB","/agb"]].map(([l,h])=>(
              <a key={h} href={h} className="nav-link" style={{fontSize:"12.5px",color:"var(--muted)",textDecoration:"none"}}>{l}</a>
            ))}
          </div>
          <p style={{fontSize:"12.5px",color:"var(--muted)"}}>© 2026 Tablely · Michael Kleinlercher e.U.</p>
        </div>
      </footer>

      {showModal && <RegisterModal onClose={()=>setShowModal(false)}/>}
      {showPilot && !showModal && (
        <PilotPopup
          onClose={()=>setShowPilot(false)}
          onRegister={()=>{ setShowPilot(false); setShowModal(true); }}
        />
      )}
      <CookieBanner />
    </>
  );
}