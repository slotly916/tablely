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

// Scroll-Position, auf einen Frame gedrosselt. Ohne rAF-Drosselung feuert das
// setState bei jedem Scroll-Event und rendert die gesamte Seite neu.
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; setY(window.scrollY); });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return y;
}

// Respektiert die System-Einstellung "Bewegung reduzieren". Bewegung wird dann
// nicht abgeschaltet, sondern durch eine reine Deckkraft-Blende ersetzt —
// Parallaxe, Blur-Reveal und Zaehl-Animationen entfallen.
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

type PilotStatus = { loading: boolean; count: number; spotsLeft: number; phase: "pilot"|"flash"|"normal"; deadline: string|null };

function usePilotStatus(): PilotStatus {
  const [status, setStatus] = useState<PilotStatus>({ loading: true, count: 0, spotsLeft: 3, phase: "pilot", deadline: null });
  useEffect(() => {
    let active = true;
    fetch("/api/pilot-status")
      .then(r => r.json())
      .then(d => {
        if (!active || d.error) { if (active) setStatus((s: PilotStatus) => ({ ...s, loading: false })); return; }
        setStatus({ loading: false, count: d.count, spotsLeft: d.spotsLeft, phase: d.phase, deadline: d.deadline });
      })
      .catch(() => { if (active) setStatus((s: PilotStatus) => ({ ...s, loading: false })); });
    return () => { active = false; };
  }, []);
  return status;
}

/* Alle phasenabhaengigen Angebots-Texte an EINER Stelle.
   Vorher standen "6 Monate" und "die ersten 3" in der Pilot-Sektion, im finalen
   CTA und im Registrierungs-Modal hartcodiert — in Phase "flash"/"normal" hat
   die Seite dort also weiter etwas anderes versprochen als der Hero. */
function getOffer(status: PilotStatus) {
  if (status.phase === "flash") {
    return {
      sectionBadge: "Die 3 Pilotplätze sind vergeben",
      sectionHead1: "30 Tage gratis.",
      sectionHead2: "Aber nur noch 48 Stunden.",
      sectionBody: "Die 6 Monate für die ersten drei Restaurants sind weg. Wer sich in den nächsten 48 Stunden meldet, bekommt Butlery trotzdem noch 30 Tage komplett kostenlos. Danach gelten die normalen 14 Tage.",
      bullets: ["30 Tage komplett gratis", "Ich richte dir alles selbst ein", "Bei Fragen rufst du mich an"],
      ctaBadge: "48-Stunden-Aktion",
      ctaHead1: "30 Tage gratis.",
      ctaHead2: "Nur noch 48 Stunden.",
      ctaBody: "Die Pilotplätze sind weg. In den nächsten 48 Stunden bekommst du Butlery noch 30 Tage komplett kostenlos, eingerichtet von mir persönlich.",
      cta: "Jetzt 30 Tage sichern",
      modalHead: "30 Tage gratis sichern",
      modalBadge: "Nur noch 48 Stunden",
      modalFine: "30 Tage Butlery gratis. Danach die normalen 14 Tage.",
    };
  }
  if (status.phase === "normal") {
    return {
      sectionBadge: "Jetzt kostenlos testen",
      sectionHead1: "14 Tage gratis.",
      sectionHead2: "Ohne Risiko.",
      sectionBody: "Teste Butlery 14 Tage komplett kostenlos: alle Funktionen, keine Kreditkarte, keine Verpflichtung. Eingerichtet wird trotzdem persönlich mit dir.",
      bullets: ["14 Tage komplett gratis", "Ich richte dir alles selbst ein", "Bei Fragen rufst du mich an"],
      ctaBadge: "Keine Kreditkarte nötig",
      ctaHead1: "14 Tage gratis.",
      ctaHead2: "Ohne Risiko.",
      ctaBody: "Teste Butlery 14 Tage komplett kostenlos: alle Funktionen, keine Kreditkarte, keine Verpflichtung. Willst du danach nicht weitermachen, musst du gar nichts tun.",
      cta: "14 Tage kostenlos testen",
      modalHead: "14 Tage kostenlos testen",
      modalBadge: "Keine Kreditkarte nötig",
      modalFine: "14 Tage Butlery gratis testen. Alle Funktionen außer KI Telefon, die ist noch in Arbeit.",
    };
  }
  const left = Math.max(0, Math.min(3, status.spotsLeft));
  const spots = left <= 1 ? "Nur mehr 1 Platz frei" : `Noch ${left} von 3 Plätzen frei`;
  return {
    sectionBadge: spots,
    sectionHead1: "Die ersten 3.",
    sectionHead2: "Pilotprogramm Osttirol.",
    sectionBody: "Bevor Butlery in ganz Österreich losgeht, gebe ich zuerst meiner Heimat etwas zurück. Ich suche drei Restaurants in Osttirol, die ab sofort keinen Anruf mehr verpassen. Ihr bekommt sechs Monate gratis, ich bekomme ehrliches Feedback.",
    bullets: ["6 Monate komplett gratis", "Ich richte dir alles selbst ein", "Bei Fragen rufst du mich an"],
    ctaBadge: spots,
    ctaHead1: "6 Monate gratis.",
    ctaHead2: "Nur für die ersten 3.",
    ctaBody: "Die ersten drei Restaurants, die sich melden, bekommen Butlery sechs Monate komplett kostenlos. Ich komme vorbei, richte alles ein und bleibe erreichbar, auch nach dem ersten Abend.",
    cta: "Jetzt Platz sichern",
    modalHead: "6 Monate gratis sichern",
    modalBadge: spots,
    modalFine: "Die ersten 3 Restaurants: 6 Monate gratis, eingerichtet von mir. Alle Funktionen außer KI Telefon, die ist noch in Arbeit.",
  };
}

