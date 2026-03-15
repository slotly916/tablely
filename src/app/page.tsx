"use client";

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

        nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; position: sticky; top: 0; background: rgba(255,250,245,0.95); backdrop-filter: blur(16px); z-index: 100; border-bottom: 1px solid var(--border); }
        .logo { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: var(--dark); letter-spacing: -0.5px; }
        .logo span { color: var(--orange); }
        .nav-right { display: flex; align-items: center; gap: 32px; }
        .nav-links { display: flex; gap: 28px; list-style: none; }
        .nav-links a { text-decoration: none; color: var(--muted); font-size: 14px; font-weight: 400; transition: color .2s; }
        .nav-links a:hover { color: var(--dark); }
        .nav-cta { background: var(--dark); color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .2s; }
        .nav-cta:hover { background: var(--orange); }

        .hero-wrap { background: var(--dark); overflow: hidden; position: relative; }
        .hero-wrap::before { content: ''; position: absolute; top: -200px; right: -200px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(255,92,53,0.12) 0%, transparent 70%); pointer-events: none; }
        .hero { padding: 100px 48px 0; max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: flex-end; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,92,53,0.15); color: var(--orange); font-size: 12px; font-weight: 500; padding: 6px 14px; border-radius: 20px; margin-bottom: 28px; border: 1px solid rgba(255,92,53,0.25); }
        .hero-badge::before { content: ''; width: 6px; height: 6px; background: var(--orange); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .hero h1 { font-family: 'Playfair Display', serif; font-size: 58px; font-weight: 700; line-height: 1.08; letter-spacing: -2px; margin-bottom: 24px; color: #fff; }
        .hero h1 em { color: var(--orange); font-style: italic; }
        .hero-sub { color: rgba(255,255,255,0.55); font-size: 17px; line-height: 1.75; margin-bottom: 40px; font-weight: 300; max-width: 460px; }
        .hero-actions { display: flex; align-items: center; gap: 16px; margin-bottom: 48px; flex-wrap: wrap; }
        .btn-waitlist { background: var(--orange); color: #fff; border: none; padding: 16px 32px; border-radius: 10px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .25s; }
        .btn-waitlist:hover { background: var(--orange-light); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(255,92,53,0.4); }
        .hero-note { font-size: 13px; color: rgba(255,255,255,0.35); }

        .hero-visual { position: relative; }
        .dashboard-mock { background: #fff; border-radius: 16px 16px 0 0; padding: 20px; box-shadow: 0 -8px 60px rgba(0,0,0,0.4); }
        .dash-topbar { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; }
        .dash-dot { width: 10px; height: 10px; border-radius: 50%; }
        .dash-dot.r { background: #FF5F57; }
        .dash-dot.y { background: #FEBC2E; }
        .dash-dot.g { background: #28C840; }
        .dash-title { margin-left: 8px; font-size: 12px; font-weight: 500; color: var(--muted); }
        .dash-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
        .dash-stat { background: var(--cream); border-radius: 10px; padding: 12px 14px; border: 1px solid var(--border); }
        .dash-stat-label { font-size: 10px; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .dash-stat-val { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: var(--dark); }
        .dash-stat-sub { font-size: 10px; color: #25C281; font-weight: 500; }
        .dash-section-title { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
        .dash-reservations { display: flex; flex-direction: column; gap: 8px; }
        .dash-res-row { display: flex; align-items: center; gap: 10px; background: var(--cream); border-radius: 8px; padding: 10px 12px; border: 1px solid var(--border); }
        .dash-res-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--orange-pale); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: var(--orange); flex-shrink: 0; }
        .dash-res-info { flex: 1; min-width: 0; }
        .dash-res-name { font-size: 12px; font-weight: 500; color: var(--dark); }
        .dash-res-time { font-size: 10px; color: var(--muted); }
        .dash-res-badge { font-size: 10px; font-weight: 500; padding: 3px 8px; border-radius: 6px; flex-shrink: 0; }
        .badge-confirmed { background: #E8F8F1; color: #25C281; }
        .badge-pending { background: var(--orange-pale); color: var(--orange); }
        .badge-wa { background: #E8F8F1; color: #25D366; }
        .dash-notification { display: flex; align-items: center; gap: 10px; background: var(--orange-pale); border-radius: 8px; padding: 10px 12px; border: 1px solid rgba(255,92,53,0.15); margin-top: 10px; }
        .dash-notification-text { font-size: 11px; color: var(--dark); line-height: 1.4; }
        .dash-notification-text strong { font-weight: 600; }

        .problem { padding: 100px 48px; max-width: 1100px; margin: 0 auto; }
        .problem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; margin-top: 60px; }
        .stress-card { background: #fff; border-radius: 16px; padding: 24px; border: 1.5px solid var(--border); box-shadow: 0 8px 32px rgba(26,26,46,0.06); }
        .stress-header { font-size: 13px; font-weight: 600; color: var(--dark); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .stress-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .stress-item:last-child { border: none; padding-bottom: 0; }
        .stress-x { width: 20px; height: 20px; border-radius: 50%; background: #FEE8E8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .stress-text { font-size: 13px; color: var(--muted); line-height: 1.5; }
        .stress-text strong { color: var(--dark); font-weight: 500; display: block; margin-bottom: 2px; }
        .problem-content .section-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; color: var(--orange); margin-bottom: 12px; }
        .problem-content h2 { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 700; letter-spacing: -1px; line-height: 1.15; margin-bottom: 20px; }
        .problem-content p { color: var(--muted); font-size: 16px; line-height: 1.8; font-weight: 300; margin-bottom: 16px; }

        .features { padding: 0 48px 100px; max-width: 1100px; margin: 0 auto; }
        .section-label { font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; color: var(--orange); margin-bottom: 12px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 700; letter-spacing: -1px; margin-bottom: 16px; line-height: 1.15; }
        .section-sub { color: var(--muted); font-size: 16px; line-height: 1.75; max-width: 500px; font-weight: 300; margin-bottom: 60px; }

        .feat-big { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .feat-big-card { border-radius: 20px; overflow: hidden; position: relative; min-height: 360px; display: flex; flex-direction: column; justify-content: flex-end; padding: 32px; }
        .feat-big-card.dark { background: var(--dark); }
        .feat-big-card.orange { background: var(--orange); }
        .feat-big-visual { position: absolute; top: 0; left: 0; right: 0; padding: 0; }
        .feat-big-content { position: relative; z-index: 2; }
        .feat-big-tag { display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px; }
        .dark .feat-big-tag { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
        .orange .feat-big-tag { background: rgba(255,255,255,0.2); color: #fff; }
        .feat-big-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 10px; }
        .dark .feat-big-title { color: #fff; }
        .orange .feat-big-title { color: #fff; }
        .feat-big-desc { font-size: 14px; line-height: 1.65; font-weight: 300; }
        .dark .feat-big-desc { color: rgba(255,255,255,0.55); }
        .orange .feat-big-desc { color: rgba(255,255,255,0.8); }

        .phone-mini { background: rgba(255,255,255,0.06); border-radius: 10px; padding: 14px; margin: 20px 20px 0; border: 1px solid rgba(255,255,255,0.08); }
        .phone-mini-msg { font-size: 11px; padding: 8px 10px; border-radius: 8px 8px 8px 2px; background: rgba(255,255,255,0.12); margin-bottom: 6px; line-height: 1.4; color: rgba(255,255,255,0.8); max-width: 80%; }
        .phone-mini-reply { font-size: 11px; padding: 8px 10px; border-radius: 8px 8px 2px 8px; background: #25D366; margin-left: auto; line-height: 1.4; color: #fff; max-width: 80%; }
        .time-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin: 20px 20px 0; }
        .time-slot { background: rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 4px; text-align: center; font-size: 10px; color: rgba(255,255,255,0.8); font-weight: 500; border: 1px solid rgba(255,255,255,0.1); }
        .time-slot.taken { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); text-decoration: line-through; }
        .time-slot.selected { background: rgba(255,255,255,0.95); color: var(--orange); border-color: transparent; font-weight: 600; }

        .feat-mini-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .feat-mini { background: #fff; border-radius: 16px; padding: 28px; border: 1.5px solid var(--border); transition: all .25s; }
        .feat-mini:hover { border-color: rgba(255,92,53,0.3); transform: translateY(-3px); box-shadow: 0 12px 32px rgba(255,92,53,0.07); }
        .feat-mini-icon { width: 36px; height: 36px; margin-bottom: 16px; }
        .feat-mini-icon svg { width: 36px; height: 36px; }
        .feat-mini-title { font-size: 15px; font-weight: 600; color: var(--dark); margin-bottom: 8px; letter-spacing: -0.2px; }
        .feat-mini-desc { font-size: 13px; color: var(--muted); line-height: 1.6; font-weight: 300; }

        .numbers { background: var(--dark); padding: 80px 48px; }
        .numbers-inner { max-width: 1100px; margin: 0 auto; }
        .numbers-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 0; margin-top: 48px; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; }
        .number-item { padding: 48px 40px; border-right: 1px solid rgba(255,255,255,0.07); text-align: center; }
        .number-item:last-child { border-right: none; }
        .number-val { font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 700; color: var(--orange); letter-spacing: -2px; margin-bottom: 10px; }
        .number-label { font-size: 14px; color: rgba(255,255,255,0.45); font-weight: 300; line-height: 1.6; }

        .waitlist { padding: 100px 48px; max-width: 680px; margin: 0 auto; text-align: center; }
        .waitlist h2 { font-family: 'Playfair Display', serif; font-size: 44px; font-weight: 700; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 16px; }
        .waitlist h2 em { color: var(--orange); font-style: italic; }
        .waitlist p { color: var(--muted); font-size: 17px; line-height: 1.75; font-weight: 300; margin-bottom: 40px; }
        .waitlist-form { display: flex; gap: 10px; max-width: 480px; margin: 0 auto 16px; }
        .waitlist-input { flex: 1; padding: 14px 18px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 15px; font-family: inherit; background: #fff; color: var(--dark); outline: none; transition: border-color .2s; }
        .waitlist-input:focus { border-color: var(--orange); }
        .waitlist-input::placeholder { color: var(--muted); }
        .waitlist-btn { background: var(--orange); color: #fff; border: none; padding: 14px 24px; border-radius: 10px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .2s; white-space: nowrap; }
        .waitlist-btn:hover { background: var(--orange-light); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,92,53,0.3); }
        .waitlist-note { font-size: 13px; color: var(--muted); }

        footer { padding: 28px 48px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .footer-logo { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; }
        .footer-logo span { color: var(--orange); }
        footer p { font-size: 13px; color: var(--muted); }
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#25D366" strokeWidth="1.2"/><path d="M5 8l2 2 4-4" stroke="#25D366" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#E24B4A" strokeWidth="1.2"/><path d="M8 4v5M8 11v1" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round"/></svg>
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
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round"/></svg>
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
        <div className="section-label">Was Tablely kann</div>
        <div className="section-title">Alles was du brauchst.<br />Nichts was du nicht brauchst.</div>
        <p className="section-sub">Drei Kernprobleme. Gelöst. Automatisch.</p>

        <div className="feat-big">
          <div className="feat-big-card dark">
            <div className="feat-big-visual">
              <div className="phone-mini">
                <div className="phone-mini-msg">Hallo, Tisch für 2 morgen um 19 Uhr möglich? 🙏</div>
                <div style={{height:'6px'}}/>
                <div className="phone-mini-reply">Natürlich! Tisch für 2 am 16.03. um 19:00 Uhr ist reserviert ✅</div>
              </div>
            </div>
            <div className="feat-big-content">
              <div className="feat-big-tag">WhatsApp</div>
              <div className="feat-big-title">Reservierungen per WhatsApp — vollautomatisch</div>
              <p className="feat-big-desc">Deine Gäste schreiben wie gewohnt. Tablely antwortet in Sekunden, bestätigt die Buchung und trägt alles ein. Ohne dass du einmal ans Handy gehst.</p>
            </div>
          </div>
          <div className="feat-big-card orange">
            <div className="feat-big-visual">
              <div className="time-grid">
                {['17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30'].map((t,i) => (
                  <div key={i} className={`time-slot${i===1||i===3||i===6?' taken':i===4?' selected':''}`}>{t}</div>
                ))}
              </div>
            </div>
            <div className="feat-big-content">
              <div className="feat-big-tag">Online Buchung</div>
              <div className="feat-big-title">Online buchen — rund um die Uhr</div>
              <p className="feat-big-desc">Gäste buchen direkt über deine Website oder Google. Kein Anruf nötig. Dein Tischplan füllt sich automatisch — auch nachts um 2 Uhr.</p>
            </div>
          </div>
        </div>

        <div className="feat-mini-row">
          {[
            {
              icon: <svg viewBox="0 0 36 36" fill="none"><path d="M18 4v4M18 4a10 10 0 0 1 10 10c0 5-2 7-2 7H10s-2-2-2-7A10 10 0 0 1 18 4Z" stroke="#FF5C35" strokeWidth="1.6" strokeLinejoin="round"/><path d="M13 25s0 5 5 5 5-5 5-5" stroke="#FF5C35" strokeWidth="1.6" strokeLinecap="round"/></svg>,
              title: 'Automatische Erinnerungen',
              desc: 'Tablely erinnert jeden Gast 24h und 2h vor der Reservierung. No-Shows sinken auf nahezu null.'
            },
            {
              icon: <svg viewBox="0 0 36 36" fill="none"><rect x="5" y="5" width="26" height="26" rx="3" stroke="#FF5C35" strokeWidth="1.6"/><path d="M11 26v-6M17 26v-10M23 26v-7M29 26v-13" stroke="#FF5C35" strokeWidth="1.6" strokeLinecap="round"/></svg>,
              title: 'Echtzeit-Dashboard',
              desc: 'Alle Reservierungen, Auslastung und Statistiken auf einen Blick. Kein Chaos, keine Zettelwirtschaft mehr.'
            },
            {
              icon: <svg viewBox="0 0 36 36" fill="none"><rect x="5" y="8" width="26" height="22" rx="3" stroke="#FF5C35" strokeWidth="1.6"/><path d="M5 14h26" stroke="#FF5C35" strokeWidth="1.6"/><path d="M12 6v4M24 6v4" stroke="#FF5C35" strokeWidth="1.6" strokeLinecap="round"/><path d="M10 20h5M10 25h8M21 20h5" stroke="#FF5C35" strokeWidth="1.6" strokeLinecap="round"/></svg>,
              title: 'Tischplan-Verwaltung',
              desc: 'Definiere deine Tische einmalig. Tablely weist Reservierungen automatisch zu — keine Doppelbuchungen.'
            },
          ].map((f,i) => (
            <div className="feat-mini" key={i}>
              <div className="feat-mini-icon">{f.icon}</div>
              <div className="feat-mini-title">{f.title}</div>
              <p className="feat-mini-desc">{f.desc}</p>
            </div>
          ))}
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
      <section className="waitlist" id="waitlist">
        <div className="section-label" style={{textAlign:'center'}}>Warteliste</div>
        <h2>Sei unter den <em>Ersten</em><br />in Österreich.</h2>
        <p>Tablely ist bald verfügbar. Trag dich jetzt ein und erhalte exklusiven Frühzugang — inklusive persönlicher Einrichtung durch unser Team.</p>
        <div className="waitlist-form">
          <input className="waitlist-input" type="email" placeholder="deine@email.at" />
          <button className="waitlist-btn">Jetzt eintragen</button>
        </div>
        <p className="waitlist-note">Kein Spam. Nur eine E-Mail wenn Tablely live geht.</p>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">table<span>ly</span></div>
        <p>© 2026 Tablely · Ein Produkt aus Österreich</p>
      </footer>
    </>
  );
}