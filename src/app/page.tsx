"use client";

import { useState, useEffect } from "react";

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
      options: { redirectTo: `${window.location.origin}/onboarding` },
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:"20px",fontFamily:"'DM Sans',sans-serif"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#FFFAF5",borderRadius:"20px",padding:"36px",width:"100%",maxWidth:"420px",boxShadow:"0 40px 80px rgba(0,0,0,.3)"}}>
        {status==="success" ? (
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"#E8F8F1",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#25C281" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#1A1A2E",marginBottom:"10px"}}>Konto erstellt!</h2>
            <p style={{color:"#6B6B80",fontSize:"14px",lineHeight:1.7,marginBottom:"20px"}}>Bestätigungsmail wurde an <strong>{email}</strong> gesendet.</p>
            <button onClick={onClose} style={{background:"#FF5C35",color:"#fff",border:"none",padding:"12px 28px",borderRadius:"10px",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>Schließen</button>
          </div>
        ) : (
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E"}}>30 Tage gratis testen</h2>
              <button onClick={onClose} style={{background:"transparent",border:"none",color:"#6B6B80",cursor:"pointer",fontSize:"20px",lineHeight:1}}>✕</button>
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.2)",borderRadius:"20px",padding:"4px 12px",marginBottom:"20px"}}>
              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#FF5C35"}}/>
              <span style={{fontSize:"11px",color:"#FF5C35",fontWeight:600}}>Noch 5 von 10 Plätzen frei</span>
            </div>
            <button onClick={handleGoogleLogin} style={{
              width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
              padding:"12px",borderRadius:"10px",border:"1.5px solid #F0EBE3",background:"#fff",
              fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:"#1A1A2E",
              marginBottom:"12px",
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
              <input style={{width:"100%",padding:"11px 14px",border:"1.5px solid #F0EBE3",borderRadius:"10px",fontSize:"14px",fontFamily:"inherit",background:"#fff",color:"#1A1A2E",outline:"none"}} type="text" placeholder="Dein Name" value={name} onChange={e=>setName(e.target.value)} disabled={status==="loading"}/>
              <input style={{width:"100%",padding:"11px 14px",border:"1.5px solid #F0EBE3",borderRadius:"10px",fontSize:"14px",fontFamily:"inherit",background:"#fff",color:"#1A1A2E",outline:"none"}} type="email" placeholder="deine@email.at" value={email} onChange={e=>setEmail(e.target.value)} disabled={status==="loading"}/>
              <input style={{width:"100%",padding:"11px 14px",border:"1.5px solid #F0EBE3",borderRadius:"10px",fontSize:"14px",fontFamily:"inherit",background:"#fff",color:"#1A1A2E",outline:"none"}} type="password" placeholder="Passwort (min. 8 Zeichen)" value={password} onChange={e=>setPassword(e.target.value)} disabled={status==="loading"} onKeyDown={e=>e.key==="Enter"&&handleRegister()}/>
            </div>
            {errorMsg && <p style={{color:"#E24B4A",fontSize:"13px",marginBottom:"10px"}}>{errorMsg}</p>}
            <button onClick={handleRegister} disabled={status==="loading"} style={{width:"100%",background:"#FF5C35",color:"#fff",border:"none",padding:"14px",borderRadius:"10px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:status==="loading"?0.7:1,marginBottom:"12px"}}>
              {status==="loading" ? "Wird registriert..." : "Kostenlos starten →"}
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

export default function Home() {
  const [showModal, setShowModal] = useState(false);

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
        .nav-cta:hover{background:var(--orange)!important;color:#fff!important;}
        .btn-main:hover{background:#FF7A5A!important;transform:translateY(-2px);}
        .feat-card:hover{transform:translateY(-3px);}
        .stress-item{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);}
        .stress-item:last-child{border:none;padding-bottom:0;}
        .demo-btn:hover{background:#FF7A5A!important;transform:translateY(-2px);}
      `}</style>

      {/* NAV */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 32px",position:"sticky",top:0,background:"rgba(255,250,245,0.97)",backdropFilter:"blur(16px)",zIndex:100,borderBottom:"1px solid var(--border)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"var(--dark)"}}>table<span style={{color:"var(--orange)"}}>ly</span></div>
        <div style={{display:"flex",alignItems:"center",gap:"24px"}}>
          <div style={{display:"flex",gap:"24px"}}>
            {[["#features","Funktionen"],["#screenshots","App"]].map(([h,l])=>(
              <a key={h} href={h} style={{textDecoration:"none",color:"var(--muted)",fontSize:"14px"}}>{l}</a>
            ))}
          </div>
          <button className="nav-cta" onClick={()=>setShowModal(true)} style={{background:"var(--dark)",color:"#fff",border:"none",padding:"10px 20px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
            Jetzt gratis testen
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{background:"var(--dark)",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",top:"-200px",right:"-100px",width:"500px",height:"500px",background:"radial-gradient(circle,rgba(255,92,53,.15) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:"1200px",margin:"0 auto",padding:"80px 32px 80px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"center"}}>
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.25)",borderRadius:"20px",padding:"6px 14px",marginBottom:"20px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",animation:"pulse 2s infinite",flexShrink:0}}/>
              <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:500}}>Noch 5 Plätze — 30 Tage gratis + 3 Monate 10% Rabatt</span>
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(40px,5vw,56px)",fontWeight:700,lineHeight:1.05,letterSpacing:"-2px",color:"#FFFAF5",marginBottom:"20px"}}>
              Kein Anruf.<br/>Kein Buch.<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>Kein Chaos.</span>
            </h1>
            <p style={{color:"rgba(255,255,255,.5)",fontSize:"17px",lineHeight:1.75,fontWeight:300,marginBottom:"36px",maxWidth:"440px"}}>
              Stoßzeit. Küche brennt. Telefon klingelt. Dein Kellner blättert im Reservierungsbuch — 3 Minuten für eine Reservierung. <strong style={{color:"rgba(255,255,255,.8)",fontWeight:500}}>Tablely macht das in 3 Sekunden.</strong>
            </p>
            <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"}}>
              <button className="btn-main" onClick={()=>setShowModal(true)} style={{background:"#FF5C35",color:"#fff",border:"none",padding:"16px 28px",borderRadius:"10px",fontSize:"16px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
                Jetzt 30 Tage kostenlos testen →
              </button>
              <span style={{fontSize:"13px",color:"rgba(255,255,255,.3)"}}>Keine Kreditkarte</span>
            </div>
          </div>
          <div style={{animation:"float 6s ease-in-out infinite"}}>
            <div style={{background:"#1E1E2E",borderRadius:"14px",overflow:"hidden",boxShadow:"0 40px 80px rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.08)"}}>
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
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:700,letterSpacing:"-1px",lineHeight:1.1,marginBottom:"20px"}}>Das Reservierungsbuch kostet dich täglich Geld.</h2>
            <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:300,marginBottom:"16px"}}>Jeder Anruf während der Stoßzeit ist eine Ablenkung. Jede Minute im Buch blättern ist verschwendete Zeit.</p>
            <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.8,fontWeight:300}}>Österreichische Restaurants verlieren täglich bis zu <strong style={{color:"var(--dark)"}}>2 Stunden</strong> durch manuelle Reservierungen. Tablely gibt dir diese Zeit zurück.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{background:"#F5F0EB",padding:"100px 32px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"60px"}}>
            <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"12px"}}>Wie es funktioniert</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:700,letterSpacing:"-1px",marginBottom:"16px"}}>Drei Wege zu buchen.<br/>Ein Dashboard für alles.</h2>
            <p style={{color:"var(--muted)",fontSize:"16px",fontWeight:300,maxWidth:"480px",margin:"0 auto"}}>WhatsApp, Telefon oder online — deine Gäste wählen wie sie buchen.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"20px"}}>
            <div className="feat-card" style={{background:"var(--dark)",borderRadius:"20px",padding:"32px",transition:"all .25s"}}>
              <div style={{background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.2)",borderRadius:"8px",padding:"3px 10px",fontSize:"10px",fontWeight:600,textTransform:"uppercase",letterSpacing:".8px",color:"#FF5C35",display:"inline-block",marginBottom:"20px"}}>WhatsApp KI</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#FFFAF5",marginBottom:"12px"}}>Gäste schreiben — KI antwortet & bucht</h3>
              <p style={{color:"rgba(255,255,255,.45)",fontSize:"14px",lineHeight:1.7,fontWeight:300,marginBottom:"24px"}}>Deine Gäste schreiben per WhatsApp. Die KI versteht alles, antwortet in Sekunden und trägt die Reservierung automatisch ein.</p>
              <div style={{background:"rgba(255,255,255,.05)",borderRadius:"12px",padding:"16px",border:"1px solid rgba(255,255,255,.08)"}}>
                <div style={{fontSize:"11px",padding:"8px 12px",borderRadius:"10px 10px 10px 2px",background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.8)",maxWidth:"80%",marginBottom:"8px",lineHeight:1.5}}>Hallo! Tisch für 3 am Freitag um 19:30? 🙏</div>
                <div style={{fontSize:"11px",padding:"8px 12px",borderRadius:"10px 10px 2px 10px",background:"#25D366",color:"#fff",maxWidth:"80%",marginLeft:"auto",lineHeight:1.5}}>Perfekt! Tisch für 3 am Fr. 20.03. um 19:30 ✅ Wir freuen uns auf euch!</div>
              </div>
            </div>
            <div className="feat-card" style={{background:"var(--orange)",borderRadius:"20px",padding:"32px",transition:"all .25s"}}>
              <div style={{background:"rgba(255,255,255,.2)",borderRadius:"8px",padding:"3px 10px",fontSize:"10px",fontWeight:600,textTransform:"uppercase",letterSpacing:".8px",color:"#fff",display:"inline-block",marginBottom:"20px"}}>KI Telefon</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#fff",marginBottom:"12px"}}>KI nimmt Anrufe entgegen — automatisch</h3>
              <p style={{color:"rgba(255,255,255,.8)",fontSize:"14px",lineHeight:1.7,fontWeight:300,marginBottom:"24px"}}>Kein Anruf geht verloren. Die KI nimmt ab, versteht den Gast und trägt alles ein.</p>
              <div style={{background:"rgba(255,255,255,.12)",borderRadius:"12px",padding:"16px",border:"1px solid rgba(255,255,255,.15)"}}>
                {[["Gast ruft an","KI nimmt ab"],["Tisch, Zeit, Personen","KI versteht alles"],["Reservierung","Automatisch gespeichert"]].map(([l,r],i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<2?"1px solid rgba(255,255,255,.1)":"none",fontSize:"11px"}}>
                    <span style={{color:"rgba(255,255,255,.7)"}}>{l}</span>
                    <span style={{color:"#fff",fontWeight:500}}>→ {r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}}>
            {[
              {icon:<svg viewBox="0 0 28 28" fill="none" width="28" height="28"><rect x="3" y="5" width="22" height="18" rx="3" stroke="#FF5C35" strokeWidth="1.4"/><path d="M3 11h22M9 4v3M19 4v3" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>,t:"Online Buchung",d:"Eigene Booking Page — Gäste buchen direkt rund um die Uhr."},
              {icon:<svg viewBox="0 0 28 28" fill="none" width="28" height="28"><rect x="2" y="2" width="24" height="24" rx="4" stroke="#FF5C35" strokeWidth="1.4"/><path d="M2 11h24" stroke="#FF5C35" strokeWidth="1.4"/><rect x="6" y="15" width="7" height="5" rx="1.5" fill="#FF5C35" fillOpacity=".2" stroke="#FF5C35" strokeWidth="1.2"/></svg>,t:"Alles im Dashboard",d:"WhatsApp, Telefon, Online — alles an einem Ort."},
              {icon:<svg viewBox="0 0 28 28" fill="none" width="28" height="28"><path d="M14 3v3M14 3a8 8 0 0 1 8 8c0 4-1.5 5.5-1.5 5.5H7.5S6 15 6 11A8 8 0 0 1 14 3Z" stroke="#FF5C35" strokeWidth="1.4" strokeLinejoin="round"/><path d="M10 19s0 4 4 4 4-4 4-4" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>,t:"Auto-Erinnerungen",d:"Gäste werden 24h und 2h vorher erinnert. No-Shows sinken auf fast null."},
            ].map((f,i)=>(
              <div key={i} className="feat-card" style={{background:"#fff",borderRadius:"16px",padding:"24px",border:"1.5px solid var(--border)",transition:"all .25s"}}>
                <div style={{marginBottom:"14px"}}>{f.icon}</div>
                <div style={{fontSize:"14px",fontWeight:600,color:"var(--dark)",marginBottom:"6px"}}>{f.t}</div>
                <p style={{fontSize:"13px",color:"var(--muted)",lineHeight:1.6,fontWeight:300}}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUKT BILD */}
      <section id="screenshots" style={{background:"#F5F0EB",padding:"80px 20px 0",overflow:"hidden"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:"40px"}}>
            <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"#FF5C35",marginBottom:"12px"}}>Das Produkt</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:700,letterSpacing:"-1px",color:"#1A1A2E",marginBottom:"12px"}}>Vom Gast direkt ins Dashboard.</h2>
            <p style={{color:"#6B6B80",fontSize:"16px",fontWeight:300,maxWidth:"480px",margin:"0 auto",lineHeight:1.7}}>Gäste buchen auf dem iPhone — du verwaltest alles auf dem Mac.</p>
          </div>
          <div style={{borderRadius:"20px 20px 0 0",overflow:"hidden",boxShadow:"0 -8px 60px rgba(26,26,46,.15)"}}>
            <img src="/mac_iohon.png" alt="Tablely Dashboard" style={{width:"100%",height:"auto",display:"block"}}/>
          </div>
        </div>
      </section>

      {/* DEMO CTA */}
      <section style={{background:"var(--cream)",padding:"64px 20px"}}>
        <div style={{maxWidth:"700px",margin:"0 auto",textAlign:"center",padding:"48px 32px",background:"var(--dark)",borderRadius:"20px"}}>
          <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"12px"}}>Live Demo</div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(22px,4vw,28px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-0.5px",marginBottom:"12px"}}>Probier es selbst aus.</h3>
          <p style={{fontSize:"15px",color:"rgba(255,255,255,.45)",fontWeight:300,marginBottom:"28px",lineHeight:1.7}}>
            Reserviere als Gast — sieh wie es sofort im Dashboard erscheint.
          </p>
          <a href="/demo" className="demo-btn" style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#FF5C35",color:"#fff",padding:"13px 28px",borderRadius:"10px",fontSize:"15px",fontWeight:500,textDecoration:"none",transition:"all .2s"}}>
            Demo starten →
          </a>
        </div>
      </section>

      {/* NUMBERS */}
      <div style={{background:"var(--dark)",padding:"80px 32px"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"12px"}}>Was Tablely bewirkt</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,40px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1px",marginBottom:"40px"}}>Zahlen die sprechen.</h2>
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

      {/* CTA SEKTION */}
      <section id="cta" style={{background:"#1A1A2E",padding:"80px 20px"}}>
        <div style={{maxWidth:"640px",margin:"0 auto",textAlign:"center"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.25)",borderRadius:"20px",padding:"5px 14px",marginBottom:"20px"}}>
            <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#FF5C35",animation:"pulse 2s infinite",flexShrink:0}}/>
            <span style={{fontSize:"12px",color:"#FF5C35",fontWeight:500}}>Noch 5 von 10 Plätzen frei</span>
          </div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,5vw,40px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1px",lineHeight:1.1,marginBottom:"16px"}}>
            30 Tage gratis.<br/><span style={{color:"#FF5C35",fontStyle:"italic"}}>Nur für die ersten 10.</span>
          </h2>
          <p style={{color:"rgba(255,255,255,.45)",fontSize:"15px",lineHeight:1.75,fontWeight:300,marginBottom:"24px"}}>
            Die ersten 10 Restaurants testen alle Features 30 Tage kostenlos — danach 3 Monate mit <strong style={{color:"rgba(255,255,255,.7)"}}>10% Rabatt</strong>. Ab dem 11. Restaurant gibt es nur noch 14 Tage ohne Vergünstigung.
          </p>
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",justifyContent:"center",marginBottom:"32px"}}>
            {["✓ Online Buchungsseite","✓ WhatsApp KI","✓ Erinnerungen","✓ Dashboard","✓ Walk-in Assistent","⏳ KI Telefon (bald)"].map((f,i)=>(
              <div key={i} style={{fontSize:"12px",fontWeight:500,padding:"5px 12px",borderRadius:"20px",background:f.startsWith("⏳")?"rgba(255,255,255,.05)":"rgba(255,92,53,.12)",color:f.startsWith("⏳")?"rgba(255,255,255,.3)":"#FF5C35",border:`1px solid ${f.startsWith("⏳")?"rgba(255,255,255,.08)":"rgba(255,92,53,.2)"}`}}>{f}</div>
            ))}
          </div>
          <button onClick={()=>setShowModal(true)} style={{background:"#FF5C35",color:"#fff",border:"none",padding:"16px 36px",borderRadius:"10px",fontSize:"16px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginBottom:"12px"}}>
            Jetzt 30 Tage kostenlos testen →
          </button>
          <p style={{fontSize:"12px",color:"rgba(255,255,255,.25)"}}>Keine Kreditkarte. Keine Verpflichtung.</p>
        </div>
      </section>

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

      {showModal && <RegisterModal onClose={()=>setShowModal(false)}/>}
    </>
  );
}