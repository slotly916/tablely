"use client";

const pressItems = [
  {
    outlet: "ORF Tirol",
    type: "Fernsehen",
    date: "5. Juni 2026",
    badge: "Heute · 19:00 Uhr",
    live: true,
    title: "Tablely im ORF Tirol",
    excerpt: "Heute Abend um 19:00 Uhr ist Tablely im Fernsehen — im Regionalmagazin von ORF Tirol. Ein Beitrag über die KI-Reservierungsplattform aus dem Defereggental.",
    url: null,
    cta: "Heute um 19:00 Uhr in ORF 2 (Tirol heute)",
    accent: "#FF5C35",
  },
  {
    outlet: "Tiroler Tageszeitung",
    type: "Print & Online",
    date: "4. Juni 2026",
    badge: "Online lesen",
    live: false,
    title: "Noch Lehrling und schon sein eigener Chef: 19-Jähriger startet mit App-Firma durch",
    excerpt: "An seinem 18. Geburtstag gründete Michael Kleinlercher sein eigenes Unternehmen. Heute bietet er eine selbst entwickelte App an, die ein großes Problem der Gastronomie lösen soll. Einige Testabos sind schon verkauft.",
    url: "https://www.tt.com/artikel/30935315/noch-lehrling-und-schon-sein-eigener-chef-19-jaehriger-startet-mit-app-firma-durch",
    cta: "Artikel auf tt.com lesen",
    accent: "#1A1A2E",
  },
];

