"use client";

import { useState } from "react";

function WaitlistSection() {
  const [name, setName] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit() {
    if (!name || !restaurant || !email) { setErrorMsg("Bitte alle Felder ausfüllen."); return; }
    setStatus("loading"); setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name,restaurant,email}) });
      const data = await res.json();
      if (data.success) setStatus("success");
      else { setStatus("error"); setErrorMsg(data.error||"Unbekannter Fehler."); }
    } catch { setStatus("error"); setErrorMsg("Verbindungsfehler."); }
  }

  if (status === "success") return (
    <section id="waitlist" style={{padding:"80px 24px",maxWidth:"680px",margin:"0 auto",textAlign:"center"}}>
      <div style={{fontFamily:"Georgia,serif",fontSize:"32px",fontWeight:700,color:"#1A1A2E",marginBottom:"16px"}}>Du bist dabei! 🎉</div>
      <p style={{color:"#6B6B80",fontSize:"15px",fontWeight:300,marginBottom:"24px"}}>Wir melden uns persönlich bei dir sobald Tablely startet.</p>
      <div style={{display:"inline-flex",alignItems:"center",gap:"10px",background:"#E8F8F1",padding:"14px 24px",borderRadius:"10px",color:"#25C281",fontWeight:500}}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#25C281" strokeWidth="1.4"/><path d="M5.5 9l2.5 2.5 4.5-5" stroke="#25C281" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Erfolgreich eingetragen
      </div>
    </section>
  );

  return (
    <section id="waitlist" style={{padding:"80px 24px",maxWidth:"680px",margin:"0 auto",textAlign:"center"}}>
      <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"#FF5C35",marginBottom:"12px"}}>Warteliste</div>
      <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(28px,4vw,40px)",fontWeight:700,letterSpacing:"-1px",lineHeight:1.1,marginBottom:"14px",color:"#1A1A2E"}}>Sei unter den <em style={{color:"#FF5C35",fontStyle:"italic"}}>Ersten</em><br/>in Österreich.</h2>
      <p style={{color:"#6B6B80",fontSize:"15px",lineHeight:1.7,fontWeight:300,marginBottom:"28px"}}>Tablely ist bald verfügbar. Trag dich jetzt ein und erhalte exklusiven Frühzugang — inklusive persönlicher Einrichtung.</p>
      <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"14px"}}>
        {[
          {ph:"Dein Name",val:name,set:setName,type:"text"},
          {ph:"Name deines Restaurants",val:restaurant,set:setRestaurant,type:"text"},
          {ph:"deine@email.at",val:email,set:setEmail,type:"email"},
        ].map((f,i)=>(
          <input key={i} type={f.type} placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)} disabled={status==="loading"}
            style={{width:"100%",padding:"13px 16px",border:"1.5px solid #F0EBE3",borderRadius:"10px",fontSize:"15px",fontFamily:"inherit",background:"#fff",color:"#1A1A2E",outline:"none"}}
          />
        ))}
        <button onClick={handleSubmit} disabled={status==="loading"} style={{width:"100%",background:"#FF5C35",color:"#fff",border:"none",padding:"14px",borderRadius:"10px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:status==="loading"?0.7:1}}>
          {status==="loading"?"Wird eingetragen...":"Jetzt eintragen →"}
        </button>
      </div>
      {errorMsg && <p style={{color:"#E24B4A",fontSize:"13px"}}>{errorMsg}</p>}
      <p style={{fontSize:"12px",color:"#6B6B80"}}>Kein Spam. Nur eine E-Mail wenn Tablely live geht.</p>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--orange:#FF5C35;--dark:#1A1A2E;--cream:#FFFAF5;--muted:#6B6B80;--border:#F0EBE3;}
        html{scroll-behavior:smooth;}
        body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--dark);overflow-x:hidden;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .nav-cta:hover{background:var(--orange)!important;}
        .btn-primary:hover{background:#FF7A5A!important;transform:translateY(-1px);box-shadow:0 8px 24px rgba(255,92,53,.4)!important;}
        .feat-mini:hover{border-color:rgba(255,92,53,.3)!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,92,53,.07)!important;}
      `}</style>

      {/* NAV */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 32px",position:"sticky",top:0,background:"rgba(255,250,245,0.97)",backdropFilter:"blur(16px)",zIndex:100,borderBottom:"1px solid var(--border)"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"var(--dark)"}}>table<span style={{color:"var(--orange)"}}>ly</span></div>
        <div style={{display:"flex",alignItems:"center",gap:"24px"}}>
          <a href="#features" style={{fontSize:"14px",color:"var(--muted)",textDecoration:"none"}}>Funktionen</a>
          <a href="#demo" style={{fontSize:"14px",color:"var(--muted)",textDecoration:"none"}}>Demo</a>
          <a href="#waitlist" style={{fontSize:"14px",color:"var(--muted)",textDecoration:"none"}}>Warteliste</a>
          <button className="nav-cta" onClick={()=>document.getElementById('waitlist')?.scrollIntoView({behavior:'smooth'})} style={{background:"var(--dark)",color:"#fff",border:"none",padding:"9px 18px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
            Warteliste beitreten
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{background:"var(--dark)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-150px",right:"-150px",width:"500px",height:"500px",background:"radial-gradient(circle,rgba(255,92,53,.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:"1200px",margin:"0 auto",padding:"80px 32px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"flex-end"}}>
          <div style={{paddingBottom:"80px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,92,53,.15)",color:"var(--orange)",fontSize:"11px",fontWeight:500,padding:"5px 12px",borderRadius:"20px",marginBottom:"24px",border:"1px solid rgba(255,92,53,.25)"}}>
              <span style={{width:"6px",height:"6px",background:"var(--orange)",borderRadius:"50%",animation:"pulse 2s infinite",flexShrink:0}}/>
              Demnächst in Österreich
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(36px,4vw,58px)",fontWeight:700,lineHeight:1.05,letterSpacing:"-2px",marginBottom:"20px",color:"#FFFAF5"}}>
              Dein Restaurant.<br/>Endlich auf <em style={{color:"var(--orange)",fontStyle:"italic"}}>Autopilot.</em>
            </h1>
            <p style={{color:"rgba(255,255,255,.5)",fontSize:"17px",lineHeight:1.7,marginBottom:"36px",fontWeight:300,maxWidth:"460px"}}>
              Kein Telefon mehr das klingelt. Keine verpassten Reservierungen. Keine No-Shows. Tablely übernimmt alles — automatisch, rund um die Uhr.
            </p>
            <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
              <button className="btn-primary" onClick={()=>document.getElementById('waitlist')?.scrollIntoView({behavior:'smooth'})} style={{background:"var(--orange)",color:"#fff",border:"none",padding:"15px 28px",borderRadius:"10px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all .25s"}}>
                Jetzt zur Warteliste →
              </button>
              <span style={{fontSize:"13px",color:"rgba(255,255,255,.3)"}}>Sei unter den Ersten</span>
            </div>
          </div>
          <div style={{background:"#fff",borderRadius:"16px 16px 0 0",padding:"20px",boxShadow:"0 -8px 60px rgba(0,0,0,.4)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"16px"}}>
              {["#FF5F57","#FEBC2E","#28C840"].map((c,i)=><div key={i} style={{width:"9px",height:"9px",borderRadius:"50%",background:c}}/>)}
              <span style={{marginLeft:"8px",fontSize:"11px",color:"var(--muted)",fontWeight:500}}>Tablely Dashboard</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"16px"}}>
              {[{l:"Reservierungen",v:"24",s:"↑ +6 heute"},{l:"No-Shows",v:"0",s:"Alle erinnert ✓",sc:"#FF5C35"},{l:"WhatsApp",v:"11",s:"Auto-beantwortet"}].map((s,i)=>(
                <div key={i} style={{background:"#FFFAF5",borderRadius:"8px",padding:"10px 12px",border:"1px solid #F0EBE3"}}>
                  <div style={{fontSize:"9px",color:"#6B6B80",fontWeight:500,textTransform:"uppercase",letterSpacing:".5px",marginBottom:"3px"}}>{s.l}</div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E"}}>{s.v}</div>
                  <div style={{fontSize:"9px",color:s.sc||"#25C281",fontWeight:500}}>{s.s}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:"10px",fontWeight:600,color:"#6B6B80",textTransform:"uppercase",letterSpacing:".5px",marginBottom:"8px"}}>Nächste Reservierungen</div>
            {[{i:"MK",n:"Maria K.",t:"18:30 · 4 Pers.",b:"Bestätigt",bc:"#E8F8F1",tc:"#25C281"},{i:"TH",n:"Thomas H.",t:"19:00 · 2 Pers.",b:"WhatsApp",bc:"#E8F8F1",tc:"#25D366"},{i:"SF",n:"Sarah F.",t:"19:30 · 6 Pers.",b:"Ausstehend",bc:"#FFF0EB",tc:"#FF5C35"}].map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",background:"#FFFAF5",borderRadius:"8px",padding:"8px 10px",border:"1px solid #F0EBE3",marginBottom:"6px"}}>
                <div style={{width:"26px",height:"26px",borderRadius:"50%",background:"#FFF0EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:600,color:"#FF5C35",flexShrink:0}}>{r.i}</div>
                <div style={{flex:1}}><div style={{fontSize:"11px",fontWeight:500,color:"#1A1A2E"}}>{r.n}</div><div style={{fontSize:"9px",color:"#6B6B80"}}>{r.t}</div></div>
                <span style={{fontSize:"9px",fontWeight:500,padding:"2px 6px",borderRadius:"5px",background:r.bc,color:r.tc}}>{r.b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PROBLEM */}
      <section style={{padding:"100px 32px",maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"80px",alignItems:"center"}}>
          <div style={{background:"#fff",borderRadius:"16px",padding:"24px",border:"1.5px solid var(--border)",boxShadow:"0 4px 20px rgba(26,26,46,.05)"}}>
            <div style={{fontSize:"13px",fontWeight:600,color:"var(--dark)",marginBottom:"16px",display:"flex",alignItems:"center",gap:"8px"}}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#E24B4A" strokeWidth="1.2"/><path d="M8 4v5M8 11v1" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round"/></svg>
              So war es bisher
            </div>
            {[
              {t:"Telefon klingelt mitten in der Stoßzeit",d:"Du nimmst ab, verlierst den Faden — der Tisch wartet."},
              {t:"No-Show um 20:00 Uhr",d:"Tisch für 4 bleibt leer. Umsatz verloren, nichts zu machen."},
              {t:"WhatsApp-Chaos",d:"23 ungelesene Nachrichten. Wer hat wo gebucht?"},
              {t:"Doppelbuchungen",d:"Zwei Gäste, ein Tisch. Peinlich und vermeidbar."},
            ].map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"10px 0",borderBottom:i<3?"1px solid var(--border)":"none"}}>
                <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"#FEE8E8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"2px"}}>
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </div>
                <div style={{fontSize:"13px",color:"var(--muted)",lineHeight:1.5}}>
                  <strong style={{color:"var(--dark)",fontWeight:500,display:"block",marginBottom:"1px"}}>{s.t}</strong>{s.d}
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:"11px",fontWeight:500,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"12px"}}>Das Problem</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,3vw,40px)",fontWeight:700,letterSpacing:"-.5px",lineHeight:1.15,marginBottom:"16px"}}>Restaurants verlieren täglich Geld durch manuelle Prozesse.</h2>
            <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.75,fontWeight:300,marginBottom:"12px"}}>Ein durchschnittlicher Restaurantbetreiber verbringt über 2 Stunden täglich mit Reservierungsanrufen, WhatsApp-Nachrichten und dem Erinnern von Gästen.</p>
            <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.75,fontWeight:300}}>Das ist Zeit die du in dein Essen, dein Team und deine Gäste investieren könntest. Tablely nimmt dir genau das ab — vollautomatisch.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{padding:"0 32px 100px",maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{fontSize:"11px",fontWeight:500,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"12px"}}>Wie Tablely funktioniert</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,3vw,40px)",fontWeight:700,letterSpacing:"-.5px",marginBottom:"12px",lineHeight:1.15}}>Drei Wege zu reservieren.<br/>Ein Dashboard für alles.</h2>
        <p style={{color:"var(--muted)",fontSize:"16px",lineHeight:1.7,fontWeight:300,marginBottom:"48px",maxWidth:"560px"}}>WhatsApp, Telefon oder online — deine Gäste wählen wie sie buchen. Tablely übernimmt den Rest vollautomatisch.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",marginBottom:"20px"}}>
          {/* WhatsApp KI */}
          <div style={{background:"var(--dark)",borderRadius:"20px",padding:"32px",display:"flex",flexDirection:"column",justifyContent:"flex-end",minHeight:"420px"}}>
            <div style={{background:"rgba(255,255,255,.06)",borderRadius:"10px",padding:"14px",marginBottom:"20px",border:"1px solid rgba(255,255,255,.08)"}}>
              <div style={{fontSize:"11px",padding:"7px 10px",borderRadius:"7px 7px 7px 2px",background:"rgba(255,255,255,.12)",marginBottom:"6px",lineHeight:1.4,color:"rgba(255,255,255,.8)",maxWidth:"82%"}}>Hallo! Tisch für 3 Personen am Freitag um 19:30 Uhr? 🙏</div>
              <div style={{fontSize:"11px",padding:"7px 10px",borderRadius:"7px 7px 2px 7px",background:"#25D366",marginLeft:"auto",lineHeight:1.4,color:"#fff",maxWidth:"82%"}}>Perfekt! Tisch für 3 am Fr. 20.03. um 19:30 Uhr ist reserviert ✅ Wir freuen uns auf euch!</div>
            </div>
            <div style={{fontSize:"10px",fontWeight:600,textTransform:"uppercase",letterSpacing:".8px",padding:"3px 8px",borderRadius:"5px",background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.7)",display:"inline-block",marginBottom:"10px",width:"fit-content"}}>WhatsApp KI</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#fff",marginBottom:"8px"}}>Gäste schreiben — KI antwortet &amp; bucht</div>
            <p style={{fontSize:"13px",color:"rgba(255,255,255,.5)",lineHeight:1.6,fontWeight:300}}>Die KI versteht Tisch, Personenzahl und Uhrzeit — antwortet in Sekunden und trägt alles automatisch ein.</p>
          </div>
          {/* Telefon KI */}
          <div style={{background:"var(--orange)",borderRadius:"20px",padding:"32px",display:"flex",flexDirection:"column",justifyContent:"flex-end",minHeight:"420px"}}>
            <div style={{background:"rgba(255,255,255,.12)",borderRadius:"10px",padding:"14px",marginBottom:"20px",border:"1px solid rgba(255,255,255,.15)"}}>
              {[["Gast ruft an","KI nimmt ab"],["Tisch, Zeit, Personen","KI versteht alles"],["Reservierung","Automatisch gespeichert"],["Komplex?","Weiterleitung ans Team"]].map(([l,r],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<3?"1px solid rgba(255,255,255,.1)":"none",fontSize:"11px"}}>
                  <span style={{color:"rgba(255,255,255,.6)"}}>{l}</span>
                  <span style={{color:"#fff",fontWeight:500}}>→ {r}</span>
                </div>
              ))}
            </div>
            <div style={{fontSize:"10px",fontWeight:600,textTransform:"uppercase",letterSpacing:".8px",padding:"3px 8px",borderRadius:"5px",background:"rgba(255,255,255,.2)",color:"#fff",display:"inline-block",marginBottom:"10px",width:"fit-content"}}>KI Telefon</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#fff",marginBottom:"8px"}}>KI nimmt Anrufe entgegen — automatisch</div>
            <p style={{fontSize:"13px",color:"rgba(255,255,255,.8)",lineHeight:1.6,fontWeight:300}}>Kein Anruf geht mehr verloren. Die KI nimmt ab und trägt alles direkt ein.</p>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}}>
          {[
            {icon:<svg viewBox="0 0 28 28" fill="none" width="28" height="28"><rect x="3" y="5" width="22" height="18" rx="3" stroke="#FF5C35" strokeWidth="1.4"/><path d="M3 11h22M9 4v3M19 4v3" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>,t:"Online Buchung",d:"Eigene Booking Page — Gäste buchen direkt rund um die Uhr."},
            {icon:<svg viewBox="0 0 28 28" fill="none" width="28" height="28"><rect x="2" y="2" width="24" height="24" rx="4" stroke="#FF5C35" strokeWidth="1.4"/><path d="M2 11h24" stroke="#FF5C35" strokeWidth="1.4"/><rect x="6" y="15" width="7" height="5" rx="1.5" fill="#FF5C35" fillOpacity=".2" stroke="#FF5C35" strokeWidth="1.2"/></svg>,t:"Alles im Dashboard",d:"WhatsApp, Telefon, Online — alles an einem Ort. Live und übersichtlich."},
            {icon:<svg viewBox="0 0 28 28" fill="none" width="28" height="28"><path d="M14 3v3M14 3a8 8 0 0 1 8 8c0 4-1.5 5.5-1.5 5.5H7.5S6 15 6 11A8 8 0 0 1 14 3Z" stroke="#FF5C35" strokeWidth="1.4" strokeLinejoin="round"/><path d="M10 19s0 4 4 4 4-4 4-4" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/></svg>,t:"Auto-Erinnerungen",d:"Gäste werden 24h und 2h vor der Reservierung erinnert. No-Shows sinken auf fast null."},
          ].map((f,i)=>(
            <div key={i} className="feat-mini" style={{background:"#fff",borderRadius:"16px",padding:"24px",border:"1.5px solid var(--border)",transition:"all .25s"}}>
              <div style={{marginBottom:"14px"}}>{f.icon}</div>
              <div style={{fontSize:"14px",fontWeight:600,color:"var(--dark)",marginBottom:"6px"}}>{f.t}</div>
              <p style={{fontSize:"13px",color:"var(--muted)",lineHeight:1.6,fontWeight:300}}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO SEKTION */}
      <section id="demo" style={{padding:"100px 32px",background:"#0F0F14",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",top:"-200px",left:"50%",transform:"translateX(-50%)",width:"800px",height:"800px",background:"radial-gradient(circle,rgba(255,92,53,.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:"1100px",margin:"0 auto",position:"relative"}}>

          <div style={{textAlign:"center",marginBottom:"72px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,92,53,.12)",color:"#FF5C35",fontSize:"11px",fontWeight:600,padding:"5px 14px",borderRadius:"20px",marginBottom:"16px",border:"1px solid rgba(255,92,53,.2)",textTransform:"uppercase",letterSpacing:"1px"}}>Live Demo</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,4vw,44px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1px",lineHeight:1.1,marginBottom:"16px"}}>Probier es selbst aus.</h2>
            <p style={{fontSize:"16px",color:"rgba(255,255,255,.4)",fontWeight:300,maxWidth:"480px",margin:"0 auto",lineHeight:1.7}}>Reserviere unten als Gast — und sieh wie die Buchung sofort im Dashboard erscheint.</p>
          </div>

          {/* iPhone oben */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px",marginBottom:"48px"}}>
            <div style={{fontSize:"12px",fontWeight:600,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:"1px",display:"flex",alignItems:"center",gap:"8px"}}>
              <div style={{width:"20px",height:"1px",background:"rgba(255,255,255,.2)"}}/>Gast bucht hier<div style={{width:"20px",height:"1px",background:"rgba(255,255,255,.2)"}}/>
            </div>
            <div style={{position:"relative",width:"300px"}}>
              <div style={{background:"#1A1A1A",borderRadius:"44px",padding:"12px",boxShadow:"0 0 0 2px #333,0 40px 80px rgba(0,0,0,.6),inset 0 0 0 2px #222",position:"relative"}}>
                <div style={{position:"absolute",top:"12px",left:"50%",transform:"translateX(-50%)",width:"110px",height:"32px",background:"#1A1A1A",borderRadius:"0 0 18px 18px",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
                  <div style={{width:"10px",height:"10px",borderRadius:"50%",background:"#111"}}/>
                  <div style={{width:"50px",height:"5px",borderRadius:"4px",background:"#111"}}/>
                </div>
                <div style={{borderRadius:"36px",overflow:"hidden",height:"560px",background:"#FFFAF5"}}>
                  <iframe src="/book/alpengasthof" style={{width:"375px",height:"812px",border:"none",transform:"scale(0.8)",transformOrigin:"top left"}} title="Tablely Booking Demo"/>
                </div>
              </div>
              <div style={{position:"absolute",right:"-3px",top:"120px",width:"3px",height:"60px",background:"#333",borderRadius:"0 2px 2px 0"}}/>
              <div style={{position:"absolute",left:"-3px",top:"100px",width:"3px",height:"40px",background:"#333",borderRadius:"2px 0 0 2px"}}/>
              <div style={{position:"absolute",left:"-3px",top:"150px",width:"3px",height:"40px",background:"#333",borderRadius:"2px 0 0 2px"}}/>
            </div>
          </div>

          {/* Pfeil */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",marginBottom:"48px"}}>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,.3)",fontWeight:300}}>Buchung erscheint sofort im Dashboard</div>
            <div style={{width:"1px",height:"40px",background:"linear-gradient(to bottom,rgba(255,92,53,.5),transparent)"}}/>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M3 9l5 5 5-5" stroke="#FF5C35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>

          {/* MacBook unten */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px"}}>
            <div style={{fontSize:"12px",fontWeight:600,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:"1px",display:"flex",alignItems:"center",gap:"8px"}}>
              <div style={{width:"20px",height:"1px",background:"rgba(255,255,255,.2)"}}/>Restaurant verwaltet hier<div style={{width:"20px",height:"1px",background:"rgba(255,255,255,.2)"}}/>
            </div>
            <div style={{width:"100%",maxWidth:"860px"}}>
              <div style={{background:"#1E1E1E",borderRadius:"14px 14px 0 0",padding:"10px 10px 0",boxShadow:"0 0 0 1.5px #333",position:"relative"}}>
                <div style={{position:"absolute",top:"7px",left:"50%",transform:"translateX(-50%)",width:"5px",height:"5px",borderRadius:"50%",background:"#333"}}/>
                <div style={{borderRadius:"6px 6px 0 0",overflow:"hidden",height:"420px",background:"#0F0F14",border:"1px solid #2a2a2a",borderBottom:"none",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"}}>
                  <div style={{fontSize:"13px",color:"rgba(255,255,255,.2)",fontWeight:300,fontFamily:"monospace"}}>tablely.at/dashboard</div>
                  <a href="/dashboard" target="_blank" style={{background:"#FF5C35",color:"#fff",padding:"11px 24px",borderRadius:"8px",fontSize:"13px",fontWeight:500,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:"6px"}}>
                    Dashboard öffnen →
                  </a>
                  <div style={{fontSize:"12px",color:"rgba(255,255,255,.15)",fontWeight:300}}>Einloggen um das Dashboard zu sehen</div>
                </div>
              </div>
              <div style={{background:"#2A2A2A",height:"18px",borderRadius:"0 0 4px 4px",boxShadow:"0 0 0 1.5px #333"}}/>
              <div style={{background:"#1A1A1A",height:"6px",borderRadius:"0 0 10px 10px",margin:"0 60px",boxShadow:"0 4px 12px rgba(0,0,0,.5)"}}/>
            </div>
          </div>

          {/* WhatsApp / Telefon CTA */}
          <div style={{textAlign:"center",marginTop:"80px",padding:"40px",background:"rgba(255,255,255,.03)",borderRadius:"20px",border:"1px solid rgba(255,255,255,.07)"}}>
            <p style={{fontSize:"16px",color:"rgba(255,255,255,.5)",fontWeight:300,marginBottom:"20px",lineHeight:1.7}}>
              Willst du sehen wie es per <strong style={{color:"#25D366"}}>WhatsApp</strong> oder <strong style={{color:"var(--orange)"}}>Telefon</strong> läuft?
            </p>
            <a href="#waitlist" style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#FF5C35",color:"#fff",padding:"12px 28px",borderRadius:"10px",fontSize:"14px",fontWeight:500,textDecoration:"none"}}>
              Kontakt aufnehmen →
            </a>
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <div style={{background:"var(--dark)",padding:"80px 32px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
        <div style={{maxWidth:"1100px",margin:"0 auto"}}>
          <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--orange)",marginBottom:"12px"}}>Was Tablely bewirkt</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,3vw,40px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1px",marginBottom:"40px"}}>Zahlen die sprechen.</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",border:"1px solid rgba(255,255,255,.07)",borderRadius:"16px",overflow:"hidden"}}>
            {[{v:"–60%",l:"weniger No-Shows durch automatische Erinnerungen"},{v:"2h",l:"täglich gespart — keine Reservierungsanrufe mehr"},{v:"24/7",l:"Buchungen annehmen — auch wenn du schläfst"}].map((n,i)=>(
              <div key={i} style={{padding:"40px 32px",textAlign:"center",borderRight:i<2?"1px solid rgba(255,255,255,.07)":"none"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(36px,4vw,52px)",fontWeight:700,color:"var(--orange)",letterSpacing:"-2px",marginBottom:"10px"}}>{n.v}</div>
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