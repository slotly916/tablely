"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Pricing() {
  const router = useRouter();
  const [slotsLeft, setSlotsLeft] = useState(5);

  useEffect(() => {
    // Slots aus localStorage oder fix
    const s = localStorage.getItem("slots_left");
    if (s) setSlotsLeft(parseInt(s));
  }, []);

  const plans = [
    {
      name: "Standard",
      price: 89,
      tagline: "Online-Reservierungen, einfach gemacht",
      popular: false,
      features: [
        { text: "Booking-Link für deine Gäste", included: true },
        { text: "Dashboard mit Reservierungs-Übersicht", included: true },
        { text: "E-Mail Bestätigungen automatisch", included: true },
        { text: "E-Mail Erinnerungen (24h + 2h vorher)", included: true },
        { text: "Tischverwaltung mit Kapazitäten", included: true },
        { text: "Tisch-Gruppen für große Gruppen", included: true },
        { text: "App fürs Smartphone & Tablet", included: true },
        { text: "WhatsApp KI", included: false },
        { text: "Telefon KI", included: false },
      ],
    },
    {
      name: "Plus",
      price: 109,
      tagline: "Mit WhatsApp KI — beliebtester Plan",
      popular: true,
      features: [
        { text: "Alles aus Standard", included: true, bold: true },
        { text: "WhatsApp KI – nimmt Reservierungen 24/7 an", included: true },
        { text: "Eigene österreichische WhatsApp Nummer", included: true },
        { text: "WhatsApp Erinnerungen für Gäste", included: true },
        { text: "WhatsApp Bestätigungen automatisch", included: true },
        { text: "Versteht „morgen", „Samstag", „mit Familie"", included: true },
        { text: "Großgruppen-Erkennung", included: true },
        { text: "Telefon KI", included: false },
      ],
    },
    {
      name: "Premium",
      price: 129,
      tagline: "Alle Kanäle — Online, WhatsApp & Telefon",
      popular: false,
      features: [
        { text: "Alles aus Plus", included: true, bold: true },
        { text: "Telefon KI – nimmt Anrufe rund um die Uhr an", included: true },
        { text: "Eigene Festnetz-Nummer", included: true },
        { text: "Spricht natürliches Deutsch und Englisch", included: true },
        { text: "Priorisierter Support (max 2h Antwortzeit)", included: true },
        { text: "Persönliches Onboarding mit Telefon-Call", included: true },
        { text: "Custom Anpassungen auf Anfrage", included: true },
      ],
    },
  ];

  const muted = "#6B6B80";

  return (
    <div style={{minHeight:"100vh",background:"#F5F0EB",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;700i&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .plan-card{animation:slideUp .6s ease backwards;}
        .plan-card:nth-child(1){animation-delay:.1s;}
        .plan-card:nth-child(2){animation-delay:.2s;}
        .plan-card:nth-child(3){animation-delay:.3s;}
        .cta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(255,92,53,.35)!important;}
        .nav-link:hover{color:#1A1A2E!important;}
      `}</style>

      {/* NAV */}
      <nav style={{padding:"20px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:"1280px",margin:"0 auto"}}>
        <a href="/" style={{textDecoration:"none",fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E"}}>
          table<span style={{color:"#FF5C35"}}>ly</span>
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
      <section style={{padding:"60px 24px 40px",textAlign:"center",maxWidth:"720px",margin:"0 auto"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"5px 14px",borderRadius:"20px",background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.2)",marginBottom:"20px",fontSize:"12px",color:"#FF5C35",fontWeight:500}}>
          <span style={{display:"inline-block",width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35"}}/>
          Noch {slotsLeft} von 10 Plätzen frei
        </div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(36px,5vw,52px)",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1.5px",lineHeight:1.1,marginBottom:"16px"}}>
          Faire Preise.<br/>
          <span style={{fontStyle:"italic",color:"#FF5C35"}}>Klare Vorteile.</span>
        </h1>
        <p style={{fontSize:"17px",color:muted,fontWeight:300,lineHeight:1.6,marginBottom:"24px"}}>
          Wähle den Plan der zu deinem Restaurant passt.<br/>
          Bei den ersten 10 Kunden: <strong style={{color:"#1A1A2E"}}>30 Tage gratis</strong> testen + <strong style={{color:"#1A1A2E"}}>3 Monate 10% Rabatt</strong>.
        </p>
        <div style={{fontSize:"13px",color:muted}}>
          Alle Preise in € pro Monat · Inkl. MwSt · Jederzeit kündbar
        </div>
      </section>

      {/* PLANS */}
      <section style={{padding:"20px 24px 60px",maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"20px",alignItems:"stretch"}}>
          {plans.map((plan, i) => (
            <div key={i} className="plan-card" style={{
              background: plan.popular ? "linear-gradient(180deg,#1A1A2E 0%,#252540 100%)" : "#fff",
              borderRadius:"24px",
              padding:"32px 28px",
              border: plan.popular ? "1px solid rgba(255,92,53,.3)" : "1px solid #EDE8E3",
              position:"relative",
              boxShadow: plan.popular ? "0 20px 60px rgba(255,92,53,.15)" : "0 4px 20px rgba(0,0,0,.04)",
              display:"flex",
              flexDirection:"column",
              transform: plan.popular ? "scale(1.02)" : "none",
            }}>
              {plan.popular && (
                <div style={{
                  position:"absolute",top:"-12px",left:"50%",transform:"translateX(-50%)",
                  background:"#FF5C35",color:"#fff",fontSize:"11px",fontWeight:600,
                  padding:"5px 14px",borderRadius:"20px",letterSpacing:".5px",textTransform:"uppercase",
                }}>
                  ★ Beliebt
                </div>
              )}
              
              <div style={{marginBottom:"24px"}}>
                <div style={{
                  fontSize:"13px",
                  color: plan.popular ? "rgba(255,255,255,.6)" : muted,
                  fontWeight:500,
                  textTransform:"uppercase",
                  letterSpacing:".8px",
                  marginBottom:"6px",
                }}>
                  {plan.name}
                </div>
                <div style={{display:"flex",alignItems:"baseline",gap:"4px",marginBottom:"6px"}}>
                  <span style={{
                    fontFamily:"'Playfair Display',serif",
                    fontSize:"48px",
                    fontWeight:700,
                    color: plan.popular ? "#FFFAF5" : "#1A1A2E",
                    letterSpacing:"-2px",
                  }}>
                    {plan.price}€
                  </span>
                  <span style={{fontSize:"14px",color: plan.popular ? "rgba(255,255,255,.5)" : muted,marginLeft:"2px"}}>
                    /Monat
                  </span>
                </div>
                <div style={{fontSize:"13px",color: plan.popular ? "rgba(255,255,255,.7)" : muted,fontWeight:300,lineHeight:1.5}}>
                  {plan.tagline}
                </div>
              </div>

              <a href="/register" className="cta-btn" style={{
                display:"block",
                textAlign:"center",
                padding:"13px",
                borderRadius:"12px",
                background: plan.popular ? "#FF5C35" : "transparent",
                color: plan.popular ? "#fff" : "#1A1A2E",
                border: plan.popular ? "none" : "1px solid #1A1A2E",
                fontSize:"14px",
                fontWeight:500,
                textDecoration:"none",
                marginBottom:"24px",
                transition:"all .2s",
              }}>
                30 Tage gratis testen
              </a>

              <div style={{display:"flex",flexDirection:"column",gap:"10px",flex:1}}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
                    <div style={{
                      width:"18px",height:"18px",borderRadius:"50%",
                      background: f.included 
                        ? (plan.popular ? "rgba(52,211,153,.2)" : "rgba(52,211,153,.15)")
                        : (plan.popular ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.04)"),
                      display:"flex",alignItems:"center",justifyContent:"center",
                      flexShrink:0,marginTop:"1px",
                    }}>
                      {f.included ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-5" stroke="#34D399" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M2 2l4 4M6 2l-4 4" stroke={plan.popular ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.3)"} strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                    <span style={{
                      fontSize:"13px",
                      color: f.included 
                        ? (plan.popular ? "#FFFAF5" : "#1A1A2E")
                        : (plan.popular ? "rgba(255,255,255,.4)" : "rgba(0,0,0,.4)"),
                      fontWeight: f.bold ? 600 : 400,
                      lineHeight:1.5,
                    }}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FEATURE COMPARISON STRIP */}
        <div style={{
          marginTop:"40px",
          background:"#fff",
          borderRadius:"16px",
          padding:"24px 28px",
          border:"1px solid #EDE8E3",
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
          gap:"20px",
        }}>
          {[
            {icon:"✓", title:"Keine Einrichtungs­gebühr", desc:"Setup, Onboarding und Migration sind kostenlos"},
            {icon:"✓", title:"30 Tage gratis", desc:"Volle Funktionalität — kein Risiko"},
            {icon:"✓", title:"Monatlich kündbar", desc:"Keine Mindestvertragslaufzeit"},
            {icon:"✓", title:"Support auf Deutsch", desc:"Direkt mit dem Gründer aus Österreich"},
          ].map((item, i) => (
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
              <div style={{width:"22px",height:"22px",borderRadius:"50%",background:"rgba(52,211,153,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#34D399",fontSize:"12px",fontWeight:700}}>{item.icon}</div>
              <div>
                <div style={{fontSize:"13px",fontWeight:600,color:"#1A1A2E",marginBottom:"3px"}}>{item.title}</div>
                <div style={{fontSize:"12px",color:muted,lineHeight:1.5}}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{padding:"40px 24px 80px",maxWidth:"720px",margin:"0 auto"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700,color:"#1A1A2E",textAlign:"center",marginBottom:"32px",letterSpacing:"-1px"}}>
          Häufige Fragen
        </h2>
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          {[
            {q:"Kann ich später wechseln?", a:"Ja, jederzeit. Upgrade oder Downgrade einfach in den Einstellungen, die Änderung gilt ab dem nächsten Monat."},
            {q:"Was passiert nach den 30 Tagen?", a:"Nichts automatisch. Wir fragen dich rechtzeitig ob du weitermachen willst und welcher Plan zu dir passt. Keine versteckten Abbuchungen."},
            {q:"Wie schnell ist die WhatsApp Nummer einsatzbereit?", a:"Innerhalb von 12-24 Stunden nach deiner Anmeldung bekommst du eine eigene österreichische WhatsApp Business Nummer — komplett von uns eingerichtet."},
            {q:"Was kostet es nach den 3 Monaten Rabatt?", a:"Der normale Preis des gewählten Plans: 89€ Standard, 109€ Plus, 129€ Premium pro Monat — keine Preiserhöhung versteckt."},
            {q:"Brauche ich technische Kenntnisse?", a:"Nein. Das Setup-Onboarding dauert 5 Minuten, die App funktioniert auf jedem Smartphone und Tablet. Bei Premium machen wir das Setup persönlich mit dir am Telefon."},
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
        <div style={{maxWidth:"560px",margin:"0 auto",background:"#1A1A2E",borderRadius:"24px",padding:"40px 32px",color:"#fff"}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,marginBottom:"10px",letterSpacing:"-.5px"}}>
            Bereit, mehr Reservierungen anzunehmen?
          </h3>
          <p style={{fontSize:"14px",color:"rgba(255,255,255,.7)",marginBottom:"24px",fontWeight:300,lineHeight:1.6}}>
            Sei einer der ersten 10 Kunden und sicher dir 30 Tage gratis + 3 Monate 10% Rabatt.
          </p>
          <a href="/register" style={{
            display:"inline-block",padding:"13px 32px",background:"#FF5C35",color:"#fff",
            borderRadius:"12px",fontSize:"14px",fontWeight:500,textDecoration:"none",
          }}>
            Jetzt gratis testen →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:"40px 24px",textAlign:"center",borderTop:"1px solid #EDE8E3"}}>
        <div style={{fontSize:"12px",color:muted,lineHeight:1.8}}>
          © 2026 Tablely · Michael Kleinlercher e.U. · St. Veit in Defereggen<br/>
          <a href="/impressum" style={{color:muted,textDecoration:"none",marginRight:"12px"}}>Impressum</a>
          <a href="/datenschutz" style={{color:muted,textDecoration:"none",marginRight:"12px"}}>Datenschutz</a>
          <a href="/agb" style={{color:muted,textDecoration:"none"}}>AGB</a>
        </div>
      </footer>
    </div>
  );
}