export default function PressePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--orange:#FF5C35;--dark:#1A1A2E;--cream:#FFFAF5;--muted:#6B6B80;--border:#F0EBE3;}
        html{scroll-behavior:smooth;}
        body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--dark);overflow-x:hidden;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes pulse-ring{0%{box-shadow:0 0 0 0 rgba(255,92,53,.5)}70%{box-shadow:0 0 0 12px rgba(255,92,53,0)}100%{box-shadow:0 0 0 0 rgba(255,92,53,0)}}
        .press-card:hover{transform:translateY(-3px);box-shadow:0 24px 48px rgba(26,26,46,.12)!important;}
        .press-cta:hover{gap:12px!important;}
        .nav-cta:hover{background:var(--orange)!important;color:#fff!important;}
        @media(max-width:768px){
          .press-card{flex-direction:column!important;}
          .press-card-side{width:100%!important;border-right:none!important;border-bottom:1px solid var(--border)!important;}
        }
      `}</style>

      {/* NAV */}
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 32px",position:"sticky",top:0,background:"rgba(255,250,245,0.97)",backdropFilter:"blur(16px)",zIndex:100,borderBottom:"1px solid var(--border)"}}>
        <a href="/" style={{textDecoration:"none",fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"var(--dark)"}}>table<span style={{color:"var(--orange)"}}>ly</span></a>
        <div style={{display:"flex",alignItems:"center",gap:"24px"}}>
          <a href="/" style={{textDecoration:"none",color:"var(--muted)",fontSize:"14px"}}>Startseite</a>
          <a href="/demo" style={{textDecoration:"none",color:"var(--muted)",fontSize:"14px"}}>Demo</a>
          <a href="/" className="nav-cta" style={{background:"var(--dark)",color:"#fff",border:"none",padding:"10px 20px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all .2s",textDecoration:"none"}}>
            Jetzt gratis testen
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{background:"var(--dark)",padding:"80px 32px 90px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-150px",right:"-100px",width:"450px",height:"450px",background:"radial-gradient(circle,rgba(255,92,53,.15) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:"800px",margin:"0 auto",textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{fontSize:"12px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1.5px",color:"#FF5C35",marginBottom:"16px"}}>Presse & Medien</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(34px,5vw,52px)",fontWeight:700,color:"#FFFAF5",letterSpacing:"-1.5px",lineHeight:1.05,marginBottom:"20px"}}>
            Tablely in den <span style={{color:"#FF5C35",fontStyle:"italic"}}>Medien.</span>
          </h1>
          <p style={{color:"rgba(255,255,255,.55)",fontSize:"17px",lineHeight:1.7,fontWeight:300,maxWidth:"560px",margin:"0 auto"}}>
            Was über Tablely und Gründer Michael Kleinlercher berichtet wird — von der Tiroler Tageszeitung bis zum ORF.
          </p>
        </div>
      </section>

      {/* PRESS ITEMS */}
      <section style={{background:"var(--cream)",padding:"70px 32px 90px"}}>
        <div style={{maxWidth:"880px",margin:"0 auto",display:"flex",flexDirection:"column",gap:"24px"}}>
          {pressItems.map((item,i)=>(
            <div key={i} className="press-card" style={{
              display:"flex",
              background:"#fff",
              borderRadius:"20px",
              border: item.live ? "1.5px solid rgba(255,92,53,.3)" : "1.5px solid var(--border)",
              overflow:"hidden",
              boxShadow:"0 8px 32px rgba(26,26,46,.06)",
              transition:"all .25s",
            }}>
              {/* Left side — Outlet */}
              <div className="press-card-side" style={{
                width:"220px",flexShrink:0,
                background: item.live ? "var(--dark)" : "#F5F0EB",
                padding:"28px 24px",
                borderRight:"1px solid var(--border)",
                display:"flex",flexDirection:"column",justifyContent:"center",
              }}>
                <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:item.live?"#FF5C35":"var(--orange)",marginBottom:"8px"}}>{item.type}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:item.live?"#FFFAF5":"var(--dark)",lineHeight:1.2,marginBottom:"10px"}}>{item.outlet}</div>
                <div style={{fontSize:"13px",color:item.live?"rgba(255,255,255,.5)":"var(--muted)"}}>{item.date}</div>
              </div>

              {/* Right side — Content */}
              <div style={{flex:1,padding:"28px",display:"flex",flexDirection:"column"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:"7px",alignSelf:"flex-start",background: item.live ? "rgba(255,92,53,.1)" : "rgba(26,26,46,.06)",border:`1px solid ${item.live?"rgba(255,92,53,.25)":"var(--border)"}`,borderRadius:"20px",padding:"5px 12px",marginBottom:"16px"}}>
                  {item.live && <span style={{width:"7px",height:"7px",borderRadius:"50%",background:"#FF5C35",animation:"pulse 1.5s infinite"}}/>}
                  <span style={{fontSize:"11px",color:item.live?"#FF5C35":"var(--muted)",fontWeight:600}}>{item.badge}</span>
                </div>

                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"var(--dark)",lineHeight:1.3,letterSpacing:"-0.3px",marginBottom:"12px"}}>{item.title}</h2>
                <p style={{fontSize:"14px",color:"var(--muted)",lineHeight:1.7,fontWeight:300,marginBottom:"20px",flex:1}}>{item.excerpt}</p>

                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="press-cta" style={{display:"inline-flex",alignItems:"center",gap:"8px",alignSelf:"flex-start",background:item.accent,color:"#fff",padding:"11px 22px",borderRadius:"10px",fontSize:"14px",fontWeight:600,textDecoration:"none",transition:"gap .2s"}}>
                    {item.cta}
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3.5 7.5h8M8 4l3.5 3.5L8 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>
                ) : (
                  <div style={{display:"inline-flex",alignItems:"center",gap:"10px",alignSelf:"flex-start",background:"rgba(255,92,53,.1)",border:"1px solid rgba(255,92,53,.25)",color:"#FF5C35",padding:"11px 22px",borderRadius:"10px",fontSize:"14px",fontWeight:600}}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 14h5M8 12v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    {item.cta}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Kontakt für Presse */}
        <div style={{maxWidth:"880px",margin:"40px auto 0",background:"var(--dark)",borderRadius:"20px",padding:"36px 40px",textAlign:"center"}}>
          <div style={{fontSize:"11px",fontWeight:600,textTransform:"uppercase",letterSpacing:"1.5px",color:"#FF5C35",marginBottom:"12px"}}>Presseanfragen</div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#FFFAF5",letterSpacing:"-0.5px",marginBottom:"12px"}}>Über Tablely berichten?</h3>
          <p style={{fontSize:"14px",color:"rgba(255,255,255,.5)",fontWeight:300,lineHeight:1.7,marginBottom:"24px",maxWidth:"440px",margin:"0 auto 24px"}}>
            Gerne stelle ich Pressematerial, Bilder und Interviews zur Verfügung. Schreib mir einfach.
          </p>
          <a href="mailto:michael@tablely.at?subject=Presseanfrage Tablely" style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#FF5C35",color:"#fff",padding:"13px 28px",borderRadius:"10px",fontSize:"15px",fontWeight:600,textDecoration:"none"}}>
            michael@tablely.at
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:"24px 32px",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
        <a href="/" style={{textDecoration:"none",fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:700,color:"var(--dark)"}}>table<span style={{color:"var(--orange)"}}>ly</span></a>
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