// Live tickender Countdown bis zu einem Enddatum (zeigt Stunden:Minuten:Sekunden)
function Countdown({ deadline, compact = false }: { deadline: string; compact?: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  const end = new Date(deadline).getTime();
  let diff = Math.max(0, end - now);
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const text = `${pad(h)}:${pad(m)}:${pad(s)}`;
  if (compact) return <span style={{fontVariantNumeric:"tabular-nums",fontWeight:700}}>{text}</span>;
  return (
    <span style={{display:"inline-flex",gap:"6px",alignItems:"center"}}>
      {[["Std",pad(h)],["Min",pad(m)],["Sek",pad(s)]].map(([label,val],i)=>(
        <span key={i} style={{display:"inline-flex",flexDirection:"column",alignItems:"center",background:"rgba(255,255,255,.1)",borderRadius:"8px",padding:"6px 9px",minWidth:"42px"}}>
          <span style={{fontSize:"18px",fontWeight:700,color:"#fff",fontVariantNumeric:"tabular-nums",lineHeight:1}}>{val}</span>
          <span style={{fontSize:"9px",color:"rgba(255,255,255,.75)",marginTop:"3px",letterSpacing:"0.05em"}}>{label}</span>
        </span>
      ))}
    </span>
  );
}

/* ============ APPLE-STYLE REVEAL (Blur + Scale + Rise) ============ */

function Reveal({ children, delay = 0, y = 28 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const { ref, inView } = useInView(0.15);
  const reduced = useReducedMotion();
  // will-change nur solange Bewegung ansteht. Dauerhaft gesetzt zwingt es den
  // Browser, fuer jeden Block eine eigene Compositor-Ebene offenzuhalten.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setSettled(true), 900 + delay + 50);
    return () => clearTimeout(t);
  }, [inView, delay]);

  if (reduced) {
    return (
      <div ref={ref} style={{
        opacity: inView ? 1 : 0,
        transition: `opacity .3s ease ${delay}ms`,
      }}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0) scale(1)" : `translateY(${y}px) scale(.985)`,
      filter: inView ? "blur(0px)" : "blur(8px)",
      transition: `opacity .9s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .9s cubic-bezier(.16,1,.3,1) ${delay}ms, filter .9s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      willChange: settled ? "auto" : "opacity, transform, filter",
    }}>
      {children}
    </div>
  );
}

/* ============ HERO-AUFTRITT ============ */

/* Die drei Headline-Zeilen kommen aus EINER Quelle, damit der sichtbare Text
   und das aria-label der H1 nicht auseinanderlaufen koennen. Zeile 1+2 stehen
   im dunklen Block, Zeile 3 im hellen — die Naht liegt dazwischen. */
const HERO_LINES = ["Kein Anruf.", "Kein Buch.", "Kein Chaos."] as const;

const heroLine: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-playfair),serif",
  fontSize: "var(--h1)",
  fontWeight: 700,
  lineHeight: 0.98,
  letterSpacing: "-0.04em",
  whiteSpace: "nowrap",
  color: "#FFFFFF",
};

/* Der Hero benutzt bewusst NICHT <Reveal>: dessen filter:blur(8px) weicht genau
   die Kante auf, die hier die Aussage traegt, und bei 92px Playfair sieht ein
   Blur-Uebergang nach Rendering-Fehler aus. Darum ein eigener Wrapper ohne
   IntersectionObserver — der Hero ist beim Laden ohnehin sichtbar. */
function useHeroStart() {
  const reduced = useReducedMotion();
  const [started, setStarted] = useState(false);
  useEffect(() => {
    // Wer per Back-Navigation mitten auf der Seite landet, hat den Auftritt
    // schon verpasst — dann sofort Endzustand statt nachtraeglich einblenden.
    if (reduced || window.scrollY > 40) { setStarted(true); return; }
    let done = false;
    const go = () => { if (!done) { done = true; setStarted(true); } };
    // Der Timeout ist die Absicherung: ein fehlgeschlagener Font-Load darf den
    // Hero nicht dauerhaft auf opacity 0 stehen lassen.
    const t = setTimeout(go, 400);
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fonts?.ready) fonts.ready.then(go).catch(go); else go();
    return () => clearTimeout(t);
  }, [reduced]);
  return { started, reduced };
}

function HeroIn({ children, at, reduced, started }: { children: React.ReactNode; at: number; reduced: boolean; started: boolean }) {
  // Bewegung reduziert: reine Deckkraft-Staffelung in derselben Lesereihenfolge.
  // Eine Staffelung von Deckkraft ist keine Bewegung (§14).
  const delay = reduced ? Math.min(at, 360) : at;
  return (
    <div style={{
      opacity: started ? 1 : 0,
      transform: reduced ? "none" : `translateY(${started ? 0 : 12}px)`,
      transition: reduced
        ? `opacity .26s ease ${delay}ms`
        : `opacity .62s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .62s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ============ NAMENSWECHSEL ============ */

/* Die alte Wortmarke laeuft in die neue. Bewusst KEIN eigener Block ueber der
   Seite — die Zeile sitzt im Hero und weicht dem, was darunter kommt.
   Apple-Regeln, an die sich das haelt:
   §11 nur transform + opacity animieren, nichts was Layout anfasst
   §4  kritisch gedaempft (kein Ueberschwingen) — hier ist keine Geste im Spiel,
       die einen Bounce rechtfertigen wuerde
   §14 bei "Bewegung reduzieren" steht sofort der Endzustand, ohne Uebergang
   Der alte Name bleibt lesbar, tritt aber sichtbar zurueck — dass er verblasst
   IST die Aussage. */
function RenameMark() {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (reduced) { setDone(true); return; }
    const t = setTimeout(() => setDone(true), 620);
    return () => clearTimeout(t);
  }, [reduced]);

  const ease = "cubic-bezier(.16,1,.3,1)";
  const anim = (d: number) => reduced ? "none" : `opacity .75s ${ease} ${d}ms, transform .75s ${ease} ${d}ms`;

  return (
    <div
      role="img"
      aria-label="Tablely wird zu Butlery"
      style={{
        display:"inline-flex",alignItems:"center",
        gap:"clamp(11px,1.6vw,18px)",
        marginBottom:"30px",
      }}
    >
      {/* Alte Wortmarke — wie sie war, nur zurueckgenommen */}
      <span aria-hidden="true" style={{
        fontFamily:"var(--font-playfair),serif",
        fontSize:"clamp(19px,2.2vw,26px)",fontWeight:700,
        letterSpacing:"-0.025em",whiteSpace:"nowrap",
        color: done ? "rgba(255,255,255,.34)" : "rgba(255,255,255,.82)",
        transition: reduced ? "none" : `color .9s ${ease}`,
      }}>
        table<span style={{
          color: done ? "rgba(255,92,53,.42)" : "var(--orange)",
          transition: reduced ? "none" : `color .9s ${ease}`,
        }}>ly</span>
      </span>

      {/* Kleiner als die beiden Marken — es verbindet sie, es konkurriert nicht. */}
      <span aria-hidden="true" style={{
        fontSize:"clamp(13px,1.5vw,16px)",
        color:"rgba(255,255,255,.45)",
        whiteSpace:"nowrap",flexShrink:0,
        opacity: done ? 1 : 0,
        transform: `translateX(${done ? 0 : -7}px)`,
        transition: anim(60),
      }}>
        wird zu
      </span>

      <img
        src="/butlery-logo-hell.png"
        width={1416}
        height={496}
        alt=""
        style={{
          height:"clamp(30px,3.4vw,42px)",width:"auto",display:"block",flexShrink:0,
          opacity: done ? 1 : 0,
          transform: `translateX(${done ? 0 : -12}px)`,
          transition: anim(120),
        }}
      />
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
        <div style={{fontSize:"13px",color:"#E9EDEF",lineHeight:1.5}}>Hallo Frau Huber! Passt, ich habe Ihnen einen Tisch für 4 Personen am Freitag, 20. Mai um 19:00 Uhr reserviert. Wir freuen uns auf Sie!</div>
        <div style={{fontSize:"10px",color:"rgba(255,255,255,.4)",textAlign:"right",marginTop:"4px"}}>18:42</div>
      </div>
      <div style={{...show(4),alignSelf:"flex-start",background:"#202C33",padding:"8px 12px",borderRadius:"14px 14px 14px 3px",maxWidth:"60%"}}>
        <div style={{fontSize:"11px",color:"#8696A0",fontStyle:"italic"}}>Butlery KI · automatisch geantwortet</div>
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
  const rows: [string, string][] = [["Gast ruft an","KI hebt ab"],["Tag, Uhrzeit, Personen","KI fragt nach"],["Reservierung","Steht im Dashboard"]];
  return (
    <div ref={ref} style={{background:"var(--paper-alt)",borderRadius:"16px",padding:"18px",border:"1px solid var(--border)"}}>
      {rows.map(([l,r],i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 10px",margin:"0 -10px",borderBottom:i<2?"1px solid var(--border)":"none",fontSize:"12px",borderRadius:"8px",background:active===i?"rgba(255,92,53,.06)":"transparent",transition:"background .4s ease"}}>
          <span style={{color:active===i?"#1A1A2E":"var(--muted)",transition:"color .4s ease",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{width:"5px",height:"5px",borderRadius:"50%",background:active===i?"#FF5C35":"#C7CCD4",transition:"background .4s ease",flexShrink:0}}/>
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
  const reduced = useReducedMotion();
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    // Bewegung reduziert: Endwert sofort zeigen statt hochzaehlen.
    if (reduced) { setVal(end); return; }
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
  }, [inView, end, duration, reduced]);
  return <span ref={ref as React.RefObject<HTMLDivElement>} style={{display:"inline-block"}}>{prefix}{val}{suffix}</span>;
}

/* ============ REGISTER MODAL ============ */

function RegisterModal({ onClose, pilot }: { onClose: () => void; pilot: PilotStatus }) {
  const offer = getOffer(pilot);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  // Feldfehler erscheinen sobald ein Feld einmal verlassen wurde — nicht erst
  // nach dem Absenden. Wer tippt, soll waehrend des Tippens sehen ob es passt.
  const [touched, setTouched] = useState<{[k:string]:boolean}>({});
  const fieldErrors = {
    name: name.trim() ? "" : "Bitte gib deinen Namen an.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? "" : "Bitte eine gültige E-Mail-Adresse.",
    password: password.length >= 8 ? "" : "Mindestens 8 Zeichen.",
  };
  const showErr = (k: keyof typeof fieldErrors) => touched[k] ? fieldErrors[k] : "";
  const formValid = !fieldErrors.name && !fieldErrors.email && !fieldErrors.password;
  const markTouched = (k: string) => setTouched(t => ({ ...t, [k]: true }));

  async function handleGoogleLogin() {
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/callback?next=/onboarding` },
    });
  }

  async function handleRegister() {
    if (!formValid) {
      setTouched({ name: true, email: true, password: true });
      return;
    }
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
    <div style={{position:"fixed",inset:0,background:"rgba(26,26,46,.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:"20px",fontFamily:"var(--font-sans)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#FFFFFF",borderRadius:"24px",padding:"40px",width:"100%",maxWidth:"430px",boxShadow:"0 32px 90px rgba(26,26,46,.25)"}}>
        {status==="success" ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"#E8F8F1",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#25C281" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"24px",fontWeight:700,color:"#1A1A2E",marginBottom:"10px"}}>Fast geschafft</h2>
            <p style={{color:"var(--muted)",fontSize:"14px",lineHeight:1.7,marginBottom:"22px"}}>Ich habe dir eine Mail an <strong>{email}</strong> geschickt. Klick auf den Link darin, dann richten wir dein Restaurant ein.</p>
            <button onClick={onClose} className="btn-hover-primary" style={{background:"#FF5C35",color:"#fff",border:"none",padding:"13px 32px",borderRadius:"100px",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>Schließen</button>
          </div>
        ) : (
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"23px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-0.013em"}}>{offer.modalHead}</h2>
              <button onClick={onClose} style={{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:"20px",lineHeight:1}}>✕</button>
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(255,92,53,.07)",borderRadius:"100px",padding:"5px 13px",marginBottom:"22px"}}>
              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#FF5C35"}}/>
              <span style={{fontSize:"11px",color:"#FF5C35",fontWeight:600}}>{offer.modalBadge}</span>
            </div>
            <button onClick={handleGoogleLogin} className="btn-hover-light" style={{
              width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
              padding:"13px",borderRadius:"100px",border:"1px solid var(--border)",background:"#fff",
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
              <div style={{flex:1,height:"1px",background:"var(--border)"}}/>
              <span style={{fontSize:"12px",color:"var(--muted)"}}>oder mit E-Mail</span>
              <div style={{flex:1,height:"1px",background:"var(--border)"}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"14px"}}>
              {([
                { k:"name" as const, type:"text", ph:"Dein Name", val:name, set:setName },
                { k:"email" as const, type:"email", ph:"deine@email.at", val:email, set:setEmail },
                { k:"password" as const, type:"password", ph:"Passwort (min. 8 Zeichen)", val:password, set:setPassword },
              ]).map(f=>(
                <div key={f.k}>
                  <input
                    className="input-soft" type={f.type} placeholder={f.ph} value={f.val}
                    onChange={e=>f.set(e.target.value)}
                    onBlur={()=>markTouched(f.k)}
                    disabled={status==="loading"}
                    aria-invalid={!!showErr(f.k)}
                    style={showErr(f.k) ? {borderColor:"#E24B4A"} : undefined}
                    onKeyDown={f.k==="password" ? (e=>e.key==="Enter"&&handleRegister()) : undefined}
                  />
                  {showErr(f.k) && (
                    <div style={{fontSize:"12px",color:"#E24B4A",marginTop:"5px",paddingLeft:"2px"}}>{showErr(f.k)}</div>
                  )}
                </div>
              ))}
            </div>
            {errorMsg && <p style={{color:"#E24B4A",fontSize:"13px",marginBottom:"10px"}}>{errorMsg}</p>}
            <button onClick={handleRegister} disabled={status==="loading"} className="btn-hover-primary" style={{width:"100%",background:"#FF5C35",color:"#fff",border:"none",padding:"15px",borderRadius:"100px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:status==="loading"?0.7:1,marginBottom:"14px"}}>
              {status==="loading" ? "Wird registriert..." : "Kostenlos starten"}
            </button>
            <p style={{fontSize:"11px",color:"var(--muted)",textAlign:"center",lineHeight:1.6}}>
              {offer.modalFine}
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
    <div style={{position:"fixed",left:"20px",right:"20px",bottom:"20px",zIndex:600,display:"flex",justifyContent:"center",fontFamily:"var(--font-sans)",pointerEvents:"none"}}>
      <div style={{
        pointerEvents:"auto",
        background:"var(--paper)",
        border:"1px solid var(--border)",borderRadius:"20px",
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
          <p style={{fontSize:"13px",color:"var(--muted)",lineHeight:1.6,fontWeight:300}}>
            Wir nutzen notwendige Cookies, damit die Seite funktioniert, sowie optionale Cookies um die Nutzung zu analysieren und Butlery zu verbessern. Du kannst selbst entscheiden. Mehr dazu in unserer{" "}
            <a href="/datenschutz" style={{color:"#FF5C35",textDecoration:"none",fontWeight:500}}>Datenschutzerklärung</a>.
          </p>
        </div>
        <div style={{display:"flex",gap:"10px",flexShrink:0}}>
          <button onClick={()=>decide("declined")} className="btn-hover-light" style={{
            background:"#fff",color:"#1A1A2E",border:"1px solid var(--border)",
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

function PilotPopup({ onClose, onRegister, status }: { onClose: () => void; onRegister: () => void; status: PilotStatus }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{
      position:"fixed",inset:0,zIndex:700,
      background:"rgba(26,26,46,.72)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",
      fontFamily:"var(--font-sans)",
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
        <button onClick={onClose} aria-label="Schließen" className="icon-btn" style={{
          position:"absolute",top:"18px",left:"18px",zIndex:2,
          width:"32px",height:"32px",borderRadius:"50%",
          background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",
          color:"rgba(255,255,255,.85)",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:"inherit",
        }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>


        <div style={{position:"relative"}}>
          {status.phase === "flash" && status.deadline ? (
            <>
              <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:"rgba(255,92,53,.12)",borderRadius:"100px",padding:"6px 15px",marginBottom:"22px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0}}/>
                <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>Die 3 Pilotplätze sind vergeben</span>
              </div>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(26px,4vw,36px)",fontWeight:700,color:"#FFFFFF",letterSpacing:"-0.033em",lineHeight:1.12,marginBottom:"16px"}}>
                Die 6 Monate sind weg.<br/><span style={{color:"#FF5C35"}}>Das hier noch nicht.</span>
              </h2>
              <p style={{color:"rgba(255,255,255,.6)",fontSize:"15.5px",lineHeight:1.75,fontWeight:300,maxWidth:"410px",margin:"0 auto 22px"}}>
                Die drei Pilotplätze sind vergeben. Für die nächsten 48 Stunden gibt es noch <strong style={{color:"rgba(255,255,255,.9)"}}>30 Tage Butlery gratis</strong>, danach nur noch die normalen 14 Tage.
              </p>
              <div style={{marginBottom:"26px"}}>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,.62)",marginBottom:"12px"}}>Angebot endet in</div>
                <Countdown deadline={status.deadline}/>
              </div>
              <button onClick={onRegister} className="btn-hover-primary" style={{width:"100%",background:"#FF5C35",color:"#fff",border:"none",padding:"16px",borderRadius:"100px",fontSize:"16px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginBottom:"14px"}}>
                Jetzt 30 Tage sichern
              </button>
              <button onClick={onClose} style={{background:"transparent",border:"none",color:"rgba(255,255,255,.62)",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Vielleicht später</button>
            </>
          ) : status.phase === "normal" ? (
            <>
              <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:"rgba(255,92,53,.12)",borderRadius:"100px",padding:"6px 15px",marginBottom:"22px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0}}/>
                <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>Jetzt kostenlos testen</span>
              </div>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(26px,4vw,36px)",fontWeight:700,color:"#FFFFFF",letterSpacing:"-0.033em",lineHeight:1.12,marginBottom:"18px"}}>
                14 Tage gratis.<br/><span style={{color:"#FF5C35"}}>Ohne Risiko.</span>
              </h2>
              <p style={{color:"rgba(255,255,255,.6)",fontSize:"15.5px",lineHeight:1.75,fontWeight:300,maxWidth:"400px",margin:"0 auto 28px"}}>
                14 Tage lang alle Funktionen, ohne Kreditkarte und ohne Verpflichtung. Eingerichtet wird persönlich mit dir.
              </p>
              <button onClick={onRegister} className="btn-hover-primary" style={{width:"100%",background:"#FF5C35",color:"#fff",border:"none",padding:"16px",borderRadius:"100px",fontSize:"16px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginBottom:"14px"}}>
                Kostenlos starten
              </button>
              <button onClick={onClose} style={{background:"transparent",border:"none",color:"rgba(255,255,255,.62)",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Vielleicht später</button>
            </>
          ) : (
            <>
              <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:"rgba(255,92,53,.12)",borderRadius:"100px",padding:"6px 15px",marginBottom:"22px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0}}/>
                <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>
                  {status.spotsLeft <= 1 ? "Nur mehr 1 Platz frei" : status.spotsLeft === 2 ? "Nur mehr 2 Plätze frei" : "Nur die ersten 3 Restaurants"}
                </span>
              </div>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(26px,4vw,36px)",fontWeight:700,color:"#FFFFFF",letterSpacing:"-0.033em",lineHeight:1.12,marginBottom:"18px"}}>
                6 Monate gratis.<br/><span style={{color:"#FF5C35"}}>Eingerichtet von mir.</span>
              </h2>
              <p style={{color:"rgba(255,255,255,.6)",fontSize:"15.5px",lineHeight:1.75,fontWeight:300,maxWidth:"400px",margin:"0 auto 28px"}}>
                Die ersten drei Restaurants, die sich melden, bekommen Butlery sechs Monate komplett kostenlos. Ich komme vorbei, richte alles ein und bleibe erreichbar.
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:"11px",marginBottom:"30px",textAlign:"left",maxWidth:"340px",marginLeft:"auto",marginRight:"auto"}}>
                {[
                  "6 Monate Butlery komplett gratis",
                  "Tische, Zeiten, Nummer: mache ich",
                  "Bei Fragen rufst du mich an",
                ].map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"11px"}}>
                    <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"rgba(255,92,53,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#FF5C35" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{fontSize:"14px",color:"rgba(255,255,255,.85)",fontWeight:500}}>{t}</span>
                  </div>
                ))}
              </div>
              <button onClick={onRegister} className="btn-hover-primary" style={{width:"100%",background:"#FF5C35",color:"#fff",border:"none",padding:"16px",borderRadius:"100px",fontSize:"16px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginBottom:"14px"}}>
                Jetzt Platz sichern
              </button>
              <button onClick={onClose} style={{background:"transparent",border:"none",color:"rgba(255,255,255,.62)",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Vielleicht später</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ PAGE ============ */

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  // Das Popup hat sich vorher bei JEDEM Besuch wieder aufgedraengt — auch wenn
  // man es zehnmal weggeklickt hat. Eine einmal getroffene Entscheidung gilt
  // jetzt, wie beim Cookie-Banner auch.
  const [showPilot, setShowPilot] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem("tablely_pilot_popup_dismissed")) setShowPilot(true);
    } catch { setShowPilot(true); }
  }, []);
  function dismissPilot() {
    try { localStorage.setItem("tablely_pilot_popup_dismissed", "1"); } catch {}
    setShowPilot(false);
  }
  const pilot = usePilotStatus();
  const offer = getOffer(pilot);
  const scrollY = useScrollY();
  const navScrolled = scrollY > 8;
  const { started, reduced } = useHeroStart();
  // Die Hero-Parallaxe ist mit dem Dashboard-Mockup entfallen — es gibt kein
  // scrollgetriebenes Element mehr im Hero.

  return (
    <>
      <style>{`
        /* Playfair kommt aus next/font (layout.tsx, --font-playfair) — selbst
           gehostet und vorgeladen. Der frueher hier stehende @import auf
           Google Fonts hat dieselbe Schrift ein zweites Mal geholt. */
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--orange:#FF5C35;--dark:#1A1A2E;--paper:#FFFFFF;--paper-alt:#F5F6F8;--muted:#5F5F73;--border:#E6E8EC;
              /* Eine Groesse, eine Quelle: die Hero-Headline und die Hoehe des
                 dunklen Blocks haengen beide an diesem Token. */
              --h1:clamp(46px,6.6vw,92px);
              --font-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;}
        html{scroll-behavior:smooth;}
        body{font-family:var(--font-sans);background:var(--paper);color:var(--dark);overflow-x:hidden;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
        ::selection{background:rgba(255,92,53,.18);}

        .btn-hover-primary{transition:transform .25s cubic-bezier(.16,1,.3,1), background .2s ease, box-shadow .25s ease;}
        .btn-hover-primary:hover{background:#F04E28!important;transform:scale(1.02);box-shadow:0 10px 30px rgba(255,92,53,.25);}
        .btn-hover-primary:active{transform:scale(.99);}
        .btn-hover-light{transition:transform .25s cubic-bezier(.16,1,.3,1), border-color .2s ease, background .2s ease;}
        .btn-hover-light:hover{border-color:#CBD0D8!important;background:var(--paper-alt)!important;}
        .btn-hover-light:active{transform:scale(.99);}
        .btn-ghost{transition:transform .25s cubic-bezier(.16,1,.3,1), border-color .2s ease, background .2s ease;}
        .btn-ghost:hover{border-color:rgba(255,255,255,.45)!important;background:rgba(255,255,255,.05)!important;}
        .btn-ghost:active{transform:scale(.99);}
        .nav-link{transition:color .2s ease;}
        .nav-link:hover{color:var(--dark)!important;}
        .nav-cta{transition:background .25s ease,color .25s ease,transform .25s cubic-bezier(.16,1,.3,1);}
        .nav-cta:hover{background:var(--orange)!important;border-color:var(--orange)!important;color:#fff!important;transform:scale(1.03);}
        .nav-cta:active{transform:scale(.99);}
        /* Rueckmeldung auf den Druck, nicht erst auf das Loslassen. */
        .icon-btn{transition:background .2s ease, transform .2s cubic-bezier(.16,1,.3,1);}
        .icon-btn:hover{background:rgba(255,255,255,.16)!important;}
        .icon-btn:active{transform:scale(.94);}

        .soft-card{transition:transform .45s cubic-bezier(.16,1,.3,1), box-shadow .45s cubic-bezier(.16,1,.3,1);}
        .soft-card:hover{transform:translateY(-5px);box-shadow:0 24px 60px rgba(26,26,46,.10);}

        .input-soft{width:100%;padding:13px 16px;border:1px solid var(--border);border-radius:14px;font-size:14px;font-family:inherit;background:#fff;color:#1A1A2E;outline:none;transition:border-color .2s ease, box-shadow .2s ease;}
        .input-soft:focus{border-color:#FF5C35;box-shadow:0 0 0 3px rgba(255,92,53,.1);}

        @keyframes dotPulse{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}
        .t-dot{width:5px;height:5px;border-radius:50%;display:inline-block;animation:dotPulse 1.2s infinite;}

        .link-arrow{transition:gap .25s cubic-bezier(.16,1,.3,1);}
        .link-arrow:hover{gap:13px!important;}
        .press-link{transition:opacity .2s ease;}
        .press-link:hover{text-decoration:underline!important;text-underline-offset:3px;}

        /* Blog-Link nur dort zeigen, wo die Desktop-Linkzeile ausgeblendet ist. */
        .nav-mobile-only{display:none;}

        /* Bewegung reduzieren: keine Skalierungen, kein Puls, kein
           Smooth-Scroll. Die Deckkraft-Blenden bleiben — sie helfen beim
           Verstehen und loesen keine vestibulaeren Reize aus. */
        @media(prefers-reduced-motion:reduce){
          html{scroll-behavior:auto;}
          .t-dot{animation:none;opacity:.65;}
          .btn-hover-primary:hover,.btn-hover-primary:active,
          .btn-hover-light:active,.btn-ghost:active,
          .nav-cta:hover,.nav-cta:active,
          .icon-btn:active,.soft-card:hover{transform:none!important;}
          .soft-card{transition:box-shadow .2s ease;}
          /* Pfeil-Abstand springt statt zu wandern — Hover bleibt erkennbar. */
          .link-arrow{transition:none!important;}
        }

        @media(max-width:768px){
          /* Kein hero-h1/hero-sub-Override mehr: beide Groessen stecken in
             ihren clamp()-Werten. Zwei Wahrheitsquellen fuer dieselbe Groesse
             waeren genau der Fehler, an dem die Naht zerbrechen wuerde. */
          .pain-grid{grid-template-columns:1fr!important;gap:44px!important;}
          .feat-big-grid{grid-template-columns:1fr!important;}
          .feat-detail-grid{grid-template-columns:1fr!important;gap:44px!important;}
          .numbers-grid{grid-template-columns:1fr!important;}
          .number-item{border-right:none!important;border-bottom:1px solid rgba(255,255,255,.08)!important;}
          .wa-section-grid{grid-template-columns:1fr!important;gap:48px!important;}
          .wa-mockup-col{display:none!important;}
          .booking-grid{grid-template-columns:1fr!important;gap:48px!important;}
          .demo-split{grid-template-columns:1fr!important;gap:44px!important;}
          .nav-links-hide{display:none!important;}
          .nav-mobile-only{display:inline-block!important;}
          .statement-h{font-size:34px!important;}
          .founder-grid{grid-template-columns:1fr!important;gap:48px!important;}
          .founder-photos{max-width:420px;margin:0 auto!important;}
          .why-row{grid-template-columns:1fr!important;gap:10px!important;}
          /* Screenshot-Reihen stapeln; die gespiegelte Reihe muss das Bild
             wieder nach unten holen, sonst steht es auf Mobil ueber dem Text. */
          .shot-row{grid-template-columns:1fr!important;gap:28px!important;}
          .shot-row-flip > div:first-child{order:2;}
          .shot-row-flip > div:last-child{order:1;}
        }
      `}</style>

      {/* ===== NAV (opake Flaeche, verdichtet beim Scrollen) ===== */}
      <nav style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding: navScrolled ? "12px 32px" : "18px 32px",
        position:"sticky",top:0,zIndex:100,
        background: "var(--paper)",
        borderBottom: navScrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition:"padding .35s cubic-bezier(.16,1,.3,1), background .35s ease, border-color .35s ease",
      }}>
        <a href="/" aria-label="Butlery — zur Startseite" style={{display:"block",lineHeight:0}}>
          <img src="/butlery-logo-dunkel.png" width={1416} height={496} alt="Butlery" style={{height:"26px",width:"auto",display:"block"}}/>
        </a>
        <div style={{display:"flex",alignItems:"center",gap:"22px"}}>
          <div className="nav-links-hide" style={{display:"flex",gap:"30px",alignItems:"center"}}>
            {[["#einblick","Einblick"],["#features","Funktionen"],["/blog","Blog"],["/presse","Presse"],["/demo","Demo"]].map(([h,l])=>(
              <a key={h} href={h} className="nav-link" style={{textDecoration:"none",color:"var(--muted)",fontSize:"14px",fontWeight:500}}>{l}</a>
            ))}
          </div>
          {/* Auf Mobile ist die Linkzeile ausgeblendet — Blog bleibt hierueber erreichbar. */}
          <a href="/blog" className="nav-link nav-mobile-only" style={{textDecoration:"none",color:"var(--muted)",fontSize:"14px",fontWeight:500}}>Blog</a>
          <a href="/login" className="nav-link" style={{textDecoration:"none",color:"var(--muted)",fontSize:"14px",fontWeight:500}}>Login</a>
          <button className="nav-cta" onClick={()=>setShowModal(true)} style={{background:"var(--dark)",color:"#fff",border:"1px solid var(--dark)",padding:"9px 20px",borderRadius:"100px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
            Jetzt testen
          </button>
        </div>
      </nav>

      {/* ===== HERO — "DIE NAHT" =====
          Die Kante zwischen dunkler und heller Flaeche laeuft mitten durch die
          Headline: oben die alte Welt (Anruf, Buch) weiss auf Dunkel, unten das
          Ergebnis orange auf Weiss. Der Blickfang ist die Kante selbst, nicht
          ein zusaetzliches Element.

          WICHTIG fuer spaetere Aenderungen:
          - Die Naht ist schlicht die Unterkante des dunklen Blocks. Sie zielt
            auf NICHTS Berechnetes — deshalb kann sie auch nichts verfehlen.
            "Buch." hat keine Unterlaenge, "Kein Chaos." beginnt erst 0,196em
            unter der Kante: dazwischen liegt ein leerer Korridor von ~25px.
          - An der Naht KEIN Radius, KEINE Hairline, KEIN Schatten, KEIN Verlauf.
            Jede Verschoenerung zerstoert den Entwurf sofort.
          - Wer die Headline umformuliert, muss DREI kurze Zeilen beibehalten,
            die letzte davon die Pointe. Zwei oder vier zerlegen die Komposition. */}
      <div style={{background:"var(--dark)",position:"relative",marginTop:"-73px",paddingTop:"calc(73px + clamp(52px,4.5vw,60px))",paddingBottom:"calc(var(--h1) * .06)"}}>
        <div style={{maxWidth:"1180px",margin:"0 auto",padding:"0 clamp(22px,3vw,32px)"}}>
          <HeroIn at={0} reduced={reduced} started={started}>
            <RenameMark/>
          </HeroIn>
          <HeroIn at={reduced?0:90} reduced={reduced} started={started}>
            {/* alignItems:flex-start, damit der Punkt bei zweizeiligem Umbruch
                an der ersten Zeile bleibt statt mittig daneben zu schweben. */}
            <div style={{display:"inline-flex",alignItems:"flex-start",gap:"8px",background:"rgba(255,92,53,.1)",borderRadius:"18px",padding:"7px 16px",marginBottom:"26px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0,marginTop:"6px"}}/>
              <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600,letterSpacing:"0.017em"}}>
                {pilot.phase === "flash" ? "Pilotplätze vergeben. Jetzt 48 Stunden: 30 Tage gratis"
                  : pilot.phase === "normal" ? "14 Tage kostenlos testen"
                  : pilot.spotsLeft <= 1 ? "Nur mehr 1 Platz frei. 6 Monate gratis"
                  : pilot.spotsLeft === 2 ? "Nur mehr 2 Plätze frei. 6 Monate gratis"
                  : "Die ersten 3 Restaurants Osttirols bekommen 6 Monate gratis"}
              </span>
            </div>
          </HeroIn>
          {/* Screenreader hoeren einen vollstaendigen Satz; die dritte Zeile
              unterhalb der Naht ist aria-hidden, damit nichts doppelt vorkommt. */}
          <h1 aria-label={`${HERO_LINES[0]} ${HERO_LINES[1]} ${HERO_LINES[2]}`} style={{margin:0}}>
            <HeroIn at={reduced?120:170} reduced={reduced} started={started}>
              <span aria-hidden="true" style={heroLine}>{HERO_LINES[0]}</span>
            </HeroIn>
            <HeroIn at={reduced?180:250} reduced={reduced} started={started}>
              <span aria-hidden="true" style={heroLine}>{HERO_LINES[1]}</span>
            </HeroIn>
          </h1>
        </div>
      </div>

      {/* ═══ NAHT ═══ — hier wechselt die Fläche, hart, ohne jede Kantenzier. */}

      <div style={{background:"var(--paper)"}}>
        <div style={{maxWidth:"1180px",margin:"0 auto",padding:"0 clamp(22px,3vw,32px)"}}>
          <HeroIn at={reduced?240:390} reduced={reduced} started={started}>
            <div aria-hidden="true" style={{...heroLine,color:"#FF5C35",marginBottom:"28px"}}>{HERO_LINES[2]}</div>
          </HeroIn>

          <HeroIn at={reduced?300:470} reduced={reduced} started={started}>
            <p style={{color:"var(--muted)",fontSize:"clamp(16px,1.35vw,18px)",lineHeight:1.75,fontWeight:400,maxWidth:"560px",marginBottom:"34px"}}>
              Freitag, halb acht. Die Küche steht voll, das Telefon läutet, dein Kellner blättert im Buch und sucht einen freien Tisch für vier. Drei Minuten, in denen niemand serviert. <strong style={{color:"var(--dark)",fontWeight:600}}>Butlery erledigt genau das in drei Sekunden.</strong>
            </p>
          </HeroIn>

          {pilot.phase === "flash" && pilot.deadline && (
            <HeroIn at={reduced?330:510} reduced={reduced} started={started}>
              <button onClick={()=>setShowModal(true)} className="btn-hover-primary" style={{
                display:"inline-flex",alignItems:"center",gap:"14px",flexWrap:"wrap",
                background:"rgba(255,92,53,.07)",border:"1px solid rgba(255,92,53,.28)",
                borderRadius:"100px",padding:"10px 12px 10px 22px",marginBottom:"22px",
                cursor:"pointer",fontFamily:"inherit",
              }}>
                <span style={{fontSize:"14px",fontWeight:600,color:"var(--dark)"}}>30 Tage gratis, solange die Uhr läuft</span>
                <span style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#FF5C35",borderRadius:"100px",padding:"7px 16px"}}>
                  <span style={{fontSize:"15px",color:"#fff"}}><Countdown deadline={pilot.deadline} compact/></span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </button>
            </HeroIn>
          )}

          <HeroIn at={reduced?300:540} reduced={reduced} started={started}>
            <div style={{display:"flex",alignItems:"center",gap:"14px",flexWrap:"wrap",marginBottom:"14px"}}>
              <button className="btn-hover-primary" onClick={()=>setShowModal(true)} style={{background:"#FF5C35",color:"#fff",border:"none",padding:"16px 34px",borderRadius:"100px",fontSize:"16px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
                {pilot.phase === "flash" ? "30 Tage gratis sichern"
                  : pilot.phase === "normal" ? "14 Tage kostenlos testen"
                  : "6 Monate gratis sichern"}
              </button>
              <a href="/demo" className="btn-hover-light link-arrow" style={{display:"inline-flex",alignItems:"center",gap:"9px",background:"var(--paper)",color:"var(--dark)",border:"1px solid var(--border)",padding:"15px 28px",borderRadius:"100px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",textDecoration:"none"}}>
                Erst selbst ausprobieren
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3.5 7.5h8M8 4l3.5 3.5L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
          </HeroIn>

          <HeroIn at={reduced?360:610} reduced={reduced} started={started}>
            {/* Was nach der Gratiszeit kommt, gehoert neben den Button und nicht
                auf eine Unterseite — sonst ist "gratis" ein Versprechen mit
                unausgesprochener Rechnung. */}
            <div style={{fontSize:"13px",color:"var(--muted)",lineHeight:1.7,marginBottom:"34px"}}>
              Keine Kreditkarte · Demo ohne Anmeldung<br/>
              Danach <a href="/pricing" style={{color:"var(--dark)",textDecoration:"underline",textUnderlineOffset:"3px"}}>129 €/Monat</a> · monatlich kündbar, keine Einrichtungsgebühr
            </div>
          </HeroIn>

          <HeroIn at={reduced?360:690} reduced={reduced} started={started}>
            {/* Echte, nachpruefbare Belege — verlinkt, nicht behauptet. */}
            <div style={{display:"flex",alignItems:"center",gap:"18px",flexWrap:"wrap",paddingTop:"24px",paddingBottom:"48px",borderTop:"1px solid var(--border)"}}>
              <span style={{fontSize:"12.5px",color:"var(--muted)"}}>Darüber berichtet haben</span>
              {[
                ["ORF Tirol","https://on.orf.at/video/14326374/tirol-heute-vom-07062026",true],
                ["Tiroler Tageszeitung","https://www.tt.com/artikel/30935315/noch-lehrling-und-schon-sein-eigener-chef-19-jaehriger-startet-mit-app-firma-durch",false],
                ["top.tirol","https://top.tirol/news/reservierungen-besser-im-blick",false],
              ].map(([l,h,video])=>(
                <a key={h as string} href={h as string} target="_blank" rel="noopener noreferrer" className="press-link"
                  style={{display:"inline-flex",alignItems:"center",gap:"7px",fontSize:"13px",color:"var(--dark)",fontWeight:500,textDecoration:"none"}}>
                  {/* Nur der ORF-Beitrag ist ein Video — das Dreieck sagt das,
                      ohne es hinschreiben zu muessen. */}
                  {video && <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true"><path d="M1 1l8 5-8 5z" fill="#FF5C35"/></svg>}
                  {l as string}
                </a>
              ))}
            </div>
          </HeroIn>
        </div>
      </div>

      {/* ===== SO ARBEITEST DU DAMIT — echte Screenshots, jeder erklaert =====
          Bewusst kein Raster aus gleichen Kacheln: die zwei breiten Ansichten
          laufen ueber die volle Breite, die drei schmalen wechseln die Seite.
          Das gibt Rhythmus, ohne dass eine Reihe wie die naechste aussieht. */}
      <section id="einblick" style={{background:"var(--paper)",padding:"120px 32px 110px"}}>
        <div style={{maxWidth:"1080px",margin:"0 auto"}}>
          <Reveal>
            <div style={{maxWidth:"620px",marginBottom:"64px"}}>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(30px,4.5vw,48px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.03em",lineHeight:1.08,marginBottom:"16px"}}>
                So sieht das aus, wenn du drin bist.
              </h2>
              <p style={{color:"var(--muted)",fontSize:"17px",lineHeight:1.8,fontWeight:400}}>
                Keine Mockups, keine gezeichneten Beispiele. Das sind Bildschirmfotos aus dem laufenden Butlery.
              </p>
            </div>
          </Reveal>

          {/* 1 — DASHBOARD (breit) */}
          <Reveal delay={60}>
            <div style={{marginBottom:"22px"}}>
              <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(22px,2.8vw,30px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.03em",lineHeight:1.2,marginBottom:"12px"}}>
                Jede Reservierung auf einen Blick.
              </h3>
              <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:400,maxWidth:"680px"}}>
                Uhrzeit, Gast, Personenzahl, Tisch und der Weg, über den gebucht wurde: alles in einer Zeile.
                Die Telefonnummer steht direkt beim Namen. Und was der Gast dazugeschrieben hat, steht auch dort.
                <strong style={{color:"var(--dark)",fontWeight:600}}> Bitte um 2 Kinderstühle</strong> siehst du beim Eindecken.
                Nicht erst, wenn die Familie schon vor dir steht.
              </p>
            </div>
            <div style={{borderRadius:"16px",overflow:"hidden",border:"1px solid var(--border)",boxShadow:"0 24px 60px rgba(26,26,46,.10)",marginBottom:"88px"}}>
              <img src="/dashboard.png" width={1697} height={780} loading="lazy" decoding="async" alt="Butlery Dashboard: Reservierungsliste mit Uhrzeit, Gast, Telefonnummer, Personenzahl, Tisch, Buchungskanal und Status; bei einem Gast steht die Notiz Bitte um 2 Kinderstühle" style={{width:"100%",height:"auto",display:"block"}}/>
            </div>
          </Reveal>

          {/* 2 — TISCHKARTE (breit) */}
          <Reveal delay={60}>
            <div style={{marginBottom:"22px"}}>
              <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(22px,2.8vw,30px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.03em",lineHeight:1.2,marginBottom:"12px"}}>
                Wer sitzt wann an welchem Tisch.
              </h3>
              <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:400,maxWidth:"680px"}}>
                Die Tischkarte legt den ganzen Tag auf eine Zeitachse: welcher Tisch belegt ist, ab wann, wie lange noch
                und mit wie vielen Personen. Freie Tische stehen als frei da. Die senkrechte orange Linie ist die
                aktuelle Uhrzeit. Ein Blick sagt dir, was läuft und was in zwanzig Minuten frei wird.
              </p>
            </div>
            <div style={{borderRadius:"16px",overflow:"hidden",border:"1px solid var(--border)",boxShadow:"0 24px 60px rgba(26,26,46,.10)",marginBottom:"88px"}}>
              <img src="/tischkarte.png" width={1680} height={839} loading="lazy" decoding="async" alt="Butlery Tischkarte: Zeitachse von 11 bis 22 Uhr, je Tisch eine Spur mit Reservierungsblöcken, Namen und Personenzahl, freie Tische als frei markiert, senkrechte Linie für die aktuelle Uhrzeit" style={{width:"100%",height:"auto",display:"block"}}/>
            </div>
          </Reveal>

          {/* 3 — WALK-IN (schmal, Bild links) */}
          <Reveal delay={60}>
            <div className="shot-row" style={{display:"grid",gridTemplateColumns:"minmax(0,420px) minmax(0,1fr)",gap:"60px",alignItems:"center",marginBottom:"88px"}}>
              <div style={{borderRadius:"16px",overflow:"hidden",border:"1px solid var(--border)",boxShadow:"0 24px 60px rgba(26,26,46,.10)"}}>
                <img src="/walk-in.png" width={458} height={507} loading="lazy" decoding="async" alt="Walk-in-Formular: Name des Gastes, Telefon, Personen, Datum und Uhrzeit; darunter der Vorschlag Tisch 4 für 4 Personen von 16:00 bis 18:30 Uhr" style={{width:"100%",height:"auto",display:"block"}}/>
              </div>
              <div>
                <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(22px,2.8vw,30px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.03em",lineHeight:1.2,marginBottom:"12px"}}>
                  Walk-in in zwanzig Sekunden.
                </h3>
                <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:400}}>
                  Es steht jemand vor dir und will einen Tisch. Name, Telefon, Personen, Datum, Uhrzeit. Mehr tippst du nicht.
                  Butlery sucht den passenden freien Tisch selbst und sagt dir, welcher es ist und bis wann er hält.
                  Bestätigen, eintragen, weiterarbeiten.
                </p>
              </div>
            </div>
          </Reveal>

          {/* 4 — MANUELL (schmal, Bild rechts) */}
          <Reveal delay={60}>
            <div className="shot-row shot-row-flip" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,420px)",gap:"60px",alignItems:"center",marginBottom:"88px"}}>
              <div>
                <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(22px,2.8vw,30px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.03em",lineHeight:1.2,marginBottom:"12px"}}>
                  Oder du entscheidest selbst.
                </h3>
                <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:400}}>
                  Bei der manuellen Reservierung wählst du die Tische von Hand: einen einzelnen oder mehrere zum
                  Zusammenschieben, mit laufender Kapazitätsanzeige darunter. Dazu hältst du fest, woher die Anfrage
                  kam, und im Notizfeld stehen Allergien, Sonderwünsche oder der Anlass. Der Stammgast am Fenster
                  bleibt der Stammgast am Fenster.
                </p>
              </div>
              <div style={{borderRadius:"16px",overflow:"hidden",border:"1px solid var(--border)",boxShadow:"0 24px 60px rgba(26,26,46,.10)"}}>
                <img src="/manuell-res.png" width={614} height={802} loading="lazy" decoding="async" alt="Manuelle Reservierung: Name, Telefon, E-Mail, Datum, Uhrzeit, Personen; Tischauswahl mit zwei markierten Tischen und der Anzeige 2 Tische, 9 Personen Kapazität; Kanalauswahl und Notizfeld" style={{width:"100%",height:"auto",display:"block"}}/>
              </div>
            </div>
          </Reveal>

          {/* 5 — WETTER (klein, Bild links) */}
          <Reveal delay={60}>
            <div className="shot-row" style={{display:"grid",gridTemplateColumns:"minmax(0,340px) minmax(0,1fr)",gap:"60px",alignItems:"center"}}>
              <div style={{borderRadius:"14px",overflow:"hidden",border:"1px solid var(--border)",boxShadow:"0 18px 44px rgba(26,26,46,.10)"}}>
                <img src="/wetter.png" width={324} height={222} loading="lazy" decoding="async" alt="Wetter-Panel im Dashboard: aktuell 29 Grad, überwiegend sonnig, darunter der Stundenverlauf mit Temperaturen und Regenwahrscheinlichkeit" style={{width:"100%",height:"auto",display:"block"}}/>
              </div>
              <div>
                <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(22px,2.8vw,30px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.03em",lineHeight:1.2,marginBottom:"12px"}}>
                  Wenn der Regen kommt, weißt du es vorher.
                </h3>
                <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:400,marginBottom:"14px"}}>
                  In den Einstellungen legst du fest, welche Tische draußen stehen. Butlery schaut aufs Wetter und
                  rechnet mit: Es kommt Regen, die Terrasse ist ausgebucht, drinnen ist auch alles vergeben. Dann
                  müssten deine Gäste bei Regen aufstehen und gehen, weil kein Platz mehr da ist.
                </p>
                <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:400}}>
                  Butlery meldet sich rechtzeitig und schlägt vor, ein paar Innentische freizuhalten.
                  <strong style={{color:"var(--dark)",fontWeight:600}}> Ob du das machst, entscheidest du.</strong> Der Puffer ist ein Vorschlag,
                  kein Automatismus, und du kannst ihn jederzeit wieder aufheben.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== PAIN ===== */}
      <section style={{background:"var(--paper)",padding:"130px 32px"}}>
        <div className="pain-grid" style={{maxWidth:"1080px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"center"}}>
          <Reveal>
            <div style={{background:"#fff",borderRadius:"24px",padding:"34px",boxShadow:"0 2px 6px rgba(26,26,46,.03), 0 24px 60px rgba(26,26,46,.06)"}}>
              <div style={{display:"flex",alignItems:"center",gap:"9px",marginBottom:"22px"}}>
                <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#FEE8E8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="#E24B4A" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <span style={{fontSize:"13px",fontWeight:600,color:"var(--dark)"}}>Kommt dir das bekannt vor?</span>
              </div>
              {[
                {t:"Das Telefon läutet mitten im Service",d:"Der Kellner lässt alles stehen. Gäste warten, Teller werden kalt."},
                {t:"Blättern, rechnen, nachdenken",d:"Passt Tisch 3? Krieg ich die vier dazwischen noch unter?"},
                {t:"Um 20 Uhr kommt niemand",d:"Der Tisch für vier bleibt leer. Der Abend ist gelaufen."},
                {t:"Zettel, WhatsApp, Zurufe",d:"Wer hat den Sechser gebucht? Und wer den zweiten dazu?"},
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
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(30px,4vw,44px)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.1,marginBottom:"22px"}}>Das Reservierungsbuch kostet dich jeden Abend Geld.</h2>
              <p style={{color:"var(--muted)",fontSize:"17px",lineHeight:1.85,fontWeight:300,marginBottom:"16px"}}>Nicht auf einmal. In Minuten, die niemand mitzählt: der Anruf zwischen zwei Tellern, das Blättern, das Zurückrufen, die Reservierung, die zweimal im Buch steht.</p>
              <p style={{color:"var(--muted)",fontSize:"17px",lineHeight:1.85,fontWeight:300}}>Rechne selbst: <strong style={{color:"var(--dark)",fontWeight:600}}>20 Anrufe am Abend, drei Minuten pro Stück</strong>. Das ist eine Stunde, in der dein Kellner am Telefon steht statt am Tisch. Jeden Abend.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== STATEMENT (große Typo-Bühne) ===== */}
      <section style={{background:"var(--paper-alt)",padding:"150px 32px"}}>
        <div style={{maxWidth:"900px",margin:"0 auto",textAlign:"center"}}>
          <Reveal>
            <h2 className="statement-h" style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(38px,6vw,64px)",fontWeight:700,color:"#1A1A2E",letterSpacing:"-0.04em",lineHeight:1.06,marginBottom:"28px"}}>
              Butlery nimmt dir<br/><span style={{color:"#FF5C35"}}>das Telefon ab.</span>
            </h2>
            <p style={{fontSize:"18px",color:"var(--muted)",fontWeight:300,maxWidth:"620px",margin:"0 auto 44px",lineHeight:1.85}}>
              WhatsApp, Buchungsseite, Telefon: Deine Gäste reservieren so, wie es ihnen passt. Bei dir landet trotzdem alles in derselben Liste.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"16px",background:"#1A1A2E",borderRadius:"100px",padding:"14px 28px 14px 18px",textAlign:"left"}}>
              <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,92,53,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M11 2l2.4 7.4H21l-6.2 4.5 2.4 7.4L11 17l-6.2 3.8 2.4-7.4L1 9.4h7.6z" stroke="#FF5C35" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              </div>
              <div style={{fontSize:"14px",fontWeight:500,color:"#FFFFFF",lineHeight:1.5}}>Der einzige Anbieter in Österreich, der alle drei Kanäle vereint.</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FEATURES (Bento) ===== */}
      <section id="features" style={{background:"var(--paper)",padding:"130px 32px"}}>
        <div style={{maxWidth:"1080px",margin:"0 auto"}}>
          <Reveal>
            <div style={{textAlign:"center",marginBottom:"70px"}}>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(30px,4.5vw,48px)",fontWeight:700,letterSpacing:"-0.03em",lineHeight:1.08,marginBottom:"18px"}}>Drei Wege zu buchen.<br/>Ein Dashboard für alles.</h2>
              <p style={{color:"var(--muted)",fontSize:"17px",fontWeight:300,maxWidth:"480px",margin:"0 auto"}}>Deine Gäste wählen selbst, wie sie reservieren. Du schaust trotzdem nur auf eine Liste.</p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="feat-big-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"18px",marginBottom:"18px"}}>
              <div className="soft-card" style={{background:"var(--dark)",borderRadius:"24px",padding:"36px"}}>
                <div style={{background:"rgba(255,92,53,.12)",borderRadius:"100px",padding:"4px 13px",fontSize:"12px",fontWeight:600,color:"#FF5C35",display:"inline-block",marginBottom:"22px"}}>WhatsApp KI</div>
                <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"24px",fontWeight:700,color:"#FFFFFF",marginBottom:"12px",letterSpacing:"-0.022em"}}>Der Gast schreibt. Die KI bucht.</h3>
                <p style={{color:"rgba(255,255,255,.5)",fontSize:"14.5px",lineHeight:1.7,fontWeight:300,marginBottom:"26px"}}>Deine Gäste schreiben auf WhatsApp, wie sie es gewohnt sind. Die KI fragt nach, was fehlt, und trägt die Reservierung ein. Auch um halb zwölf nachts.</p>
                <FeatureChatDemo/>
              </div>
              <div className="soft-card" style={{background:"#fff",borderRadius:"24px",padding:"36px",boxShadow:"0 2px 6px rgba(26,26,46,.03)"}}>
                <div style={{background:"rgba(255,92,53,.08)",borderRadius:"100px",padding:"4px 13px",fontSize:"12px",fontWeight:600,color:"#FF5C35",display:"inline-block",marginBottom:"22px"}}>KI Telefon · bald</div>
                <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"24px",fontWeight:700,color:"var(--dark)",marginBottom:"12px",letterSpacing:"-0.022em"}}>Es läutet. Die KI hebt ab.</h3>
                <p style={{color:"var(--muted)",fontSize:"14.5px",lineHeight:1.7,fontWeight:300,marginBottom:"26px"}}>Kein verpasster Anruf mehr, auch nicht mitten im Service. Die KI nimmt den Tisch auf und trägt ihn ein. Diese Funktion ist gerade in Arbeit.</p>
                <PhoneSteps/>
              </div>
            </div>
          </Reveal>
          {/* Der Screenshot, der hier stand, zeigte das alte Dashboard-Design
              und ist mit dem Umbau ungueltig geworden. Die Liste bleibt — sie
              nennt Dinge, die in den Screenshots oben nicht zu sehen sind. */}
          <Reveal delay={140}>
            <div className="feat-detail-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"56px",alignItems:"start",marginTop:"40px"}}>
              <div>
                <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(24px,3vw,32px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.03em",lineHeight:1.15,marginBottom:"14px"}}>
                  Und das läuft im Hintergrund.
                </h3>
                <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:400}}>
                  Die Ansichten weiter oben sind das, was du täglich vor dir hast. Das hier passiert, ohne dass du daran denken musst.
                </p>
              </div>

              <div>
                <div>
                  {[
                    {t:"Eigene Buchungsseite",d:"Dein Link für Instagram, Google und die Website. Gäste reservieren auch um drei Uhr früh."},
                    {t:"Eine Liste statt vier",d:"Egal woher die Reservierung kommt, sie steht am selben Ort und auf demselben Stand."},
                    {t:"Erinnerungen von selbst",d:"Der Gast bekommt 24 Stunden und 2 Stunden vorher eine Nachricht. Wer nicht kann, sagt jetzt ab, statt einfach nicht zu kommen."},
                    {t:"Nummer inklusive",d:"Du bekommst eine österreichische WhatsApp-Nummer, fertig eingerichtet. Dein privates Handy bleibt still."},
                  ].map((f,i,arr)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"13px",padding:"15px 0",borderBottom:i<arr.length-1?"1px solid var(--border)":"none"}}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0,marginTop:"3px"}}><path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="#FF5C35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <div>
                        <div style={{fontSize:"15px",fontWeight:600,color:"var(--dark)",marginBottom:"3px"}}>{f.t}</div>
                        <p style={{fontSize:"13.5px",color:"var(--muted)",lineHeight:1.65,fontWeight:300}}>{f.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== WHATSAPP NUMMER ===== */}
      <section style={{background:"var(--dark)",padding:"130px 32px",position:"relative",overflow:"hidden"}}>
        <div className="wa-section-grid" style={{maxWidth:"1080px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"center",position:"relative"}}>
          <Reveal>
            <div>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(30px,4vw,44px)",fontWeight:700,color:"#FFFFFF",letterSpacing:"-0.03em",lineHeight:1.1,marginBottom:"22px"}}>
                Deine eigene<br/><span style={{color:"#25D366"}}>WhatsApp-Nummer.</span>
              </h2>
              <p style={{color:"rgba(255,255,255,.55)",fontSize:"16px",lineHeight:1.85,fontWeight:300,marginBottom:"18px"}}>
                Du bekommst eine eigene österreichische WhatsApp-Business-Nummer, fertig eingerichtet. Deine Gäste schreiben dorthin, die KI antwortet und trägt ein.
              </p>
              <p style={{color:"rgba(255,255,255,.55)",fontSize:"16px",lineHeight:1.85,fontWeight:300,marginBottom:"34px"}}>
                Um die Einrichtung kümmere ich mich. Du installierst nichts, du stellst nichts ein, und deine private Nummer bleibt privat.
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:"17px"}}>
                {[
                  {t:"Eigene +43 Nummer",d:"Eine österreichische Nummer, die nur für Reservierungen da ist."},
                  {t:"Fertig eingerichtet",d:"Ich mache das Setup. Du bekommst eine Nummer, die schon läuft."},
                  {t:"Private Nummer bleibt privat",d:"Dein Handy bekommt am Sonntagabend keine Reservierungsanfragen mehr."},
                  {t:"Antwortet auch um 23 Uhr",d:"Nachts, sonntags, am 24. Dezember. Kein Gast wartet auf eine Antwort."},
                ].map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"13px"}}>
                    <div style={{width:"21px",height:"21px",borderRadius:"50%",background:"rgba(37,211,102,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#25D366" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div>
                      <div style={{fontSize:"14.5px",fontWeight:600,color:"#FFFFFF",marginBottom:"2px"}}>{item.t}</div>
                      <div style={{fontSize:"13px",color:"rgba(255,255,255,.62)",fontWeight:400,lineHeight:1.55}}>{item.d}</div>
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
      <section style={{background:"var(--paper-alt)",padding:"130px 32px"}}>
        <div style={{maxWidth:"1080px",margin:"0 auto"}}>
          <Reveal>
            <div style={{textAlign:"center",marginBottom:"76px"}}>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(30px,4.5vw,48px)",fontWeight:700,color:"#1A1A2E",letterSpacing:"-0.03em",lineHeight:1.08}}>
                Deine Gäste buchen,<br/><span style={{color:"#FF5C35"}}>wie sie möchten.</span>
              </h2>
            </div>
          </Reveal>

          <div className="booking-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"36px",alignItems:"start"}}>
            {[
              {
                img:"/iphone_whatsapp.png", imgW:458, imgH:928,
                alt:"WhatsApp-Chat auf dem iPhone: der Gast schreibt eine Reservierungsanfrage, der Butlery-Assistent fragt die fehlende Personenzahl nach und bestätigt den Tisch",
                dev:false,
                dotColor:"#25D366", labelColor:"#1A9D52", label:"WhatsApp KI", labelBg:"rgba(37,211,102,.08)",
                h:<>Der Gast schreibt.<br/>Die KI bucht.</>,
                p:"Deine Gäste schreiben, wie sie reden. Fehlt das Datum oder die Personenzahl, fragt die KI nach und bestätigt die Reservierung in Sekunden. Um Mitternacht genauso wie um sechs.",
              },
              {
                img:"/iphone_bookingpage.png", imgW:502, imgH:1010,
                alt:"Buchungsseite von Butlery auf dem iPhone: Auswahl von Datum, Uhrzeit und Personenzahl für die Tischreservierung",
                dev:false,
                // Kein Indigo/Violett — die Marke fuehrt Orange und Dunkelblau.
                dotColor:"#1A1A2E", labelColor:"#1A1A2E", label:"Online Buchung", labelBg:"rgba(26,26,46,.06)",
                h:<>Deine eigene<br/>Buchungsseite</>,
                p:"Du bekommst einen eigenen Link für Instagram, Google und deine Website. Der Gast wählt Datum, Uhrzeit und Personenzahl. Nach 30 Sekunden steht die Reservierung bei dir im Dashboard.",
              },
              {
                img:"/iphone_tel.png", imgW:458, imgH:928,
                alt:"Eingehender Anruf auf dem iPhone, den der Telefonassistent von Butlery entgegennimmt. Diese Funktion ist noch in Entwicklung",
                dev:true,
                dotColor:"#FF5C35", labelColor:"#FF5C35", label:"KI Telefon · bald", labelBg:"rgba(255,92,53,.08)",
                h:<>Es läutet.<br/>Die KI hebt ab.</>,
                p:"Kein verpasster Anruf mehr, auch nicht mitten im Service. Die KI nimmt den Tisch auf und trägt ihn ein, egal wie voll es gerade ist. Diese Funktion ist gerade in Arbeit.",
              },
            ].map((c,i)=>(
              <Reveal key={i} delay={i*120}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
                  <div style={{position:"relative",marginBottom:"30px",width:"272px"}}>
                    <div className="soft-card" style={{background:"#1A1A2E",borderRadius:"42px",padding:"10px",boxShadow:"0 40px 80px rgba(26,26,46,.18)"}}>
                      <img src={c.img} width={c.imgW} height={c.imgH} loading="lazy" decoding="async" alt={c.alt} style={{width:"100%",height:"auto",borderRadius:"34px",display:"block",filter:c.dev?"brightness(.55)":"none"}}/>
                    </div>
                    {c.dev && (
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"42px"}}>
                        <div style={{background:"#1A1A2E",borderRadius:"100px",padding:"9px 18px",fontSize:"11px",fontWeight:600,color:"rgba(255,255,255,.85)",letterSpacing:"0.027em"}}>
                          In Entwicklung
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:c.labelBg,borderRadius:"100px",padding:"5px 14px",marginBottom:"14px"}}>
                    <div style={{width:"6px",height:"6px",borderRadius:"50%",background:c.dotColor}}/>
                    <span style={{fontSize:"11px",color:c.labelColor,fontWeight:600}}>{c.label}</span>
                  </div>
                  <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"21px",fontWeight:700,color:"#1A1A2E",marginBottom:"11px",letterSpacing:"-0.024em",lineHeight:1.2}}>{c.h}</h3>
                  <p style={{fontSize:"13.5px",color:"var(--muted)",lineHeight:1.75,fontWeight:300,maxWidth:"300px"}}>{c.p}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Die Sektion "Vom Gast direkt ins Dashboard" bestand nur aus
          mac_iohon.png — dem alten Dashboard auf einem Mac. Mit dem Umbau ist
          das Bild ungueltig, und die Aussage traegt jetzt die Screenshot-
          Sektion oben. Ersatzlos entfernt. */}

      {/* ===== DEMO HIGHLIGHT ===== */}
      <section style={{background:"var(--dark)",padding:"120px 32px",position:"relative",overflow:"hidden"}}>
        <div className="demo-split" style={{maxWidth:"1080px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"72px",alignItems:"center",position:"relative",zIndex:1}}>
          <Reveal>
            <div>
              <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,92,53,.1)",borderRadius:"100px",padding:"7px 16px",marginBottom:"24px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35"}}/>
                <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>Live Demo · keine Anmeldung nötig</span>
              </div>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(30px,4vw,46px)",fontWeight:700,color:"#FFFFFF",letterSpacing:"-0.03em",lineHeight:1.1,marginBottom:"20px"}}>
                In <span style={{color:"#FF5C35"}}>30 Sekunden</span> weißt du, ob das etwas für dich ist.
              </h2>
              <p style={{color:"rgba(255,255,255,.6)",fontSize:"16px",lineHeight:1.8,fontWeight:300,marginBottom:"32px"}}>
                Buch dir selbst einen Tisch, so wie es dein Gast tun würde. Danach siehst du zu, wie die Reservierung im Dashboard auftaucht. Ohne Konto, ohne E-Mail-Adresse.
              </p>
              <a href="/demo" className="btn-hover-primary link-arrow" style={{display:"inline-flex",alignItems:"center",gap:"10px",background:"#FF5C35",color:"#fff",padding:"16px 32px",borderRadius:"100px",fontSize:"16px",fontWeight:500,textDecoration:"none"}}>
                Demo jetzt starten
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>
          </Reveal>

          {/* Hier stand ein Screenshot des alten Dashboards. Statt eines
              veralteten Bildes steht jetzt das, was in der Demo wirklich
              passiert — als Ablauf, nicht als Behauptung. */}
          <Reveal delay={120}>
            <div style={{border:"1px solid rgba(255,255,255,.1)",borderRadius:"16px",padding:"28px 30px"}}>
              {[
                {t:"Du buchst als Gast",d:"Auf der echten Buchungsseite eines Demo-Restaurants: Datum, Uhrzeit, Personenzahl."},
                {t:"Butlery sucht den Tisch",d:"Passende Größe, freier Zeitraum, bei Bedarf zwei Tische zusammengeschoben."},
                {t:"Die Reservierung steht da",d:"Sekunden später im Dashboard, mit Tisch, Buchungsweg und allem, was der Gast dazugeschrieben hat."},
              ].map((s,i,arr)=>(
                <div key={i} style={{display:"flex",gap:"14px",alignItems:"flex-start",padding:"14px 0",borderBottom:i<arr.length-1?"1px solid rgba(255,255,255,.08)":"none"}}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0,marginTop:"3px"}} aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="#FF5C35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <div>
                    <div style={{fontSize:"15px",fontWeight:600,color:"#FFFFFF",marginBottom:"3px"}}>{s.t}</div>
                    <p style={{fontSize:"13.5px",color:"rgba(255,255,255,.62)",lineHeight:1.7}}>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== NUMBERS ===== */}
      <section style={{background:"var(--paper)",padding:"130px 32px"}}>
        <div style={{maxWidth:"1080px",margin:"0 auto"}}>
          <Reveal>
            <div style={{textAlign:"center",marginBottom:"60px"}}>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(30px,4vw,44px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.03em"}}>Was du davon hast.</h2>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="numbers-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",background:"var(--dark)",borderRadius:"24px",overflow:"hidden"}}>
              {[
                {v:<CountUp end={60} prefix="-" suffix="%"/>,l:"weniger leere Tische, weil jeder Gast rechtzeitig erinnert wird"},
                {v:<CountUp end={2} suffix="h" duration={900}/>,l:"am Tag, die nicht mehr fürs Telefon draufgehen"},
                {v:<CountUp end={24} suffix="/7"/>,l:"nimmt Butlery Reservierungen an, auch wenn du schläfst"},
              ].map((n,i)=>(
                <div key={i} className="number-item" style={{padding:"52px 32px",textAlign:"center",borderRight:i<2?"1px solid rgba(255,255,255,.08)":"none"}}>
                  <div style={{fontFamily:"var(--font-playfair),serif",fontSize:"56px",fontWeight:700,color:"var(--orange)",letterSpacing:"-0.035em",marginBottom:"12px"}}>{n.v}</div>
                  <div style={{fontSize:"14px",color:"rgba(255,255,255,.5)",fontWeight:300,lineHeight:1.55,maxWidth:"230px",margin:"0 auto"}}>{n.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
          {/* Die drei Werte sind Zielgroessen, keine gemessenen Ergebnisse —
              bei drei Pilotbetrieben gibt es noch keine eigene Statistik. Das
              offen hinzuschreiben kostet weniger Vertrauen als die Zahl ohne
              Herkunft stehen zu lassen. */}
          <Reveal delay={160}>
            <p style={{fontSize:"13px",color:"var(--muted)",lineHeight:1.7,textAlign:"center",maxWidth:"620px",margin:"22px auto 0"}}>
              Das sind Richtwerte aus der Praxis, keine Garantie. Butlery startet gerade mit den ersten Betrieben. Sobald ich eigene Zahlen aus dem Pilotprogramm habe, stehen sie hier, auch wenn sie niedriger ausfallen.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== GRÜNDER ===== */}
      <section id="gruender" style={{background:"var(--paper-alt)",padding:"130px 32px"}}>
        <div className="founder-grid" style={{maxWidth:"1080px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"center"}}>
          <Reveal>
            <div>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(30px,4vw,44px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.03em",lineHeight:1.1,marginBottom:"24px"}}>
                Der Mensch hinter Butlery.
              </h2>
              <p style={{color:"var(--muted)",fontSize:"16.5px",lineHeight:1.85,fontWeight:300,marginBottom:"16px"}}>
                Ich bin Michael Kleinlercher, 19, aufgewachsen in St. Veit im Defereggental in Osttirol. An meinem 18. Geburtstag habe ich mein Unternehmen angemeldet: Michael Kleinlercher e.U. Nebenbei stecke ich bis heute in der Lehre, aktuell im letzten Lehrjahr.
              </p>
              <p style={{color:"var(--muted)",fontSize:"16.5px",lineHeight:1.85,fontWeight:300,marginBottom:"28px"}}>
                Vor Butlery habe ich Slotly gebaut, eine Terminbuchung für Friseure. Dort habe ich gelernt, dass eine Buchungsseite allein das Problem nicht löst. Die Leute rufen trotzdem an. In der Gastronomie ist es dasselbe, nur läutet es immer genau dann, wenn niemand Zeit hat.
              </p>

              <p style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(20px,2.6vw,25px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.024em",lineHeight:1.45,marginBottom:"16px"}}>
                Ja, ich nutze KI. Sie geht für deine Gäste ans Telefon, während ich <span style={{color:"var(--orange)"}}>persönlich für dich erreichbar</span> bleibe.
              </p>
              <p style={{color:"var(--muted)",fontSize:"16.5px",lineHeight:1.85,fontWeight:300,marginBottom:"30px"}}>
                Jedes Pilot-Restaurant richte ich selbst ein. Ich komme vorbei, wir legen die Tische an und stellen die Öffnungszeiten ein. Und wenn danach etwas nicht passt, rufst du mich an. Nicht ein Callcenter.
              </p>

              <a href="/blog/warum-ich-tablely-gebaut-habe" className="link-arrow" style={{display:"inline-flex",alignItems:"center",gap:"9px",fontSize:"15px",fontWeight:500,color:"var(--orange)",textDecoration:"none",marginBottom:"36px"}}>
                Die ganze Geschichte lesen
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M3.5 7.5h8M8 4l3.5 3.5L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>

              {/* Presse — dezente Zeile plus verlinkte ORF-Vorschau (kein iframe). */}
              <div style={{paddingTop:"26px",borderTop:"1px solid var(--border)"}}>
                <div style={{fontSize:"13px",color:"var(--muted)",marginBottom:"14px"}}>Über Butlery berichtet</div>
                <a href="https://on.orf.at/video/14326374/tirol-heute-vom-07062026" target="_blank" rel="noopener noreferrer"
                  style={{display:"flex",alignItems:"center",gap:"14px",padding:"14px 16px",background:"var(--paper)",border:"1px solid var(--border)",borderRadius:"14px",textDecoration:"none",marginBottom:"14px"}}>
                  <div style={{width:"38px",height:"38px",borderRadius:"50%",background:"rgba(255,92,53,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 2.2l8 4.8-8 4.8z" fill="var(--orange)"/></svg>
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:"14px",fontWeight:600,color:"var(--dark)",marginBottom:"2px"}}>ORF Tirol heute · 7. Juni 2026</div>
                    <div style={{fontSize:"12.5px",color:"var(--muted)"}}>Beitrag ansehen auf on.orf.at</div>
                  </div>
                </a>
                <div style={{fontSize:"13px",color:"var(--muted)",lineHeight:1.7}}>
                  Außerdem:{" "}
                  <a href="https://www.tt.com/artikel/30935315/noch-lehrling-und-schon-sein-eigener-chef-19-jaehriger-startet-mit-app-firma-durch" target="_blank" rel="noopener noreferrer" style={{color:"var(--orange)",textDecoration:"none"}}>Tiroler Tageszeitung</a>
                  {" · "}
                  <a href="https://top.tirol/news/reservierungen-besser-im-blick" target="_blank" rel="noopener noreferrer" style={{color:"var(--orange)",textDecoration:"none"}}>top.tirol</a>
                  {" · "}
                  <a href="/presse" style={{color:"var(--muted)",textDecoration:"underline"}}>alle Beiträge</a>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            {/* Porträt gross, Arbeitsfoto kleiner versetzt darunter — keine Karten. */}
            <div className="founder-photos" style={{position:"relative",paddingBottom:"96px"}}>
              <img
                src="/Michael_Kleinlercher.jpg"
                width={1133}
                height={1556}
                loading="lazy"
                decoding="async"
                alt="Michael Kleinlercher, Gründer von Butlery"
                style={{width:"100%",height:"auto",borderRadius:"18px",display:"block",boxShadow:"0 24px 60px rgba(26,26,46,.14)"}}
              />
              <img
                src="/computer.jpg"
                width={1170}
                height={874}
                loading="lazy"
                decoding="async"
                alt="Michael Kleinlercher beim Programmieren von Butlery"
                style={{
                  position:"absolute",right:"-10px",bottom:0,width:"62%",
                  borderRadius:"14px",display:"block",
                  border:"7px solid var(--paper-alt)",
                  boxShadow:"0 18px 44px rgba(26,26,46,.18)",
                }}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== WARUM Butlery ===== */}
      <section style={{background:"var(--paper)",padding:"120px 32px"}}>
        <div style={{maxWidth:"960px",margin:"0 auto"}}>
          <Reveal>
            <div style={{marginBottom:"18px"}}>
              <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(30px,4vw,44px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.03em",lineHeight:1.1,marginBottom:"16px"}}>
                Warum Butlery.
              </h2>
              <p style={{color:"var(--muted)",fontSize:"17px",lineHeight:1.8,fontWeight:300,maxWidth:"560px"}}>
                Vier Dinge, die du bei anderen Reservierungssystemen so nicht bekommst.
              </p>
            </div>
          </Reveal>

          {[
            {
              t:"Alle drei Wege in einem System",
              d:<>WhatsApp-KI, Telefon-KI und Online-Buchung laufen bei Butlery zusammen. Butlery ist der einzige Anbieter in Österreich, der alle drei Wege vereint. Du musst deinen Gästen also nicht vorschreiben, wie sie reservieren: geschrieben, angerufen oder online geklickt, alles landet in derselben Liste.</>,
            },
            {
              t:"Eingerichtet vom Gründer, nicht vom Ticketsystem",
              d:<>Ich richte jedes Restaurant persönlich ein: Tische, Tischgruppen, Öffnungszeiten, WhatsApp-Nummer. Wenn danach etwas nicht passt, schreibst du nicht an eine Support-Adresse in einem anderen Land, sondern an mich. Keine Warteschleife, keine Ticketnummer, kein Chatbot im Hilfecenter.</>,
            },
            {
              t:"Aus der Region, für die Region",
              d:<>Ich komme aus Osttirol und baue Butlery für die Gastronomie, die ich selbst kenne. Die KI grüßt mit Grüß Gott statt mit Hallo und kommt damit zurecht, dass ein Gast Samstag abends auf vier schreibt statt ein Datum und eine Uhrzeit.</>,
            },
            {
              t:"Transparente KI nach EU AI Act",
              d:<>Deine Gäste erfahren immer, dass sie mit einer KI sprechen: in der ersten WhatsApp-Nachricht und in der Begrüßung am Telefon. Was die KI macht, wo sie bewusst aufhört und wo ein Mensch entscheidet, steht offen auf der Seite zur <a href="/ki-transparenz" style={{color:"var(--orange)",textDecoration:"none",borderBottom:"1px solid rgba(255,92,53,.35)"}}>KI-Transparenz</a>.</>,
            },
          ].map((row,i,arr)=>(
            <Reveal key={i} delay={60+i*60}>
              <div className="why-row" style={{
                display:"grid",gridTemplateColumns:"minmax(0,.85fr) minmax(0,1.15fr)",gap:"48px",
                padding:"34px 0",borderTop:"1px solid var(--border)",
                borderBottom:i===arr.length-1?"1px solid var(--border)":"none",
              }}>
                <h3 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(19px,2.2vw,23px)",fontWeight:700,color:"var(--dark)",letterSpacing:"-0.022em",lineHeight:1.3}}>
                  {row.t}
                </h3>
                <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.85,fontWeight:300}}>
                  {row.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== PILOTPROGRAMM OSTTIROL ===== */}
      <section style={{background:"var(--paper-alt)",padding:"130px 32px"}}>
        <div style={{maxWidth:"880px",margin:"0 auto"}}>
          <Reveal>
            <div style={{background:"var(--dark)",borderRadius:"28px",padding:"clamp(40px,6vw,64px)",position:"relative",overflow:"hidden",textAlign:"center"}}>
              <div style={{position:"relative"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:"rgba(255,92,53,.1)",borderRadius:"100px",padding:"6px 15px",marginBottom:"24px"}}>
                  <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0}}/>
                  <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>{offer.sectionBadge}</span>
                </div>
                <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(30px,4.5vw,46px)",fontWeight:700,color:"#FFFFFF",letterSpacing:"-0.03em",lineHeight:1.1,marginBottom:"20px"}}>
                  {offer.sectionHead1}<br/><span style={{color:"#FF5C35"}}>{offer.sectionHead2}</span>
                </h2>
                <p style={{color:"rgba(255,255,255,.62)",fontSize:"16px",lineHeight:1.8,fontWeight:400,maxWidth:"560px",margin:"0 auto 34px"}}>
                  {offer.sectionBody}
                </p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"12px",justifyContent:"center",marginBottom:"38px"}}>
                  {offer.bullets.map((t,i)=>(
                    <div key={i} style={{display:"inline-flex",alignItems:"center",gap:"9px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:"100px",padding:"10px 18px"}}>
                      <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"rgba(255,92,53,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#FF5C35" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{fontSize:"13.5px",color:"rgba(255,255,255,.85)",fontWeight:500}}>{t}</span>
                    </div>
                  ))}
                </div>
                <a href="mailto:michael@tablely.at?subject=Pilotprogramm%20Osttirol%20%E2%80%94%20Platz%20sichern" className="btn-hover-primary link-arrow" style={{display:"inline-flex",alignItems:"center",gap:"10px",background:"#FF5C35",color:"#fff",padding:"16px 34px",borderRadius:"100px",fontSize:"16px",fontWeight:500,textDecoration:"none"}}>
                  {offer.cta}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section id="cta" style={{background:"var(--dark)",padding:"140px 24px",position:"relative",overflow:"hidden"}}>
        <Reveal>
          <div style={{maxWidth:"680px",margin:"0 auto",textAlign:"center",position:"relative"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"7px",background:"rgba(255,92,53,.1)",borderRadius:"100px",padding:"6px 15px",marginBottom:"26px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",flexShrink:0}}/>
              <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>{offer.ctaBadge}</span>
            </div>
            <h2 style={{fontFamily:"var(--font-playfair),serif",fontSize:"clamp(36px,6vw,58px)",fontWeight:700,color:"#FFFFFF",letterSpacing:"-0.035em",lineHeight:1.06,marginBottom:"20px"}}>
              {offer.ctaHead1}<br/><span style={{color:"#FF5C35"}}>{offer.ctaHead2}</span>
            </h2>
            <p style={{color:"rgba(255,255,255,.62)",fontSize:"16px",lineHeight:1.8,fontWeight:400,marginBottom:"28px",maxWidth:"540px",marginLeft:"auto",marginRight:"auto"}}>
              {offer.ctaBody}
            </p>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px",justifyContent:"center",marginBottom:"38px"}}>
              {["Eigene Buchungsseite","WhatsApp KI","Erinnerungen","Dashboard","Tischkarte","Walk-in Assistent","KI Telefon (bald)"].map((f,i)=>{
                const isDev=f.includes("bald");
                return (
                <div key={i} style={{fontSize:"12px",fontWeight:500,padding:"7px 15px",borderRadius:"100px",background:isDev?"rgba(255,255,255,.06)":"rgba(255,92,53,.1)",color:isDev?"rgba(255,255,255,.62)":"#FF5C35"}}>{f}</div>
              );})}
            </div>
            <button onClick={()=>setShowModal(true)} className="btn-hover-primary" style={{background:"#FF5C35",color:"#fff",border:"none",padding:"17px 40px",borderRadius:"100px",fontSize:"16px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginBottom:"16px"}}>
              {offer.cta}
            </button>
            <p style={{fontSize:"12px",color:"rgba(255,255,255,.62)"}}>Keine Kreditkarte. Keine Einrichtungsgebühr. Monatlich kündbar.</p>
          </div>
        </Reveal>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{padding:"36px 32px",borderTop:"1px solid var(--border)",background:"var(--paper)"}}>
        <div style={{maxWidth:"1080px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"16px"}}>
          <img src="/butlery-logo-dunkel.png" width={1416} height={496} loading="lazy" decoding="async" alt="Butlery" style={{height:"22px",width:"auto",display:"block"}}/>
          <div style={{display:"flex",gap:"22px",flexWrap:"wrap"}}>
            {[["Blog","/blog"],["Presse","/presse"],["KI-Transparenz","/ki-transparenz"],["Impressum","/impressum"],["Datenschutz","/datenschutz"],["AGB","/agb"]].map(([l,h])=>(
              <a key={h} href={h} className="nav-link" style={{fontSize:"12.5px",color:"var(--muted)",textDecoration:"none"}}>{l}</a>
            ))}
          </div>
          <p style={{fontSize:"12.5px",color:"var(--muted)"}}>© 2026 Butlery · Michael Kleinlercher e.U.</p>
        </div>
        {/* Die Beruhigung zum Namenswechsel steht hier statt im Hero: wer sie
            sucht, findet sie — wer nur buchen will, wird nicht aufgehalten. */}
        <div style={{maxWidth:"1080px",margin:"18px auto 0",paddingTop:"16px",borderTop:"1px solid var(--border)"}}>
          <p style={{fontSize:"12.5px",color:"var(--muted)",lineHeight:1.7}}>
            Tablely heißt jetzt Butlery. Gleicher Gründer, gleiche Software: deine Zugangsdaten, deine Reservierungen und deine Buchungsseite bleiben unverändert. tablely.at leitet weiterhin hierher.
          </p>
        </div>
      </footer>

      {showModal && <RegisterModal pilot={pilot} onClose={()=>setShowModal(false)}/>}
      {showPilot && !showModal && !pilot.loading && (
        <PilotPopup
          status={pilot}
          onClose={dismissPilot}
          onRegister={()=>{ dismissPilot(); setShowModal(true); }}
        />
      )}
      <CookieBanner />
    </>
  );
}