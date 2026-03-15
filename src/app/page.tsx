"use client";

import { useState } from "react";

function WaitlistSection() {
  const [name, setName] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit() {
    if (!name || !restaurant || !email) {
      setErrorMsg("Bitte alle Felder ausfüllen.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, restaurant, email }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Unbekannter Fehler.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Verbindungsfehler. Bitte nochmal versuchen.");
    }
  }

  if (status === "success") {
    return (
      <section className="waitlist" id="waitlist">
        <div className="section-label" style={{textAlign:"center"}}>Warteliste</div>
        <h2>Du bist dabei! 🎉</h2>
        <p>Wir melden uns persönlich bei dir sobald Tablely in Österreich startet. Versprochen.</p>
        <div style={{display:"inline-flex",alignItems:"center",gap:"10px",background:"#E8F8F1",padding:"14px 24px",borderRadius:"10px",color:"#25C281",fontWeight:500,fontSize:"15px"}}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#25C281" strokeWidth="1.4"/><path d="M5.5 9l2.5 2.5 4.5-5" stroke="#25C281" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Erfolgreich eingetragen
        </div>
      </section>
    );
  }

  return (
    <section className="waitlist" id="waitlist">
      <div className="section-label" style={{textAlign:"center"}}>Warteliste</div>
      <h2>Sei unter den <em>Ersten</em><br />in Österreich.</h2>
      <p>Tablely ist bald verfügbar. Trag dich jetzt ein und erhalte exklusiven Frühzugang — inklusive persönlicher Einrichtung durch unser Team.</p>
      <div className="waitlist-form">
        <input
          className="waitlist-input"
          type="text"
          placeholder="Dein Name"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={status === "loading"}
        />
        <input
          className="waitlist-input"
          type="text"
          placeholder="Name deines Restaurants"
          value={restaurant}
          onChange={e => setRestaurant(e.target.value)}
          disabled={status === "loading"}
        />
        <input
          className="waitlist-input"
          type="email"
          placeholder="deine@email.at"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={status === "loading"}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />
        <button
          className="waitlist-btn"
          onClick={handleSubmit}
          disabled={status === "loading"}
          style={{opacity: status === "loading" ? 0.7 : 1}}
        >
          {status === "loading" ? "Wird eingetragen..." : "Jetzt eintragen →"}
        </button>
      </div>
      {errorMsg && (
        <p style={{color:"#E24B4A", fontSize:"13px", marginTop:"8px"}}>{errorMsg}</p>
      )}
      <p className="waitlist-note">Kein Spam. Nur eine E-Mail wenn Tablely live geht.</p>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --orange: #FF5C35;
          --orange-light: #FF7A5A;
          --orange-pale: #FFF0EB;
          --cream: #FFFAF5;
          --dark: #1A1A2E;
          --muted: #6B6B80;
          --border: #F0EBE3;
        }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--dark); overflow-x: hidden; }

        /* ─── NAV ─── */
        nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; position: sticky; top: 0; background: rgba(255,250,245,0.97); backdrop-filter: blur(16px); z-index: 100; border-bottom: 1px solid var(--border); }
        .logo { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--dark); letter-spacing: -0.5px; }
        .logo span { color: var(--orange); }
        .nav-right { display: flex; align-items: center; gap: 12px; }
        .nav-links { display: none; gap: 24px; list-style: none; }
        .nav-links a { text-decoration: none; color: var(--muted); font-size: 14px; transition: color .2s; }
        .nav-links a:hover { color: var(--dark); }
        .nav-cta { background: var(--dark); color: #fff; border: none; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .2s; white-space: nowrap; }
        .nav-cta:hover { background: var(--orange); }

        /* ─── HERO ─── */
        .hero-wrap { background: var(--dark); overflow: hidden; position: relative; }
        .hero-wrap::before { content: ''; position: absolute; top: -200px; right: -200px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(255,92,53,0.12) 0%, transparent 70%); pointer-events: none; }
        .hero { padding: 56px 24px 48px; max-width: 1200px; margin: 0 auto; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,92,53,0.15); color: var(--orange); font-size: 11px; font-weight: 500; padding: 5px 12px; border-radius: 20px; margin-bottom: 20px; border: 1px solid rgba(255,92,53,0.25); }
        .hero-badge::before { content: ''; width: 6px; height: 6px; background: var(--orange); border-radius: 50%; animation: pulse 2s infinite; flex-shrink: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .hero h1 { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; line-height: 1.1; letter-spacing: -1px; margin-bottom: 16px; color: #fff; }
        .hero h1 em { color: var(--orange); font-style: italic; }
        .hero-sub { color: rgba(255,255,255,0.55); font-size: 15px; line-height: 1.7; margin-bottom: 28px; font-weight: 300; }
        .hero-actions { display: flex; flex-direction: column; gap: 12px; margin-bottom: 0; }
        .btn-waitlist { background: var(--orange); color: #fff; border: none; padding: 15px 28px; border-radius: 10px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .25s; text-align: center; }
        .btn-waitlist:hover { background: var(--orange-light); box-shadow: 0 8px 24px rgba(255,92,53,0.4); }
        .hero-note { font-size: 12px; color: rgba(255,255,255,0.35); text-align: center; }
        .hero-visual { display: none; }

        /* ─── DASHBOARD MOCK ─── */
        .dashboard-mock { background: #fff; border-radius: 16px 16px 0 0; padding: 18px; box-shadow: 0 -8px 60px rgba(0,0,0,0.4); }
        .dash-topbar { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; }
        .dash-dot { width: 9px; height: 9px; border-radius: 50%; }
        .dash-dot.r { background: #FF5F57; } .dash-dot.y { background: #FEBC2E; } .dash-dot.g { background: #28C840; }
        .dash-title { margin-left: 8px; font-size: 11px; font-weight: 500; color: var(--muted); }
        .dash-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 14px; }
        .dash-stat { background: var(--cream); border-radius: 8px; padding: 10px 12px; border: 1px solid var(--border); }
        .dash-stat-label { font-size: 9px; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
        .dash-stat-val { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: var(--dark); }
        .dash-stat-sub { font-size: 9px; color: #25C281; font-weight: 500; }
        .dash-section-title { font-size: 10px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .dash-reservations { display: flex; flex-direction: column; gap: 6px; }
        .dash-res-row { display: flex; align-items: center; gap: 8px; background: var(--cream); border-radius: 8px; padding: 8px 10px; border: 1px solid var(--border); }
        .dash-res-avatar { width: 26px; height: 26px; border-radius: 50%; background: var(--orange-pale); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; color: var(--orange); flex-shrink: 0; }
        .dash-res-info { flex: 1; min-width: 0; }
        .dash-res-name { font-size: 11px; font-weight: 500; color: var(--dark); }
        .dash-res-time { font-size: 9px; color: var(--muted); }
        .dash-res-badge { font-size: 9px; font-weight: 500; padding: 2px 6px; border-radius: 5px; flex-shrink: 0; }
        .badge-confirmed { background: #E8F8F1; color: #25C281; }
        .badge-pending { background: var(--orange-pale); color: var(--orange); }
        .badge-wa { background: #E8F8F1; color: #25D366; }
        .dash-notification { display: flex; align-items: center; gap: 8px; background: var(--orange-pale); border-radius: 8px; padding: 8px 10px; border: 1px solid rgba(255,92,53,0.15); margin-top: 8px; }
        .dash-notification-text { font-size: 10px; color: var(--dark); line-height: 1.4; }
        .dash-notification-text strong { font-weight: 600; }

        /* ─── PROBLEM ─── */
        .problem { padding: 60px 24px; max-width: 1100px; margin: 0 auto; }
        .problem-grid { display: flex; flex-direction: column; gap: 40px; margin-top: 40px; }
        .stress-card { background: #fff; border-radius: 16px; padding: 20px; border: 1.5px solid var(--border); box-shadow: 0 4px 20px rgba(26,26,46,0.05); }
        .stress-header { font-size: 13px; font-weight: 600; color: var(--dark); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .stress-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }
        .stress-item:last-child { border: none; padding-bottom: 0; }
        .stress-x { width: 18px; height: 18px; border-radius: 50%; background: #FEE8E8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .stress-text { font-size: 13px; color: var(--muted); line-height: 1.5; }
        .stress-text strong { color: var(--dark); font-weight: 500; display: block; margin-bottom: 1px; }
        .problem-content .section-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; color: var(--orange); margin-bottom: 10px; }
        .problem-content h2 { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.15; margin-bottom: 16px; }
        .problem-content p { color: var(--muted); font-size: 15px; line-height: 1.75; font-weight: 300; margin-bottom: 12px; }

        /* ─── FEATURES ─── */
        .features { padding: 0 24px 60px; max-width: 1100px; margin: 0 auto; }
        .section-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; color: var(--orange); margin-bottom: 10px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 12px; line-height: 1.15; }
        .section-sub { color: var(--muted); font-size: 15px; line-height: 1.7; font-weight: 300; margin-bottom: 32px; }
        .feat-big { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
        .feat-big-card { border-radius: 18px; overflow: hidden; position: relative; min-height: 300px; display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; }
        .feat-big-card.dark { background: var(--dark); }
        .feat-big-card.orange { background: var(--orange); }
        .feat-big-visual { position: absolute; top: 0; left: 0; right: 0; }
        .feat-big-content { position: relative; z-index: 2; }
        .feat-big-tag { display: inline-block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; padding: 3px 8px; border-radius: 5px; margin-bottom: 10px; }
        .dark .feat-big-tag { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
        .orange .feat-big-tag { background: rgba(255,255,255,0.2); color: #fff; }
        .feat-big-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; line-height: 1.2; margin-bottom: 8px; }
        .dark .feat-big-title { color: #fff; }
        .orange .feat-big-title { color: #fff; }
        .feat-big-desc { font-size: 13px; line-height: 1.6; font-weight: 300; }
        .dark .feat-big-desc { color: rgba(255,255,255,0.55); }
        .orange .feat-big-desc { color: rgba(255,255,255,0.8); }
        .phone-mini { background: rgba(255,255,255,0.06); border-radius: 8px; padding: 12px; margin: 16px 16px 0; border: 1px solid rgba(255,255,255,0.08); }
        .phone-mini-msg { font-size: 11px; padding: 7px 9px; border-radius: 7px 7px 7px 2px; background: rgba(255,255,255,0.12); margin-bottom: 5px; line-height: 1.4; color: rgba(255,255,255,0.8); max-width: 82%; }
        .phone-mini-reply { font-size: 11px; padding: 7px 9px; border-radius: 7px 7px 2px 7px; background: #25D366; margin-left: auto; line-height: 1.4; color: #fff; max-width: 82%; }
        .time-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; margin: 16px 16px 0; }
        .time-slot { background: rgba(255,255,255,0.15); border-radius: 5px; padding: 7px 3px; text-align: center; font-size: 9px; color: rgba(255,255,255,0.8); font-weight: 500; border: 1px solid rgba(255,255,255,0.1); }
        .time-slot.taken { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.25); text-decoration: line-through; }
        .time-slot.selected { background: rgba(255,255,255,0.95); color: var(--orange); border-color: transparent; font-weight: 600; }
        .feat-mini-row { display: flex; flex-direction: column; gap: 14px; }
        .feat-mini { background: #fff; border-radius: 14px; padding: 22px; border: 1.5px solid var(--border); transition: all .25s; }
        .feat-mini:hover { border-color: rgba(255,92,53,0.3); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,92,53,0.07); }
        .feat-mini-icon { width: 32px; height: 32px; margin-bottom: 12px; }
        .feat-mini-icon svg { width: 32px; height: 32px; }
        .feat-mini-title { font-size: 14px; font-weight: 600; color: var(--dark); margin-bottom: 6px; }
        .feat-mini-desc { font-size: 13px; color: var(--muted); line-height: 1.6; font-weight: 300; }

        /* ─── NUMBERS ─── */
        .numbers { background: var(--dark); padding: 60px 24px; }
        .numbers-inner { max-width: 1100px; margin: 0 auto; }
        .numbers-grid { display: flex; flex-direction: column; margin-top: 32px; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; }
        .number-item { padding: 32px 24px; border-bottom: 1px solid rgba(255,255,255,0.07); text-align: center; }
        .number-item:last-child { border-bottom: none; }
        .number-val { font-family: 'Playfair Display', serif; font-size: 44px; font-weight: 700; color: var(--orange); letter-spacing: -2px; margin-bottom: 8px; }
        .number-label { font-size: 14px; color: rgba(255,255,255,0.45); font-weight: 300; line-height: 1.5; }

        /* ─── WAITLIST ─── */
        .waitlist { padding: 60px 24px; max-width: 680px; margin: 0 auto; text-align: center; }
        .waitlist h2 { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; letter-spacing: -1px; line-height: 1.1; margin-bottom: 14px; }
        .waitlist h2 em { color: var(--orange); font-style: italic; }
        .waitlist p { color: var(--muted); font-size: 15px; line-height: 1.7; font-weight: 300; margin-bottom: 28px; }
        .waitlist-form { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
        .waitlist-input { width: 100%; padding: 13px 16px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 15px; font-family: inherit; background: #fff; color: var(--dark); outline: none; transition: border-color .2s; }
        .waitlist-input:focus { border-color: var(--orange); }
        .waitlist-input::placeholder { color: var(--muted); }
        .waitlist-btn { width: 100%; background: var(--orange); color: #fff; border: none; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .2s; }
        .waitlist-btn:hover { background: var(--orange-light); }
        .waitlist-note { font-size: 12px; color: var(--muted); }

        /* ─── FOOTER ─── */
        footer { padding: 24px; border-top: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
        .footer-logo { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; }
        .footer-logo span { color: var(--orange); }
        footer p { font-size: 12px; color: var(--muted); }

        /* ════════════════════════════════
           TABLET — 768px+
        ════════════════════════════════ */
        @media (min-width: 768px) {
          nav { padding: 18px 36px; }
          .nav-links { display: flex; }
          .nav-cta { padding: 10px 20px; font-size: 14px; }

          .hero { padding: 72px 36px 56px; }
          .hero h1 { font-size: 48px; letter-spacing: -1.5px; }
          .hero-sub { font-size: 16px; max-width: 520px; }
          .hero-actions { flex-direction: row; align-items: center; gap: 16px; }
          .btn-waitlist { width: auto; }
          .hero-note { text-align: left; }

          .problem { padding: 80px 36px; }
          .problem-grid { flex-direction: row; gap: 48px; align-items: center; margin-top: 48px; }
          .problem-grid > div { flex: 1; }
          .problem-content h2 { font-size: 34px; }

          .features { padding: 0 36px 80px; }
          .section-title { font-size: 34px; }
          .feat-big { flex-direction: row; gap: 20px; }
          .feat-big-card { flex: 1; min-height: 340px; }
          .feat-mini-row { flex-direction: row; gap: 16px; }
          .feat-mini { flex: 1; }

          .numbers { padding: 72px 36px; }
          .numbers-grid { flex-direction: row; }
          .number-item { flex: 1; border-bottom: none; border-right: 1px solid rgba(255,255,255,0.07); padding: 40px 32px; }
          .number-item:last-child { border-right: none; }
          .number-val { font-size: 48px; }

          .waitlist { padding: 80px 36px; }
          .waitlist h2 { font-size: 38px; }
          .waitlist-form { flex-direction: row; gap: 10px; }
          .waitlist-input { flex: 1; width: auto; }
          .waitlist-btn { width: auto; padding: 13px 24px; }

          footer { flex-direction: row; justify-content: space-between; padding: 24px 36px; }
        }

        /* ════════════════════════════════
           DESKTOP — 1024px+
        ════════════════════════════════ */
        @media (min-width: 1024px) {
          nav { padding: 20px 48px; }
          .nav-right { gap: 32px; }
          .nav-links { gap: 28px; }

          .hero { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; padding: 100px 48px 0; align-items: flex-end; }
          .hero h1 { font-size: 58px; letter-spacing: -2px; }
          .hero-sub { font-size: 17px; max-width: 460px; margin-bottom: 40px; }
          .hero-actions { margin-bottom: 48px; }
          .hero-visual { display: block; }

          .problem { padding: 100px 48px; }
          .problem-grid { gap: 80px; margin-top: 60px; }
          .problem-content h2 { font-size: 40px; }
          .problem-content p { font-size: 16px; }

          .features { padding: 0 48px 100px; }
          .section-title { font-size: 40px; }
          .section-sub { font-size: 16px; margin-bottom: 60px; }
          .feat-big-card { min-height: 360px; padding: 32px; }
          .feat-big-title { font-size: 24px; }
          .feat-big-desc { font-size: 14px; }
          .feat-mini { padding: 28px; }
          .feat-mini-icon { width: 36px; height: 36px; margin-bottom: 16px; }
          .feat-mini-icon svg { width: 36px; height: 36px; }
          .feat-mini-title { font-size: 15px; }

          .numbers { padding: 80px 48px; }
          .number-item { padding: 48px 40px; }
          .number-val { font-size: 52px; }

          .waitlist { padding: 100px 48px; }
          .waitlist h2 { font-size: 44px; }
          .waitlist p { font-size: 17px; margin-bottom: 40px; }

          footer { padding: 28px 48px; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <div className="logo">table<span>ly</span></div>
        <div className="nav-right">
          <ul className="nav-links">
            <li><a href="#features">Funktionen</a></li>
            <li><a href="#waitlist">Warteliste</a></li>
          </ul>
          <button className="nav-cta" onClick={() => document.getElementById('waitlist')?.scrollIntoView({behavior:'smooth'})}>
            Warteliste beitreten
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero-wrap">
        <div className="hero">
          <div>
            <div className="hero-badge">Demnächst in Österreich</div>
            <h1>Dein Restaurant.<br />Endlich auf <em>Autopilot.</em></h1>
            <p className="hero-sub">Kein Telefon mehr, das klingelt während der Stoßzeit. Keine verpassten Reservierungen. Keine No-Shows die dich Geld kosten. Tablely übernimmt alles – automatisch, rund um die Uhr.</p>
            <div className="hero-actions">
              <button className="btn-waitlist" onClick={() => document.getElementById('waitlist')?.scrollIntoView({behavior:'smooth'})}>
                Jetzt zur Warteliste →
              </button>
              <span className="hero-note">Sei unter den Ersten in Österreich</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="dashboard-mock">
              <div className="dash-topbar">
                <div className="dash-dot r"></div>
                <div className="dash-dot y"></div>
                <div className="dash-dot g"></div>
                <span className="dash-title">Tablely Dashboard – Heute</span>
              </div>
              <div className="dash-stats">
                <div className="dash-stat">
                  <div className="dash-stat-label">Reservierungen</div>
                  <div className="dash-stat-val">24</div>
                  <div className="dash-stat-sub">↑ +6 vs. gestern</div>
                </div>
                <div className="dash-stat">
                  <div className="dash-stat-label">No-Shows</div>
                  <div className="dash-stat-val">0</div>
                  <div className="dash-stat-sub" style={{color:'var(--orange)'}}>Alle erinnert ✓</div>
                </div>
                <div className="dash-stat">
                  <div className="dash-stat-label">WhatsApp</div>
                  <div className="dash-stat-val">11</div>
                  <div className="dash-stat-sub">Auto-beantwortet</div>
                </div>
              </div>
              <div className="dash-section-title">Nächste Reservierungen</div>
              <div className="dash-reservations">
                {[
                  {i:'MK', name:'Maria K.', time:'18:30 · 4 Pers.', badge:'badge-confirmed', label:'Bestätigt'},
                  {i:'TH', name:'Thomas H.', time:'19:00 · 2 Pers.', badge:'badge-wa', label:'via WhatsApp'},
                  {i:'SF', name:'Sarah F.', time:'19:30 · 6 Pers.', badge:'badge-pending', label:'Ausstehend'},
                ].map((r,i) => (
                  <div className="dash-res-row" key={i}>
                    <div className="dash-res-avatar">{r.i}</div>
                    <div className="dash-res-info">
                      <div className="dash-res-name">{r.name}</div>
                      <div className="dash-res-time">{r.time}</div>
                    </div>
                    <span className={`dash-res-badge ${r.badge}`}>{r.label}</span>
                  </div>
                ))}
              </div>
              <div className="dash-notification">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#25D366" strokeWidth="1.2"/><path d="M5 8l2 2 4-4" stroke="#25D366" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="dash-notification-text"><strong>Erinnerung gesendet:</strong> 8 Gäste für heute Abend automatisch erinnert</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROBLEM */}
      <section className="problem">
        <div className="problem-grid">
          <div>
            <div className="stress-card">
              <div className="stress-header">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#E24B4A" strokeWidth="1.2"/><path d="M8 4v5M8 11v1" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round"/></svg>
                So war es bisher
              </div>
              {[
                {t:'Telefon klingelt mitten in der Stoßzeit', d:'Du nimmst ab, verlierst den Faden — der Tisch wartet.'},
                {t:'No-Show um 20:00 Uhr', d:'Tisch für 4 bleibt leer. Umsatz verloren, nichts zu machen.'},
                {t:'WhatsApp-Chaos', d:'23 ungelesene Nachrichten. Wer hat wo gebucht?'},
                {t:'Doppelbuchungen', d:'Zwei Gäste, ein Tisch. Peinlich und vermeidbar.'},
              ].map((s,i) => (
                <div className="stress-item" key={i}>
                  <div className="stress-x">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </div>
                  <div className="stress-text"><strong>{s.t}</strong>{s.d}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="problem-content">
            <div className="section-label">Das Problem</div>
            <h2>Restaurants verlieren täglich Geld durch manuelle Prozesse.</h2>
            <p>Ein durchschnittlicher Restaurantbetreiber verbringt über 2 Stunden täglich mit Reservierungsanrufen, WhatsApp-Nachrichten und dem Erinnern von Gästen.</p>
            <p>Das ist Zeit, die du in dein Essen, dein Team und deine Gäste investieren könntest. Tablely nimmt dir genau das ab — vollautomatisch.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="section-label">Wie Tablely funktioniert</div>
        <div className="section-title">Drei Wege zu reservieren.<br />Ein Dashboard für alles.</div>
        <p className="section-sub">WhatsApp, Telefon oder online — deine Gäste wählen wie sie buchen. Tablely übernimmt den Rest vollautomatisch.</p>

        <div className="feat-big">
          <div className="feat-big-card dark">
            <div className="feat-big-visual">
              <div className="phone-mini">
                <div className="phone-mini-msg">Hallo! Tisch für 3 Personen am Freitag um 19:30 Uhr? 🙏</div>
                <div style={{height:'5px'}}/>
                <div className="phone-mini-reply">Perfekt! Tisch für 3 am Fr. 20.03. um 19:30 Uhr ist reserviert ✅ Wir freuen uns auf euch!</div>
                <div style={{height:'5px'}}/>
                <div className="phone-mini-msg" style={{fontSize:'10px', opacity:0.7}}>Automatisch eingetragen ins Dashboard ↗</div>
              </div>
            </div>
            <div className="feat-big-content">
              <div className="feat-big-tag">WhatsApp KI</div>
              <div className="feat-big-title">Gäste schreiben — KI antwortet &amp; bucht</div>
              <p className="feat-big-desc">Deine Gäste schreiben per WhatsApp. Die KI versteht Tisch, Personenzahl und Uhrzeit — antwortet in Sekunden und trägt die Reservierung automatisch ins Dashboard ein. Kein einziger Klick von dir.</p>
            </div>
          </div>

          <div className="feat-big-card orange">
            <div className="feat-big-visual">
              <div style={{margin:'20px 20px 0', background:'rgba(255,255,255,0.12)', borderRadius:'10px', padding:'14px', border:'1px solid rgba(255,255,255,0.15)'}}>
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
                  <div style={{width:'28px', height:'28px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z" stroke="white" strokeWidth="1.2"/><path d="M6 8a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" stroke="white" strokeWidth="1.2"/></svg>
                  </div>
                  <div style={{fontSize:'11px', color:'rgba(255,255,255,0.9)', fontWeight:500}}>KI Telefonassistent</div>
                  <div style={{marginLeft:'auto', width:'7px', height:'7px', borderRadius:'50%', background:'#4ade80'}}></div>
                </div>
                {[
                  {l:'Gast ruft an', r:'KI nimmt ab'},
                  {l:'Tisch, Zeit, Personen', r:'KI versteht alles'},
                  {l:'Reservierung', r:'Automatisch gespeichert'},
                  {l:'Komplex oder gewünscht', r:'Weiterleitung ans Team'},
                ].map((row,i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom: i<3 ? '1px solid rgba(255,255,255,0.1)' : 'none', fontSize:'10px'}}>
                    <span style={{color:'rgba(255,255,255,0.6)'}}>{row.l}</span>
                    <span style={{color:'rgba(255,255,255,0.95)', fontWeight:500}}>→ {row.r}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="feat-big-content">
              <div className="feat-big-tag">KI Telefon</div>
              <div className="feat-big-title">KI nimmt Anrufe entgegen — automatisch</div>
              <p className="feat-big-desc">Kein Anruf geht mehr verloren. Die KI nimmt ab, fragt nach Tisch, Uhrzeit und Personenzahl — und trägt alles direkt ein. Bei komplexen Anfragen oder auf Wunsch wird sofort ans Personal weitergeleitet.</p>
            </div>
          </div>
        </div>

        <div className="feat-mini-row">
          <div className="feat-mini">
            <div className="feat-mini-icon">
              <svg viewBox="0 0 36 36" fill="none"><rect x="5" y="8" width="26" height="22" rx="3" stroke="#FF5C35" strokeWidth="1.6"/><path d="M5 14h26" stroke="#FF5C35" strokeWidth="1.6"/><path d="M12 6v4M24 6v4" stroke="#FF5C35" strokeWidth="1.6" strokeLinecap="round"/><circle cx="12" cy="22" r="2" fill="#FF5C35"/><circle cx="18" cy="22" r="2" fill="#FF5C35"/><circle cx="24" cy="22" r="2" stroke="#FF5C35" strokeWidth="1.2"/></svg>
            </div>
            <div className="feat-mini-title">Online Reservierung</div>
            <p className="feat-mini-desc">Gäste wählen Tag, Uhrzeit und Personenzahl direkt auf deiner Website. Die Buchung erscheint sofort im Dashboard — ohne Anruf, ohne WhatsApp.</p>
          </div>
          <div className="feat-mini">
            <div className="feat-mini-icon">
              <svg viewBox="0 0 36 36" fill="none"><rect x="3" y="3" width="30" height="30" rx="4" stroke="#FF5C35" strokeWidth="1.6"/><path d="M3 13h30" stroke="#FF5C35" strokeWidth="1.6"/><path d="M9 8h2M15 8h2M21 8h2" stroke="#FF5C35" strokeWidth="1.4" strokeLinecap="round"/><rect x="8" y="18" width="8" height="6" rx="1.5" fill="#FF5C35" fillOpacity="0.2" stroke="#FF5C35" strokeWidth="1.2"/><rect x="20" y="18" width="8" height="6" rx="1.5" stroke="#FF5C35" strokeWidth="1.2" strokeDasharray="2 1"/></svg>
            </div>
            <div className="feat-mini-title">Alles im Dashboard</div>
            <p className="feat-mini-desc">Egal ob WhatsApp, Telefon oder Online — jede Reservierung landet automatisch im selben Dashboard. Tisch, Personenzahl, Uhrzeit, Kanal. Übersichtlich, live, vollständig.</p>
          </div>
          <div className="feat-mini">
            <div className="feat-mini-icon">
              <svg viewBox="0 0 36 36" fill="none"><path d="M18 4v4M18 4a10 10 0 0 1 10 10c0 5-2 7-2 7H10s-2-2-2-7A10 10 0 0 1 18 4Z" stroke="#FF5C35" strokeWidth="1.6" strokeLinejoin="round"/><path d="M13 25s0 5 5 5 5-5 5-5" stroke="#FF5C35" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </div>
            <div className="feat-mini-title">Automatische Erinnerungen</div>
            <p className="feat-mini-desc">Tablely erinnert jeden Gast 24h und 2h vor der Reservierung per WhatsApp oder SMS. No-Shows sinken auf nahezu null.</p>
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <div className="numbers">
        <div className="numbers-inner">
          <div className="section-label" style={{color:'var(--orange)'}}>Was Tablely bewirkt</div>
          <div className="section-title" style={{color:'#fff', marginBottom:'0'}}>Zahlen die sprechen.</div>
          <div className="numbers-grid">
            <div className="number-item">
              <div className="number-val">–60%</div>
              <div className="number-label">weniger No-Shows durch automatische Erinnerungen</div>
            </div>
            <div className="number-item">
              <div className="number-val">2h</div>
              <div className="number-label">täglich gespart — keine Reservierungsanrufe mehr</div>
            </div>
            <div className="number-item">
              <div className="number-val">24/7</div>
              <div className="number-label">Buchungen annehmen — auch wenn du schläfst</div>
            </div>
          </div>
        </div>
      </div>

      {/* WAITLIST */}
      <WaitlistSection />

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">table<span>ly</span></div>
        <p>© 2026 Tablely · Ein Produkt aus Österreich</p>
      </footer>
    </>
  );
}