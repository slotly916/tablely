"use client";

import { useCallback, useEffect, useState } from "react";

/* ============================================================================
   COOKIE-EINWILLIGUNG + GOOGLE ANALYTICS

   Der Banner ist nicht Deko: Google Analytics wird erst geladen, NACHDEM
   zugestimmt wurde. Vorher geht kein einziger Request an Google raus. Das ist
   die strenge Auslegung (oesterreichische DSB), nicht die bequeme "laden und
   per Consent Mode blocken"-Variante.

   WICHTIG — der localStorage-Key `tablely_cookie_consent` darf NICHT umbenannt
   werden. Er wurde vom frueheren Banner auf der Landing Page bereits gesetzt;
   ein neuer Name wuerde die Einwilligung aller Bestandsnutzer zuruecksetzen und
   ihnen den Banner erneut vorlegen. Auch die Werte "accepted"/"declined"
   bleiben deshalb genau so.

   Widerruf: Einwilligung muss so leicht zurueckziehbar sein wie sie erteilt
   wurde. Dafuer gibt es openCookieSettings() — die Funktion feuert ein Event,
   auf das diese Komponente von ueberall her hoert.
   ========================================================================== */

const STORAGE_KEY = "tablely_cookie_consent";
const SETTINGS_EVENT = "butlery:cookie-settings";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

type Choice = "accepted" | "declined";

/** Oeffnet den Banner erneut, damit eine Entscheidung geaendert werden kann.
 *  Aus jeder Client-Komponente aufrufbar (Footer, Datenschutzseite). */
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT));
}

/** Fertiger Widerruf-Link fuer Server-Komponenten (PageShell-Footer,
 *  Datenschutzseite). Die duerfen keinen onClick-Handler setzen, deshalb liegt
 *  der Klick hier in einer Client-Komponente. */
