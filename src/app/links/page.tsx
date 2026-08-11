"use client";

import { useState } from "react";

const links = [
  {
    label: "Webseite",
    sublabel: "tablely.at",
    // Ohne www: das Canonical der Seite ist die Apex-Domain. Ein interner
    // Link auf die www-Variante zeigt auf eine Weiterleitung.
    url: "https://tablely.at",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11 2c0 0-4 4-4 9s4 9 4 9M11 2c0 0 4 4 4 9s-4 9-4 9M2 11h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: "#FF5C35",
    bg: "rgba(255,92,53,0.12)",
    border: "rgba(255,92,53,0.25)",
  },
  {
    label: "YouTube",
    sublabel: "Video ansehen",
    url: "https://youtu.be/H-yma4Nxwy4?is=ds_5xzC9Wnq30Is_",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="5" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 8.5l5 2.5-5 2.5V8.5z" fill="currentColor"/>
      </svg>
    ),
    color: "#F87171",
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.25)",
  },
  {
    label: "Instagram",
    sublabel: "@Butlery.app",
    url: "https://www.instagram.com/Butlery.app?igsh=MW5xNjBlN3ozdjUxYw%3D%3D&utm_source=qr",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="2" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="16" cy="6" r="1" fill="currentColor"/>
      </svg>
    ),
    color: "#E1306C",
    bg: "rgba(225,48,108,0.12)",
    border: "rgba(225,48,108,0.25)",
  },
  {
    label: "TikTok",
    sublabel: "@Butlery",
    url: "https://www.tiktok.com/@Butlery?_r=1&_t=ZN-96svwc6H5za",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M15 3c0 2 1.5 3.5 3.5 3.5v3c-1.5 0-3-.5-4-1.3V14a5 5 0 1 1-5-5c.2 0 .3 0 .5.02V12a2 2 0 1 0 2 2V3h3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "#FFFAF5",
    bg: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.18)",
  },
];

export default function LinkTree() {
  const [clicked, setClicked] = useState<number | null>(null);

  function handleClick(idx: number, url: string) {
    setClicked(idx);
    setTimeout(() => {
      setClicked(null);
      window.open(url, "_blank");
    }, 150);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0F0F1A",
      fontFamily: "var(--font-sans)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes float-glow {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate(20px, -30px) scale(1.1); opacity: 0.6; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .link-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fade-in 0.6s ease-out backwards;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .link-card:hover { transform: translateY(-3px) scale(1.01); }
        .link-card:active { transform: scale(0.98); }
      `}</style>

      <div style={{position:"absolute",top:"-100px",left:"-100px",width:"400px",height:"400px",background:"radial-gradient(circle, rgba(255,92,53,0.12) 0%, transparent 70%)",animation:"float-glow 8s ease-in-out infinite",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-100px",right:"-100px",width:"400px",height:"400px",background:"radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)",animation:"float-glow 10s ease-in-out infinite reverse",pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:"440px",position:"relative",zIndex:1}}>

        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:"44px",animation:"fade-in 0.6s ease-out"}}>
          <div style={{
            width:"72px",height:"72px",borderRadius:"22px",
            background:"linear-gradient(135deg, #FF5C35, #FF8A6B)",
            display:"flex",alignItems:"center",justifyContent:"center",
            margin:"0 auto 20px",
            boxShadow:"0 12px 32px rgba(255,92,53,0.35)",
          }}>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:"38px",fontWeight:700,color:"#fff",lineHeight:1}}>t</span>
          </div>
          <div style={{
            fontFamily:"'Playfair Display',serif",
            fontSize:"34px",fontWeight:700,
            color:"#FFFAF5",
            letterSpacing:"-1.5px",
            lineHeight:1,
          }}>
            <img src="/butlery-logo-dunkel.png" alt="Butlery" style={{height:"24px",width:"auto",display:"inline-block",verticalAlign:"middle"}}/>
          </div>
        </div>

        {/* Links */}
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          {links.map((link, i) => (
            <div
              key={i}
              className="link-card"
              onClick={() => handleClick(i, link.url)}
              style={{
                animationDelay: `${0.1 + i * 0.08}s`,
                background: clicked === i ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${clicked === i ? link.border : "rgba(255,255,255,0.07)"}`,
                borderRadius:"16px",
                padding:"18px 20px",
                display:"flex",
                alignItems:"center",
                gap:"16px",
              }}
            >
              <div style={{
                width:"48px",height:"48px",borderRadius:"14px",
                background: link.bg,border: `1px solid ${link.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                color: link.color,flexShrink:0,
              }}>
                {link.icon}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:"16px",fontWeight:600,color:"#FFFAF5",marginBottom:"2px"}}>{link.label}</div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,0.45)",fontWeight:400}}>{link.sublabel}</div>
              </div>
              <div style={{
                width:"32px",height:"32px",borderRadius:"50%",
                background:"rgba(255,255,255,0.05)",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"rgba(255,255,255,0.4)",flexShrink:0,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{textAlign:"center",marginTop:"40px"}}>
          <div style={{fontSize:"12px",color:"rgba(255,255,255,0.2)",lineHeight:1.6}}>
            © 2026 Butlery · Made in Austria
          </div>
        </div>
      </div>
    </div>
  );
}