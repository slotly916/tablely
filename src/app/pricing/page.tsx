"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Pricing() {
  const router = useRouter();
  // Echte Wartelisten-Zahl aus der Datenbank. Vorher stand hier eine feste 27
  // neben vier erfundenen Avataren, und die "Early Access Plaetze" kamen aus
  // einem localStorage-Key, den nichts je geschrieben hat — die Zahl war also
  // dauerhaft 5. Beides war ein Beleg, den es nicht gab.
  const [waitlist, setWaitlist] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/waitlist-count")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (active && d && typeof d.count === "number") setWaitlist(d.count); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const plans = [
    {
      name: "Standard",
      price: 90,
      tagline: "Für kleinere Restaurants die online sichtbar werden wollen",
      cta: "Online sichtbar werden",
      badge: null,
      isDark: false,
      features: [
        { text: "Online-Reservierungen 24/7 annehmen", included: true, top: true },
        { text: "Schluss mit verlorenen Zetteln und Notizbüchern", included: true, top: true },
        { text: "Übersichtliches Dashboard für dein Team", included: true },
        { text: "Walk-in Assistent für spontane Gäste", included: true },
        { text: "E-Mail Bestätigungen automatisch", included: true },
        { text: "Tisch- und Kapazitätsverwaltung", included: true },
        { text: "App fürs Smartphone & Tablet", included: true },
        { text: "Wetter-Prognose & Schlechtwetter-Puffer", included: false },
        { text: "WhatsApp KI & eigene WhatsApp Nummer", included: false },
        { text: "Telefon KI", included: false },
      ],
    },
    {
      name: "Plus",
      price: 129,
      tagline: "Für Restaurants die endlich Ruhe im Service wollen",
      cta: "Kein Reservierungsstress mehr",
      // Vorher: "Die meisten Restaurants waehlen Plus" — eine Aussage ueber
      // Kundenverhalten, die es bei drei Pilotbetrieben noch nicht geben kann.
      badge: "Empfohlen",
      isDark: true,
      features: [
        { text: "Reservierungen rund um die Uhr automatisch", included: true, top: true, bold: true },
        { text: "Kein Reservierungsstress mehr im Service", included: true, top: true, bold: true },
        { text: "Bis zu 60% weniger No-Shows durch automatische Erinnerungen", included: true, top: true, bold: true },
        { text: "Schluss mit dem WhatsApp-Chaos — KI antwortet selbst", included: true },
        { text: "Eigene österreichische WhatsApp Nummer", included: true },
        { text: "Versteht natürliche Sprache (morgen, abends, Familie)", included: true },
        { text: "Automatische WhatsApp Bestätigungen", included: true },
        { text: "Wetter-Prognose & Schlechtwetter-Puffer für den Außenbereich", included: true },
        { text: "Alles aus Standard inklusive", included: true },
        { text: "Telefon KI", included: false },
      ],
    },
    {
      name: "Premium",
      price: 249,
      tagline: "Für professionelle Restaurants die nichts dem Zufall überlassen",
      cta: "Verliere keine Reservierung mehr",
      badge: "Premium",
      isDark: false,
      isPremium: true,
      features: [
        { text: "Verliere keine Reservierung mehr — auch nachts oder im Mittagsstress", included: true, top: true, bold: true },
        { text: "Telefon klingelt während Service? KI nimmt ab.", included: true, top: true, bold: true },
        { text: "KI spricht natürliches Deutsch & Englisch am Telefon", included: true },
        { text: "Eigene österreichische Festnetznummer", included: true },
        { text: "Priorisierter Support (max 2h Antwortzeit)", included: true },
        { text: "Persönliches Onboarding mit dem Gründer", included: true },
        { text: "Custom Anpassungen auf Anfrage", included: true },
        { text: "Alles aus Plus inklusive", included: true, bold: true },
      ],
    },
  ];

  const muted = "#6B6B80";

  return (
    <div style={{minHeight:"100vh",background:"#F5F0EB",fontFamily:"var(--font-sans)"}}>
      <style>{`
        /* Playfair kommt selbst gehostet aus dem Root-Layout (--font-playfair).
           Der frühere Google-Fonts-@import war ein render-blockierender
           Fremdrequest auf einer indexierbaren Seite. */
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .plan-card{animation:slideUp .6s ease backwards;}
        .plan-card:nth-child(1){animation-delay:.05s;}
        .plan-card:nth-child(2){animation-delay:.15s;}
        .plan-card:nth-child(3){animation-delay:.25s;}
        .cta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(255,92,53,.35)!important;}
        .nav-link:hover{color:#1A1A2E!important;}
        .pulse-dot{animation:pulse 2s ease-in-out infinite;}
      `}</style>

      {/* NAV */}
      <nav style={{padding:"20px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:"1280px",margin:"0 auto"}}>
        <a href="/" style={{textDecoration:"none",fontFamily:"var(--font-playfair),Georgia,serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E"}}>
          <img src="/butlery-logo-dunkel.png" alt="Butlery" style={{height:"24px",width:"auto",display:"inline-block",verticalAlign:"middle"}}/>
        </a>
        <div style={{display:"flex",gap:"28px",alignItems:"center"}}>
          <a href="/#funktionen" className="nav-link" style={{textDecoration:"none",fontSize:"14px",color:muted,fontWeight:500}}>Funktionen</a>
          <a href="/pricing" className="nav-link" style={{textDecoration:"none",fontSize:"14px",color:"#1A1A2E",fontWeight:500}}>Preise</a>
          <a href="/#app" className="nav-link" style={{textDecoration:"none",fontSize:"14px",color:muted,fontWeight:500}}>App</a>
          <a href="/register" style={{textDecoration:"none",padding:"8px 20px",background:"#FF5C35",color:"#fff",borderRadius:"8px",fontSize:"13px",fontWeight:500}}>
            Jetzt gratis testen
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{padding:"60px 24px 30px",textAlign:"center",maxWidth:"760px",margin:"0 auto"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",padding:"6px 14px",borderRadius:"20px",background:"rgba(255,92,53,.08)",border:"1px solid rgba(255,92,53,.2)",marginBottom:"24px",fontSize:"12px",color:"#FF5C35",fontWeight:600}}>
          <span className="pulse-dot" style={{display:"inline-block",width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35"}}/>
          Spezialist für Restaurants im DACH-Raum
        </div>
        <h1 style={{fontFamily:"var(--font-playfair),Georgia,serif",fontSize:"clamp(36px,5vw,54px)",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1.5px",lineHeight:1.1,marginBottom:"18px"}}>
          Schluss mit verlorenen Reservierungen.<br/>
          <span style={{fontStyle:"italic",color:"#FF5C35"}}>Ein Plan für jede Größe.</span>
        </h1>
        <p style={{fontSize:"17px",color:muted,fontWeight:300,lineHeight:1.6,marginBottom:"20px",maxWidth:"600px",margin:"0 auto 20px"}}>
          Nur eine verpasste 4er-Reservierung pro Woche kostet oft mehr als Butlery.<br/>
          Sieh es nicht als Kosten — sondern als <strong style={{color:"#1A1A2E"}}>Schutz vor Umsatzverlust</strong>.
        </p>

        {/* Belege — ausschliesslich nachpruefbare: die Presseberichte sind
            verlinkt, die Wartelisten-Zahl kommt aus der Datenbank und wird
            weggelassen solange sie klein oder nicht ladbar ist. */}
        <div style={{display:"inline-flex",alignItems:"center",gap:"14px",padding:"10px 18px",background:"#fff",border:"1px solid #EDE8E3",borderRadius:"12px",marginBottom:"12px",flexWrap:"wrap",justifyContent:"center"}}>
          <span style={{fontSize:"12px",color:muted}}>Berichtet über Butlery:</span>
          <a href="https://on.orf.at/video/14326374/tirol-heute-vom-07062026" target="_blank" rel="noopener noreferrer" style={{fontSize:"12px",color:"#1A1A2E",fontWeight:600,textDecoration:"none"}}>ORF Tirol</a>
          <div style={{width:"1px",height:"14px",background:"#EDE8E3"}}/>
          <a href="https://www.tt.com/artikel/30935315/noch-lehrling-und-schon-sein-eigener-chef-19-jaehriger-startet-mit-app-firma-durch" target="_blank" rel="noopener noreferrer" style={{fontSize:"12px",color:"#1A1A2E",fontWeight:600,textDecoration:"none"}}>Tiroler Tageszeitung</a>
          <div style={{width:"1px",height:"14px",background:"#EDE8E3"}}/>
          <a href="https://top.tirol/news/reservierungen-besser-im-blick" target="_blank" rel="noopener noreferrer" style={{fontSize:"12px",color:"#1A1A2E",fontWeight:600,textDecoration:"none"}}>top.tirol</a>
          {waitlist !== null && waitlist >= 10 && (
            <>
              <div style={{width:"1px",height:"14px",background:"#EDE8E3"}}/>
              <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:600}}>{waitlist} auf der Warteliste</span>
            </>
          )}
        </div>

        <div style={{fontSize:"12px",color:muted,marginTop:"6px"}}>
          Monatlich kündbar · Keine Einrichtungsgebühr · Inkl. MwSt
        </div>
      </section>

      {/* PLANS */}
      <section style={{padding:"30px 24px 60px",maxWidth:"1180px",margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:"22px",alignItems:"stretch"}}>
          {plans.map((plan, i) => (
            <div key={i} className="plan-card" style={{
              background: plan.isDark ? "linear-gradient(180deg,#1A1A2E 0%,#252540 100%)" : "#fff",
              borderRadius:"24px",
              padding: plan.isDark ? "36px 30px 32px" : "32px 28px",
              border: plan.isDark ? "1px solid rgba(255,92,53,.3)" : (plan.isPremium ? "1px solid #1A1A2E" : "1px solid #EDE8E3"),
              position:"relative",
              boxShadow: plan.isDark ? "0 24px 60px rgba(255,92,53,.18)" : "0 4px 20px rgba(0,0,0,.04)",
              display:"flex",
              flexDirection:"column",
              transform: plan.isDark ? "scale(1.03)" : "none",
              zIndex: plan.isDark ? 2 : 1,
            }}>
              {plan.badge && plan.isDark && (
                <div style={{
                  position:"absolute",top:"-14px",left:"50%",transform:"translateX(-50%)",
                  background:"#FF5C35",color:"#fff",fontSize:"11px",fontWeight:600,
                  padding:"6px 16px",borderRadius:"20px",letterSpacing:".4px",
                  whiteSpace:"nowrap",boxShadow:"0 4px 12px rgba(255,92,53,.3)",
                }}>
                  ★ {plan.badge}
                </div>
              )}
              {plan.isPremium && (
                <div style={{
                  position:"absolute",top:"-12px",left:"50%",transform:"translateX(-50%)",
                  background:"#1A1A2E",color:"#FFD700",fontSize:"10px",fontWeight:700,
                  padding:"5px 14px",borderRadius:"20px",letterSpacing:"1.2px",textTransform:"uppercase",
                }}>
                  ◆ Premium
                </div>
              )}
              
              <div style={{marginBottom:"22px"}}>
                <div style={{
                  fontSize:"13px",
                  color: plan.isDark ? "rgba(255,255,255,.6)" : muted,
                  fontWeight:600,
                  textTransform:"uppercase",
                  letterSpacing:".8px",
                  marginBottom:"6px",
                }}>
                  {plan.name}
                </div>
                <div style={{display:"flex",alignItems:"baseline",gap:"4px",marginBottom:"8px"}}>
                  <span style={{
                    fontFamily:"var(--font-playfair),Georgia,serif",
                    fontSize: plan.isDark ? "56px" : "48px",
                    fontWeight:700,
                    color: plan.isDark ? "#FFFAF5" : "#1A1A2E",
                    letterSpacing:"-2px",
                    lineHeight:1,
                  }}>
                    {plan.price}€
                  </span>
                  <span style={{fontSize:"14px",color: plan.isDark ? "rgba(255,255,255,.5)" : muted,marginLeft:"2px"}}>
                    /Monat
                  </span>
                </div>
                <div style={{fontSize:"13px",color: plan.isDark ? "rgba(255,255,255,.7)" : muted,fontWeight:300,lineHeight:1.5}}>
                  {plan.tagline}
                </div>
              </div>

              <a href="/register" className="cta-btn" style={{
                display:"block",
                textAlign:"center",
                padding: plan.isDark ? "15px" : "13px",
                borderRadius:"12px",
                background: plan.isDark ? "#FF5C35" : (plan.isPremium ? "#1A1A2E" : "transparent"),
                color: plan.isDark || plan.isPremium ? "#fff" : "#1A1A2E",
                border: !plan.isDark && !plan.isPremium ? "1px solid #1A1A2E" : "none",
                fontSize: plan.isDark ? "14px" : "13px",
                fontWeight:600,
                textDecoration:"none",
                marginBottom:"24px",
                transition:"all .2s",
                letterSpacing:".3px",
              }}>
                {plan.cta} →
              </a>

              <div style={{display:"flex",flexDirection:"column",gap:"11px",flex:1}}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{
                    display:"flex",
                    alignItems:"flex-start",
                    gap:"10px",
                    paddingBottom: f.top && plan.features[j+1] && !plan.features[j+1].top ? "10px" : "0",
                    borderBottom: f.top && plan.features[j+1] && !plan.features[j+1].top 
                      ? (plan.isDark ? "1px solid rgba(255,255,255,.1)" : "1px solid #F0EBE3")
                      : "none",
                    marginBottom: f.top && plan.features[j+1] && !plan.features[j+1].top ? "4px" : "0",
                  }}>
                    <div style={{
                      width:"20px",height:"20px",borderRadius:"50%",
                      background: f.included 
                        ? (plan.isDark ? "rgba(52,211,153,.25)" : "rgba(52,211,153,.15)")
                        : (plan.isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.04)"),
                      display:"flex",alignItems:"center",justifyContent:"center",
                      flexShrink:0,marginTop:"1px",
                    }}>
                      {f.included ? (
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M2 5.5l2.2 2.2 4.8-5.4" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M2 2l4 4M6 2l-4 4" stroke={plan.isDark ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.3)"} strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                    <span style={{
                      fontSize:"13.5px",
                      color: f.included 
                        ? (plan.isDark ? "#FFFAF5" : "#1A1A2E")
                        : (plan.isDark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)"),
                      fontWeight: ("bold" in f && f.bold) ? 600 : (("top" in f && f.top) ? 500 : 400),
                      lineHeight:1.45,
                    }}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Trust Strip */}
        <div style={{
          marginTop:"36px",
          background:"#fff",
          borderRadius:"16px",
          padding:"22px 28px",
          border:"1px solid #EDE8E3",
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
          gap:"20px",
        }}>
          {[
            {title:"Keine Setup-Gebühr", desc:"Onboarding und Migration sind kostenlos"},
            {title:"Kostenlos testen", desc:"Volle Funktionalität, keine Kreditkarte"},
            {title:"Monatlich kündbar", desc:"Keine Mindestvertragslaufzeit"},
            {title:"Made in Österreich", desc:"Support direkt vom Gründer aus Osttirol"},
          ].map((item, i) => (
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
              <div style={{width:"22px",height:"22px",borderRadius:"50%",background:"rgba(52,211,153,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#34D399",fontSize:"12px",fontWeight:700}}>✓</div>
              <div>
                <div style={{fontSize:"13px",fontWeight:600,color:"#1A1A2E",marginBottom:"3px"}}>{item.title}</div>
                <div style={{fontSize:"12px",color:muted,lineHeight:1.5}}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM/LÖSUNG SEKTION */}
      <section style={{padding:"40px 24px 60px",background:"#fff",borderTop:"1px solid #EDE8E3",borderBottom:"1px solid #EDE8E3"}}>
        <div style={{maxWidth:"960px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"40px"}}>
            <div style={{fontSize:"12px",color:"#FF5C35",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"10px"}}>Du kennst das?</div>
            <h2 style={{fontFamily:"var(--font-playfair),Georgia,serif",fontSize:"32px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1px",lineHeight:1.2}}>
              Reservierungschaos kostet dich täglich Geld.
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"20px"}}>
            {[
              {problem:"Das Telefon klingelt mitten im Service", solution:"KI nimmt automatisch ab — auch wenn niemand frei ist"},
              {problem:"WhatsApp-Nachrichten gehen verloren", solution:"KI antwortet sofort und bucht direkt im System"},
              {problem:"Reservierungen werden auf Zettel notiert", solution:"Alles digital, sofort sichtbar für dein ganzes Team"},
              {problem:"Gäste kommen nicht (No-Shows)", solution:"Automatische Erinnerungen 24h und 2h vorher"},
              {problem:"Doppelbuchungen bei großen Gruppen", solution:"Intelligente Tischzuweisung mit Kombinations-Erkennung"},
              {problem:"Mitarbeiter sind genervt vom Telefon", solution:"Mehr Zeit für Gäste — weniger Stress am Pass"},
            ].map((item, i) => (
              <div key={i} style={{padding:"20px",background:"#F5F0EB",borderRadius:"14px",border:"1px solid #EDE8E3"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"12px"}}>
                  <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"rgba(239,68,68,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#F87171",fontSize:"12px",fontWeight:700}}>✕</div>
                  <div style={{fontSize:"13.5px",color:"#1A1A2E",fontWeight:500,lineHeight:1.4}}>{item.problem}</div>
                </div>
                <div style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
                  <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"rgba(52,211,153,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#34D399",fontSize:"12px",fontWeight:700}}>✓</div>
                  <div style={{fontSize:"13.5px",color:muted,lineHeight:1.5}}>{item.solution}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{padding:"60px 24px 40px",maxWidth:"720px",margin:"0 auto"}}>
        <h2 style={{fontFamily:"var(--font-playfair),Georgia,serif",fontSize:"32px",fontWeight:700,color:"#1A1A2E",textAlign:"center",marginBottom:"32px",letterSpacing:"-1px"}}>
          Häufige Fragen
        </h2>
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          {[
            {q:"Lohnt sich Butlery wirklich für mein Restaurant?", a:"Schon eine einzige verpasste 4er-Reservierung pro Woche kostet bei einem durchschnittlichen Bonwert mehr als ein Plus-Abo. Butlery ist kein Kostenfaktor — es ist Schutz vor Umsatzverlust."},
            {q:"Kann ich später wechseln?", a:"Ja, jederzeit. Upgrade oder Downgrade einfach in den Einstellungen, die Änderung gilt ab dem nächsten Monat."},
            {q:"Was passiert nach der Testphase?", a:"Nichts automatisch. Wir fragen dich rechtzeitig ob du weitermachen willst und welcher Plan zu dir passt. Keine versteckten Abbuchungen. Wie lang deine Testphase ist, siehst du bei der Anmeldung auf der Startseite."},
            {q:"Wie schnell ist die WhatsApp Nummer einsatzbereit?", a:"Innerhalb von 12-24 Stunden nach deiner Anmeldung bekommst du eine eigene österreichische WhatsApp Business Nummer — komplett von uns eingerichtet."},
            {q:"Brauche ich technische Kenntnisse?", a:"Nein. Das Onboarding dauert 5 Minuten, die App funktioniert auf jedem Smartphone und Tablet. Bei Premium machen wir das Setup persönlich mit dir am Telefon."},
            {q:"Warum sollte ich Butlery und nicht eine internationale Lösung wählen?", a:"Wir sind Spezialist für Restaurants im DACH-Raum. Die KI versteht Dialekt, kennt österreichische Eigenheiten, und wir sprechen Deutsch — keine Hotline in Indien, sondern direkter Draht zum Gründer."},
          ].map((faq, i) => (
            <details key={i} style={{background:"#fff",border:"1px solid #EDE8E3",borderRadius:"12px",padding:"16px 20px",cursor:"pointer"}}>
              <summary style={{fontSize:"14px",fontWeight:600,color:"#1A1A2E",listStyle:"none"}}>
                {faq.q}
              </summary>
              <div style={{fontSize:"13px",color:muted,marginTop:"10px",lineHeight:1.6,fontWeight:300}}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{padding:"40px 24px 80px",textAlign:"center"}}>
        <div style={{maxWidth:"640px",margin:"0 auto",background:"#1A1A2E",borderRadius:"24px",padding:"44px 32px",color:"#fff",position:"relative",overflow:"hidden"}}>
          <h3 style={{fontFamily:"var(--font-playfair),Georgia,serif",fontSize:"30px",fontWeight:700,marginBottom:"12px",letterSpacing:"-.5px",lineHeight:1.2}}>
            Bereit, nie wieder eine Reservierung zu verlieren?
          </h3>
          {/* Vorher stand hier "die ersten 10 Kunden — 30 Tage gratis + 3 Monate
              10% Rabatt", waehrend die Startseite "die ersten 3 — 6 Monate
              gratis" versprach. Zwei Angebote, einen Klick voneinander entfernt.
              Die Startseite fuehrt das Angebot, hier steht nur der Verweis. */}
          <p style={{fontSize:"14px",color:"rgba(255,255,255,.7)",marginBottom:"24px",fontWeight:300,lineHeight:1.6,maxWidth:"480px",margin:"0 auto 24px"}}>
            Du testest ohne Kreditkarte und kannst monatlich kündigen.<br/>
            Eingerichtet wird persönlich — <a href="/#gruender" style={{color:"#fff",textDecoration:"underline"}}>von mir</a>.
          </p>
          <a href="/register" style={{
            display:"inline-block",padding:"14px 32px",background:"#FF5C35",color:"#fff",
            borderRadius:"12px",fontSize:"14px",fontWeight:600,textDecoration:"none",letterSpacing:".3px",
          }}>
            Heute Reservierungen automatisieren →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:"40px 24px",textAlign:"center",borderTop:"1px solid #EDE8E3"}}>
        <div style={{fontSize:"12px",color:muted,lineHeight:1.8}}>
          © 2026 Butlery · Michael Kleinlercher e.U. · St. Veit in Defereggen<br/>
          <a href="/impressum" style={{color:muted,textDecoration:"none",marginRight:"12px"}}>Impressum</a>
          <a href="/datenschutz" style={{color:muted,textDecoration:"none",marginRight:"12px"}}>Datenschutz</a>
          <a href="/agb" style={{color:muted,textDecoration:"none"}}>AGB</a>
        </div>
      </footer>
    </div>
  );
}