export function CookieSettingsLink({ style }: { style?: React.CSSProperties }) {
  return (
    <button
      onClick={openCookieSettings}
      style={{
        fontSize:"12.5px",color:"var(--muted)",background:"transparent",
        border:"none",padding:0,cursor:"pointer",fontFamily:"inherit",
        textAlign:"left",
        ...style,
      }}
    >
      Cookie-Einstellungen
    </button>
  );
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/* GA nachladen. Passiert genau einmal und nur nach Zustimmung. */
function loadAnalytics() {
  if (!GA_ID || document.getElementById("ga-script")) return;

  window.dataLayer = window.dataLayer || [];
  // Bewusst function() statt Arrow: gtag reicht `arguments` unveraendert weiter,
  // eine Arrow-Funktion hat kein eigenes arguments-Objekt.
  window.gtag = function gtag() { window.dataLayer!.push(arguments); };
  window.gtag("js", new Date());
  // IP-Kuerzung und keine Werbe-Signale: wir messen Reichweite, nichts sonst.
  window.gtag("config", GA_ID, { anonymize_ip: true, allow_google_signals: false });

  const s = document.createElement("script");
  s.id = "ga-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

/* Beim Widerruf die bereits gesetzten GA-Cookies wieder entfernen. Ohne das
   bliebe die Kennung bis zu zwei Jahre liegen, obwohl widersprochen wurde. */
function clearAnalyticsCookies() {
  const host = window.location.hostname;
  // Auch die Registrable Domain abraeumen: GA setzt auf .butlery.at, nicht auf
  // den vollen Host — nur den Host zu loeschen laesst das Cookie stehen.
  const domains = [host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  document.cookie.split(";").forEach(entry => {
    const name = entry.split("=")[0]?.trim();
    if (!name || !/^_ga|^_gid$|^_gat/.test(name)) return;
    domains.forEach(d => {
      document.cookie = `${name}=; path=/; domain=${d}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  // `shown` steuert die Bewegung, `open` das Vorhandensein im DOM. Getrennt,
  // damit das Verschwinden noch animieren kann, bevor der Knoten weg ist.
  const [shown, setShown] = useState(false);

  const reveal = useCallback(() => {
    setOpen(true);
    // Ein Frame Abstand, sonst startet der Uebergang beim Einhaengen nicht.
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }, []);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch {}

    if (stored === "accepted") loadAnalytics();
    if (!stored) {
      // Kurz warten: der Banner soll nicht mit dem Seitenaufbau um
      // Aufmerksamkeit streiten, sondern danach dazukommen.
      const t = setTimeout(reveal, 700);
      return () => clearTimeout(t);
    }
  }, [reveal]);

  // Widerruf von aussen (Footer, Datenschutzseite).
  useEffect(() => {
    const onOpen = () => reveal();
    window.addEventListener(SETTINGS_EVENT, onOpen);
    return () => window.removeEventListener(SETTINGS_EVENT, onOpen);
  }, [reveal]);

  function decide(choice: Choice) {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch {}
    if (choice === "accepted") loadAnalytics();
    else clearAnalyticsCookies();

    setShown(false);
    // Auf demselben Weg hinaus, auf dem er hereinkam (§7 Spatial Consistency).
    setTimeout(() => setOpen(false), 320);
  }

  if (!open) return null;

  return (
    <>
      <style>{`
        /* Rueckmeldung auf den Druck, nicht erst auf das Loslassen (§1). */
        .cc-btn{transition:transform .2s cubic-bezier(.16,1,.3,1),background .2s ease,border-color .2s ease;}
        .cc-btn:active{transform:scale(.97);}
        .cc-accept:hover{background:#F04E28;}
        .cc-decline:hover{background:var(--paper-alt);border-color:#CBD0D8;}
        .cc-link:hover{text-decoration:underline;text-underline-offset:3px;}

        @media(max-width:560px){
          .cc-card{flex-direction:column;align-items:stretch;gap:18px;}
          .cc-actions{display:grid;grid-template-columns:1fr 1fr;}
          .cc-actions button{width:100%;}
        }
        /* Bewegung reduzieren: reine Deckkraft, keine Verschiebung (§14). */
        @media(prefers-reduced-motion:reduce){
          .cc-shell{transition:opacity .2s ease!important;transform:none!important;}
          .cc-btn:active{transform:none;}
        }
        /* Mehr Kontrast: Flaeche und Kante deutlich statt zart (§14). */
        @media(prefers-contrast:more){
          .cc-card{border-color:#1A1A2E!important;border-width:2px!important;}
          .cc-decline{border-color:#1A1A2E!important;}
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="false"
        aria-label="Cookie-Einstellungen"
        className="cc-shell"
        style={{
          position:"fixed",left:"20px",right:"20px",bottom:"20px",zIndex:600,
          display:"flex",justifyContent:"center",
          fontFamily:"var(--font-sans)",pointerEvents:"none",
          opacity: shown ? 1 : 0,
          // Kritisch gedaempft, kein Ueberschwingen: hier ist keine Geste im
          // Spiel, die einen Bounce rechtfertigen wuerde (§4).
          transform: shown ? "translateY(0)" : "translateY(14px)",
          transition:"opacity .38s cubic-bezier(.16,1,.3,1), transform .38s cubic-bezier(.16,1,.3,1)",
        }}
      >
        <div
          className="cc-card"
          style={{
            pointerEvents:"auto",
            /* Opake Flaeche + Hairline statt backdrop-filter: die Landing Page
               fuehrt bewusst kein Blur-Glas (Anti-Slop-Regel in CLAUDE.md). */
            background:"var(--paper)",
            border:"1px solid var(--border)",borderRadius:"20px",
            boxShadow:"0 20px 60px rgba(26,26,46,.16)",padding:"22px 26px",
            maxWidth:"720px",width:"100%",
            display:"flex",alignItems:"center",gap:"24px",flexWrap:"wrap",
          }}
        >
          <div style={{flex:1,minWidth:"240px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
              <div style={{width:"22px",height:"22px",borderRadius:"7px",background:"rgba(255,92,53,.08)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="5" stroke="#FF5C35" strokeWidth="1.2"/><circle cx="4.5" cy="5" r=".8" fill="#FF5C35"/><circle cx="7.5" cy="7" r=".8" fill="#FF5C35"/><circle cx="5" cy="8" r=".6" fill="#FF5C35"/></svg>
              </div>
              <span style={{fontSize:"14px",fontWeight:600,color:"#1A1A2E",letterSpacing:"-0.005em"}}>Dürfen wir mitzählen?</span>
            </div>
            <p style={{fontSize:"13px",color:"var(--muted)",lineHeight:1.6,fontWeight:400}}>
              Notwendige Cookies halten die Seite am Laufen, die brauchen wir immer. Zusätzlich würde ich
              gern mit Google Analytics sehen, welche Seiten gelesen werden. Sagst du nein, wird nichts
              geladen und nichts gemessen. Details in der{" "}
              <a href="/datenschutz" className="cc-link" style={{color:"#FF5C35",textDecoration:"none",fontWeight:500}}>Datenschutzerklärung</a>.
            </p>
          </div>
          {/* Ablehnen steht gleichrangig neben Zustimmen: gleiche Groesse,
              gleicher Klick, keine versteckte zweite Ebene (§16 Agency). */}
          <div className="cc-actions" style={{display:"flex",gap:"10px",flexShrink:0}}>
            <button
              onClick={()=>decide("declined")}
              className="cc-btn cc-decline"
              style={{
                background:"#fff",color:"#1A1A2E",border:"1px solid var(--border)",
                padding:"11px 22px",borderRadius:"100px",fontSize:"13px",fontWeight:500,
                cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",
              }}
            >
              Nur notwendige
            </button>
            <button
              onClick={()=>decide("accepted")}
              className="cc-btn cc-accept"
              style={{
                background:"#FF5C35",color:"#fff",border:"1px solid #FF5C35",
                padding:"11px 22px",borderRadius:"100px",fontSize:"13px",fontWeight:500,
                cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",
              }}
            >
              Einverstanden
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
