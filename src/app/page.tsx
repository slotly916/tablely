"use client";

import { useState, useEffect, useRef } from "react";

export default function LandingV2() {
  const [chatMessages, setChatMessages] = useState<{from:"user"|"ai",text:string,delay:number}[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [counter, setCounter] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // Animated chat
  useEffect(() => {
    const messages: {from:"user"|"ai",text:string,delay:number}[] = [
      { from: "user", text: "Hallo, ich hätte gerne einen Tisch für 4 Personen morgen Abend", delay: 800 },
      { from: "ai", text: "Hallo! 👋 Gerne. Für welche Uhrzeit darf ich reservieren?", delay: 2200 },
      { from: "user", text: "So gegen 19:30 wenn möglich", delay: 3800 },
      { from: "ai", text: "Perfekt! Auf welchen Namen darf ich die Reservierung anlegen?", delay: 5200 },
      { from: "user", text: "Auf Müller bitte", delay: 6800 },
      { from: "ai", text: "Reserviert! ✅\n\n📅 Morgen, 19:30 Uhr\n👥 4 Personen\n\nDu bekommst gleich eine Bestätigung. Wir freuen uns!", delay: 8400 },
    ];

    messages.forEach((msg, i) => {
      setTimeout(() => {
        setChatMessages(prev => [...prev, msg]);
      }, msg.delay);
    });

    // Loop after 12 seconds
    const loop = setInterval(() => {
      setChatMessages([]);
      messages.forEach((msg) => {
        setTimeout(() => {
          setChatMessages(prev => [...prev, msg]);
        }, msg.delay);
      });
    }, 14000);

    return () => clearInterval(loop);
  }, []);

  // Counter animation
  useEffect(() => {
    let current = 0;
    const target = 1247;
    const increment = target / 80;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCounter(target);
        clearInterval(timer);
      } else {
        setCounter(Math.floor(current));
      }
    }, 30);
    return () => clearInterval(timer);
  }, []);

  // Scroll parallax
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{minHeight:"100vh",background:"#F5F0EB",fontFamily:"'DM Sans',sans-serif",overflow:"hidden",position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;700i;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        
        @keyframes float-particle {
          0%, 100% { transform: translate(0,0) rotate(0deg); opacity: 0.3; }
          50% { transform: translate(20px, -30px) rotate(180deg); opacity: 0.7; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,92,53,0.4); }
          50% { box-shadow: 0 0 0 20px rgba(255,92,53,0); }
        }
        @keyframes slide-in-bubble {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typing {
          0%, 60% { opacity: 0.3; }
          30% { opacity: 1; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes phone-rotate {
          0% { transform: perspective(2000px) rotateY(-12deg) rotateX(8deg); }
          100% { transform: perspective(2000px) rotateY(-15deg) rotateX(10deg); }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        
        .chat-bubble {
          animation: slide-in-bubble 0.4s ease-out;
        }
        
        .typing-dot {
          animation: typing 1.4s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        .gradient-text {
          background: linear-gradient(135deg, #FF5C35 0%, #FFA07A 50%, #FF5C35 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s ease-in-out infinite;
        }
        
        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(255,92,53,0.4) !important;
        }
        
        .nav-blur {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        
        .stat-card {
          animation: fade-in-up 0.8s ease-out backwards;
        }
        .stat-card:nth-child(1) { animation-delay: 0.6s; }
        .stat-card:nth-child(2) { animation-delay: 0.7s; }
        .stat-card:nth-child(3) { animation-delay: 0.8s; }
        
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .phone-mockup { max-width: 320px !important; margin: 0 auto !important; transform: none !important; }
          .hero-headline { font-size: clamp(36px, 9vw, 56px) !important; }
        }
      `}</style>

      {/* PARTICLES BACKGROUND */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:1}}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            width: `${4 + Math.random()*8}px`,
            height: `${4 + Math.random()*8}px`,
            left: `${Math.random()*100}%`,
            top: `${Math.random()*100}%`,
            background: i % 3 === 0 ? "rgba(255,92,53,0.15)" : "rgba(26,26,46,0.08)",
            animation: `float-particle ${8 + Math.random()*6}s ease-in-out infinite`,
            animationDelay: `${Math.random()*5}s`,
          }}/>
        ))}
      </div>

      {/* NAV */}
      <nav className="nav-blur" style={{
        position:"sticky",top:0,zIndex:100,
        padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",
        background:"rgba(245,240,235,0.7)",borderBottom:"1px solid rgba(0,0,0,0.04)",
      }}>
        <a href="/" style={{textDecoration:"none",fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-0.5px"}}>
          table<span style={{color:"#FF5C35",fontStyle:"italic"}}>ly</span>
        </a>
        <div style={{display:"flex",gap:"32px",alignItems:"center"}}>
          <a href="#features" style={{textDecoration:"none",fontSize:"14px",color:"#6B6B80",fontWeight:500,transition:"color .2s"}}>Funktionen</a>
          <a href="/pricing" style={{textDecoration:"none",fontSize:"14px",color:"#6B6B80",fontWeight:500}}>Preise</a>
          <a href="/login" style={{textDecoration:"none",fontSize:"14px",color:"#6B6B80",fontWeight:500}}>Login</a>
          <button onClick={() => setShowRegister(true)} style={{
            padding:"9px 22px",background:"#1A1A2E",color:"#fff",borderRadius:"10px",
            fontSize:"13px",fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",
            letterSpacing:".3px",
          }}>
            Gratis testen →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} style={{position:"relative",zIndex:2,padding:"60px 24px 80px",maxWidth:"1280px",margin:"0 auto"}}>
        <div className="hero-grid" style={{display:"grid",gridTemplateColumns:"1.1fr 0.9fr",gap:"60px",alignItems:"center"}}>
          
          {/* LEFT: TEXT */}
          <div>
            {/* Status Badge */}
            <div style={{
              display:"inline-flex",alignItems:"center",gap:"8px",
              padding:"6px 14px",borderRadius:"20px",
              background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)",
              marginBottom:"24px",animation:"fade-in-up 0.6s ease-out",
            }}>
              <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34D399",animation:"pulse-glow 2s infinite"}}/>
              <span style={{fontSize:"12px",color:"#059669",fontWeight:600,letterSpacing:".3px"}}>Live · 27 Restaurants verbunden</span>
            </div>

            <h1 className="hero-headline" style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(44px, 6vw, 72px)",
              fontWeight:700,
              color:"#1A1A2E",
              letterSpacing:"-2.5px",
              lineHeight:0.95,
              marginBottom:"24px",
              animation:"fade-in-up 0.8s ease-out 0.1s backwards",
            }}>
              Nie wieder<br/>
              eine Reservierung <span className="gradient-text" style={{fontStyle:"italic",fontWeight:900}}>verpassen.</span>
            </h1>

            <p style={{
              fontSize:"19px",color:"#6B6B80",fontWeight:300,lineHeight:1.55,
              marginBottom:"32px",maxWidth:"540px",
              animation:"fade-in-up 0.8s ease-out 0.2s backwards",
            }}>
              Tablely nimmt deine Reservierungen rund um die Uhr automatisch an —
              <span style={{color:"#1A1A2E",fontWeight:500}}> per WhatsApp, Telefon und Online</span>.
              Schluss mit dem Reservierungschaos im Service.
            </p>

            {/* CTAs */}
            <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginBottom:"40px",animation:"fade-in-up 0.8s ease-out 0.3s backwards"}}>
              <button onClick={() => setShowRegister(true)} className="cta-primary" style={{
                padding:"15px 28px",background:"#FF5C35",color:"#fff",
                borderRadius:"12px",fontSize:"15px",fontWeight:600,border:"none",cursor:"pointer",
                fontFamily:"inherit",letterSpacing:".3px",
                boxShadow:"0 8px 24px rgba(255,92,53,0.25)",
                transition:"all .25s",display:"flex",alignItems:"center",gap:"8px",
              }}>
                Heute Reservierungen automatisieren
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <a href="/demo" style={{
                padding:"15px 24px",background:"transparent",color:"#1A1A2E",
                borderRadius:"12px",fontSize:"15px",fontWeight:500,
                border:"1px solid rgba(26,26,46,0.15)",cursor:"pointer",fontFamily:"inherit",
                textDecoration:"none",display:"flex",alignItems:"center",gap:"8px",
                transition:"all .2s",
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2l9 5-9 5V2z" fill="currentColor"/></svg>
                Live Demo ansehen
              </a>
            </div>

            {/* TRUST INDICATORS */}
            <div style={{display:"flex",gap:"36px",flexWrap:"wrap",animation:"fade-in-up 0.8s ease-out 0.4s backwards"}}>
              <div className="stat-card">
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1px",lineHeight:1}}>
                  {counter.toLocaleString("de-AT")}+
                </div>
                <div style={{fontSize:"12px",color:"#6B6B80",fontWeight:500,marginTop:"4px"}}>Reservierungen automatisiert</div>
              </div>
              <div className="stat-card">
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1px",lineHeight:1}}>
                  24/7
                </div>
                <div style={{fontSize:"12px",color:"#6B6B80",fontWeight:500,marginTop:"4px"}}>Auch nachts und am Wochenende</div>
              </div>
              <div className="stat-card">
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1px",lineHeight:1}}>
                  60% <span style={{fontSize:"18px",color:"#34D399"}}>↓</span>
                </div>
                <div style={{fontSize:"12px",color:"#6B6B80",fontWeight:500,marginTop:"4px"}}>Weniger No-Shows</div>
              </div>
            </div>
          </div>

          {/* RIGHT: PHONE MOCKUP WITH ANIMATED CHAT */}
          <div style={{position:"relative",perspective:"2000px"}}>
            <div className="phone-mockup" style={{
              width:"100%",maxWidth:"380px",margin:"0 auto",
              transform: `perspective(2000px) rotateY(${-12 - scrollY*0.01}deg) rotateX(${8 + scrollY*0.005}deg)`,
              transition:"transform 0.1s ease-out",
              filter:"drop-shadow(0 40px 80px rgba(26,26,46,0.25))",
            }}>
              <div style={{
                background:"#1A1A2E",borderRadius:"42px",padding:"12px",
                border:"4px solid #0A0A18",
                position:"relative",
              }}>
                {/* Notch */}
                <div style={{
                  position:"absolute",top:"12px",left:"50%",transform:"translateX(-50%)",
                  width:"100px",height:"24px",background:"#0A0A18",borderRadius:"0 0 16px 16px",
                  zIndex:10,
                }}/>
                
                {/* Screen */}
                <div style={{
                  background:"linear-gradient(180deg, #E8DDD0 0%, #F5F0EB 100%)",
                  borderRadius:"32px",
                  height:"640px",
                  overflow:"hidden",
                  position:"relative",
                }}>
                  {/* WhatsApp Header */}
                  <div style={{
                    background:"#075E54",padding:"42px 16px 12px",
                    display:"flex",alignItems:"center",gap:"10px",
                  }}>
                    <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"#FF5C35",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontWeight:700,color:"#fff",fontSize:"16px"}}>R</div>
                    <div style={{flex:1}}>
                      <div style={{color:"#fff",fontSize:"14px",fontWeight:600}}>Restaurant Defereggental</div>
                      <div style={{color:"rgba(255,255,255,0.7)",fontSize:"11px"}}>● Online · KI antwortet sofort</div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>

                  {/* Chat */}
                  <div style={{
                    padding:"16px 12px",
                    background:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M0 0h80v80H0z' fill='%23E8DDD0'/%3E%3Cpath d='M20 20l8 8M28 20l-8 8M52 52l8 8M60 52l-8 8' stroke='%23D4C5B0' stroke-width='1' opacity='0.5'/%3E%3C/svg%3E")`,
                    height:"calc(100% - 70px)",
                    overflow:"hidden",
                    display:"flex",flexDirection:"column",gap:"8px",
                  }}>
                    {chatMessages.map((msg, i) => (
                      <div key={i} className="chat-bubble" style={{
                        alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
                        maxWidth:"85%",
                        background: msg.from === "user" ? "#DCF8C6" : "#fff",
                        padding:"8px 12px",
                        borderRadius: msg.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        boxShadow:"0 1px 2px rgba(0,0,0,0.1)",
                        fontSize:"13px",
                        color:"#1A1A2E",
                        lineHeight:1.4,
                        whiteSpace:"pre-line",
                      }}>
                        {msg.text}
                        <div style={{fontSize:"9px",color:"#6B6B80",textAlign:"right",marginTop:"3px"}}>
                          {new Date().toLocaleTimeString("de-AT",{hour:"2-digit",minute:"2-digit"})} ✓✓
                        </div>
                      </div>
                    ))}
                    {chatMessages.length > 0 && chatMessages.length < 6 && (
                      <div style={{alignSelf:"flex-start",background:"#fff",padding:"10px 14px",borderRadius:"14px 14px 14px 4px",boxShadow:"0 1px 2px rgba(0,0,0,0.1)",display:"flex",gap:"4px",alignItems:"center"}}>
                        <span className="typing-dot" style={{width:"6px",height:"6px",borderRadius:"50%",background:"#6B6B80",display:"inline-block"}}/>
                        <span className="typing-dot" style={{width:"6px",height:"6px",borderRadius:"50%",background:"#6B6B80",display:"inline-block"}}/>
                        <span className="typing-dot" style={{width:"6px",height:"6px",borderRadius:"50%",background:"#6B6B80",display:"inline-block"}}/>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Stats Cards around Phone */}
            <div style={{
              position:"absolute",top:"15%",left:"-5%",
              background:"rgba(255,255,255,0.9)",backdropFilter:"blur(10px)",
              borderRadius:"14px",padding:"12px 16px",
              boxShadow:"0 12px 32px rgba(0,0,0,0.08)",
              border:"1px solid rgba(255,255,255,0.5)",
              animation:"fade-in-up 1s ease-out 0.8s backwards",
              zIndex:5,
            }}>
              <div style={{fontSize:"10px",color:"#6B6B80",fontWeight:500,marginBottom:"3px"}}>HEUTE ANGENOMMEN</div>
              <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#34D399",animation:"pulse-glow 2s infinite"}}/>
                <div style={{fontSize:"18px",fontWeight:700,color:"#1A1A2E",fontFamily:"'Playfair Display',serif"}}>23 Reservierungen</div>
              </div>
            </div>

            <div style={{
              position:"absolute",bottom:"18%",right:"-5%",
              background:"rgba(26,26,46,0.95)",backdropFilter:"blur(10px)",
              borderRadius:"14px",padding:"12px 16px",
              boxShadow:"0 12px 32px rgba(0,0,0,0.15)",
              animation:"fade-in-up 1s ease-out 1s backwards",
              zIndex:5,
            }}>
              <div style={{fontSize:"10px",color:"rgba(255,255,255,0.5)",fontWeight:500,marginBottom:"3px"}}>NÄCHSTE</div>
              <div style={{fontSize:"14px",color:"#fff",fontWeight:600,marginBottom:"2px"}}>Familie Hofer · 6 Pers.</div>
              <div style={{fontSize:"11px",color:"#FF5C35",fontWeight:500}}>Heute · 19:30 Uhr</div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER STRIP */}
      <section style={{
        background:"#1A1A2E",padding:"24px 0",overflow:"hidden",
        borderTop:"1px solid rgba(255,255,255,0.05)",
        borderBottom:"1px solid rgba(255,255,255,0.05)",
        position:"relative",zIndex:2,
      }}>
        <div style={{display:"flex",animation:"ticker 30s linear infinite",gap:"60px",whiteSpace:"nowrap"}}>
          {[...Array(2)].map((_, repeat) => (
            <div key={repeat} style={{display:"flex",gap:"60px"}}>
              {[
                {icon:"💬", text:"WhatsApp KI antwortet in unter 3 Sekunden"},
                {icon:"📞", text:"Telefon-KI versteht Deutsch und Englisch"},
                {icon:"⚡", text:"24/7 verfügbar — auch nachts"},
                {icon:"🎯", text:"Automatische Tisch-Zuweisung"},
                {icon:"🔔", text:"Erinnerungen 24h und 2h vorher"},
                {icon:"📊", text:"Live Dashboard auf jedem Gerät"},
              ].map((item, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",color:"rgba(255,255,255,0.6)",fontSize:"14px",fontWeight:500}}>
                  <span style={{fontSize:"18px"}}>{item.icon}</span>
                  <span>{item.text}</span>
                  <span style={{color:"#FF5C35",margin:"0 30px"}}>◆</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* REGISTER MODAL */}
      {showRegister && (
        <div onClick={() => setShowRegister(false)} style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",
          display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"24px",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"#fff",borderRadius:"24px",padding:"40px 36px",maxWidth:"440px",width:"100%",
            boxShadow:"0 40px 80px rgba(0,0,0,0.3)",
          }}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,color:"#1A1A2E",marginBottom:"8px",letterSpacing:"-0.5px"}}>
              Heute starten.
            </h2>
            <p style={{fontSize:"14px",color:"#6B6B80",marginBottom:"24px",lineHeight:1.6}}>
              30 Tage gratis testen. Keine Kreditkarte erforderlich.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              <a href="/register" style={{
                padding:"13px",background:"#FF5C35",color:"#fff",borderRadius:"10px",
                textAlign:"center",textDecoration:"none",fontSize:"14px",fontWeight:600,
              }}>
                Mit E-Mail registrieren
              </a>
              <a href="/api/auth/google" style={{
                padding:"13px",background:"#fff",color:"#1A1A2E",borderRadius:"10px",
                textAlign:"center",textDecoration:"none",fontSize:"14px",fontWeight:500,
                border:"1px solid #EDE8E3",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16"><path d="M15.68 8.18c0-.56-.05-1.1-.14-1.62H8v3.07h4.31c-.18 1-.74 1.85-1.59 2.42v2.01h2.58c1.5-1.39 2.38-3.43 2.38-5.88z" fill="#4285F4"/><path d="M8 16c2.16 0 3.97-.71 5.3-1.94l-2.58-2.01c-.72.48-1.63.77-2.72.77-2.09 0-3.86-1.41-4.49-3.31H.83v2.07A8 8 0 0 0 8 16z" fill="#34A853"/><path d="M3.51 9.51A4.8 4.8 0 0 1 3.25 8c0-.52.09-1.03.26-1.51V4.42H.83a8 8 0 0 0 0 7.16l2.68-2.07z" fill="#FBBC05"/><path d="M8 3.18c1.18 0 2.24.41 3.07 1.2l2.3-2.3A8 8 0 0 0 8 0a8 8 0 0 0-7.17 4.42l2.68 2.07C4.14 4.59 5.91 3.18 8 3.18z" fill="#EA4335"/></svg>
                Mit Google fortfahren
              </a>
            </div>
            <p style={{fontSize:"11px",color:"#6B6B80",textAlign:"center",marginTop:"16px",lineHeight:1.5}}>
              Mit der Registrierung akzeptierst du unsere AGB und Datenschutz.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}