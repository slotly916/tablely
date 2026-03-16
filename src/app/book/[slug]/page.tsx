"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

type Restaurant = {
  id: string;
  name: string;
  address: string;
  phone: string;
  slug: string;
};

type Table = {
  id: string;
  name: string;
  capacity: number;
};

type OpeningHour = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
};

const STEPS = ["Datum & Zeit", "Deine Daten", "Bestätigung"];


function CustomCalendar({ value, onChange, minDate, isAvailable }: {
  value: string;
  onChange: (date: string) => void;
  minDate: string;
  isAvailable: (dateStr: string) => boolean;
}) {
  const today = new Date(minDate);
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());

  const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  const DAYS_SHORT = ["Mo","Di","Mi","Do","Fr","Sa","So"];

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }

  function formatDate(year: number, month: number, day: number) {
    return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{background:"#fff",border:"1.5px solid #F0EBE3",borderRadius:"14px",padding:"16px",userSelect:"none"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <button onClick={prevMonth} style={{width:"32px",height:"32px",borderRadius:"8px",border:"1.5px solid #F0EBE3",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#6B6B80"}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span style={{fontSize:"15px",fontWeight:600,color:"#1A1A2E"}}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{width:"32px",height:"32px",borderRadius:"8px",border:"1.5px solid #F0EBE3",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#6B6B80"}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px",marginBottom:"8px"}}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{textAlign:"center",fontSize:"11px",fontWeight:600,color:"#6B6B80",padding:"4px 0"}}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px"}}>
        {cells.map((day, i) => {
          if (!day) return <div key={i}/>;
          const dateStr = formatDate(viewYear, viewMonth, day);
          const isPast = dateStr < minDate;
          const isSelected = dateStr === value;
          const available = !isPast && isAvailable(dateStr);
          const isToday = dateStr === minDate;

          return (
            <button key={i} onClick={() => !isPast && available && onChange(dateStr)} style={{
              width:"100%",padding:"7px 0",borderRadius:"7px",fontSize:"12px",fontWeight:isSelected?600:400,
              cursor: isPast || !available ? "not-allowed" : "pointer",
              border: isToday && !isSelected ? "1.5px solid #FF5C35" : "1.5px solid transparent",
              background: isSelected ? "#FF5C35" : "transparent",
              color: isSelected ? "#fff" : isPast ? "#D0CCC8" : !available ? "#D0CCC8" : "#1A1A2E",
              opacity: isPast ? 0.4 : 1,
              transition:"all 0.15s",
              textAlign:"center",
            }}>
              {day}
            </button>
          );
        })}
      </div>

      {value && (
        <div style={{marginTop:"12px",paddingTop:"12px",borderTop:"1px solid #F0EBE3",fontSize:"13px",color:"#6B6B80",textAlign:"center"}}>
          Gewählt: <strong style={{color:"#1A1A2E"}}>{new Date(value).toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long"})}</strong>
        </div>
      )}
    </div>
  );
}

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Booking data
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { loadRestaurant(); }, []);

  async function loadRestaurant() {
    const supabase = createClient();
    const { data: rest } = await supabase
      .from("restaurants").select("*").eq("slug", slug).single();

    if (!rest) { setNotFound(true); setLoading(false); return; }
    setRestaurant(rest);

    const { data: tbls } = await supabase
      .from("tables").select("*").eq("restaurant_id", rest.id);
    setTables(tbls || []);

    const { data: hrs } = await supabase
      .from("opening_hours").select("*").eq("restaurant_id", rest.id);
    setHours(hrs || []);

    setLoading(false);
  }

  function getAvailableTimes() {
    if (!date) return [];
    const dayOfWeek = (new Date(date).getDay() + 6) % 7; // 0=Mon
    const hour = hours.find(h => h.day_of_week === dayOfWeek);
    if (!hour || hour.is_closed) return [];

    const times: string[] = [];
    const [openH, openM] = hour.open_time.split(":").map(Number);
    const [closeH, closeM] = hour.close_time.split(":").map(Number);
    let current = openH * 60 + openM;
    const end = closeH * 60 + closeM - 60;

    while (current <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, "0");
      const m = (current % 60).toString().padStart(2, "0");
      times.push(`${h}:${m}`);
      current += 30;
    }
    return times;
  }

  function isDateAvailable(dateStr: string) {
    const dayOfWeek = (new Date(dateStr).getDay() + 6) % 7;
    const hour = hours.find(h => h.day_of_week === dayOfWeek);
    return hour && !hour.is_closed;
  }

  async function handleSubmit() {
    if (!guestName) { setError("Bitte Namen eingeben."); return; }
    setSubmitting(true);
    setError("");

    const supabase = createClient();

    // Find best table
    const suitable = tables
      .filter(t => t.capacity >= parseInt(partySize))
      .sort((a, b) => a.capacity - b.capacity);

    const { error: err } = await supabase.from("reservations").insert([{
      restaurant_id: restaurant!.id,
      table_id: suitable[0]?.id || null,
      guest_name: guestName,
      guest_phone: guestPhone || null,
      guest_email: guestEmail || null,
      party_size: parseInt(partySize),
      date,
      time,
      channel: "online",
      notes: notes || null,
      status: "confirmed",
    }]);

    if (err) { setError("Fehler beim Speichern. Bitte nochmal versuchen."); setSubmitting(false); return; }
    setSuccess(true);
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const availableTimes = getAvailableTimes();

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FFFAF5",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{width:"24px",height:"24px",borderRadius:"50%",border:"2px solid #F0EBE3",borderTopColor:"#FF5C35",animation:"spin 0.7s linear infinite"}}/>
    </div>
  );

  if (notFound) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FFFAF5",fontFamily:"'DM Sans',sans-serif",flexDirection:"column",gap:"16px",textAlign:"center",padding:"24px"}}>
      <div style={{fontFamily:"Georgia,serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E"}}>Restaurant nicht gefunden</div>
      <div style={{fontSize:"15px",color:"#6B6B80"}}>Dieser Buchungslink ist nicht gültig.</div>
      <a href="/" style={{color:"#FF5C35",fontSize:"14px",textDecoration:"none",fontWeight:500}}>← tablely.at</a>
    </div>
  );

  if (success) return (
    <div style={{minHeight:"100vh",background:"#FFFAF5",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      <div style={{maxWidth:"480px",width:"100%",textAlign:"center"}}>
        <div style={{width:"72px",height:"72px",borderRadius:"50%",background:"#E8F8F1",border:"2px solid #25C281",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px"}}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14l6 6L23 8" stroke="#25C281" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 style={{fontFamily:"Georgia,serif",fontSize:"32px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1px",marginBottom:"12px"}}>Reservierung bestätigt!</h1>
        <p style={{fontSize:"16px",color:"#6B6B80",lineHeight:1.7,marginBottom:"32px",fontWeight:300}}>
          Vielen Dank, <strong style={{color:"#1A1A2E"}}>{guestName}</strong>. Deine Reservierung bei <strong style={{color:"#1A1A2E"}}>{restaurant?.name}</strong> am <strong style={{color:"#1A1A2E"}}>{new Date(date).toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long"})}</strong> um <strong style={{color:"#1A1A2E"}}>{time} Uhr</strong> für <strong style={{color:"#1A1A2E"}}>{partySize} {parseInt(partySize)===1?"Person":"Personen"}</strong> ist bestätigt.
        </p>
        <div style={{background:"#FFF0EB",border:"1px solid rgba(255,92,53,0.15)",borderRadius:"14px",padding:"20px",marginBottom:"24px",textAlign:"left"}}>
          <div style={{fontSize:"11px",fontWeight:600,color:"#FF5C35",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:"12px"}}>Reservierungsdetails</div>
          {[
            {l:"Restaurant", v:restaurant?.name||""},
            {l:"Datum", v:new Date(date).toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})},
            {l:"Uhrzeit", v:`${time} Uhr`},
            {l:"Personen", v:`${partySize} ${parseInt(partySize)===1?"Person":"Personen"}`},
          ].map((r,i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<3?"1px solid rgba(255,92,53,0.1)":"none",fontSize:"14px"}}>
              <span style={{color:"#6B6B80"}}>{r.l}</span>
              <span style={{fontWeight:500,color:"#1A1A2E"}}>{r.v}</span>
            </div>
          ))}
        </div>
        {restaurant?.phone && (
          <p style={{fontSize:"13px",color:"#6B6B80"}}>Bei Fragen erreichst du uns unter <strong style={{color:"#1A1A2E"}}>{restaurant.phone}</strong></p>
        )}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#FFFAF5",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: #FF5C35 !important; outline: none; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
        select { appearance: none; -webkit-appearance: none; }
        .time-slot:hover { background: #FFF0EB !important; border-color: rgba(255,92,53,0.3) !important; color: #FF5C35 !important; }
        .time-slot.selected { background: #FF5C35 !important; border-color: #FF5C35 !important; color: #fff !important; }
        .next-btn:hover { background: #FF7A5A !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,92,53,0.3) !important; }
      `}</style>

      {/* HEADER */}
      <header style={{borderBottom:"1px solid #F0EBE3",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#fff"}}>
        <div>
          <div style={{fontFamily:"Georgia,serif",fontSize:"18px",fontWeight:700,color:"#1A1A2E"}}>{restaurant?.name}</div>
          {restaurant?.address && <div style={{fontSize:"12px",color:"#6B6B80",marginTop:"2px"}}>{restaurant.address}</div>}
        </div>
        <a href="/" style={{fontFamily:"Georgia,serif",fontSize:"14px",color:"#6B6B80",textDecoration:"none"}}>
          powered by <span style={{color:"#FF5C35"}}>tablely</span>
        </a>
      </header>

      <div style={{maxWidth:"560px",margin:"0 auto",padding:"40px 24px"}}>

        {/* PROGRESS */}
        <div style={{display:"flex",gap:"8px",marginBottom:"40px"}}>
          {STEPS.map((s,i) => (
            <div key={i} style={{flex:1}}>
              <div style={{height:"3px",borderRadius:"2px",background:i<=step?"#FF5C35":"#F0EBE3",transition:"background 0.3s",marginBottom:"8px"}}/>
              <div style={{fontSize:"11px",fontWeight:i===step?600:400,color:i===step?"#FF5C35":i<step?"#1A1A2E":"#6B6B80"}}>{s}</div>
            </div>
          ))}
        </div>

        {/* STEP 1 — Datum & Zeit */}
        {step === 0 && (
          <div>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:"26px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-0.5px",marginBottom:"6px"}}>Wann möchtest du kommen?</h2>
            <p style={{fontSize:"14px",color:"#6B6B80",marginBottom:"28px",fontWeight:300}}>Wähle Datum, Uhrzeit und Personenzahl.</p>

            <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
              {/* Datum — Custom Calendar */}
              <div>
                <label style={{fontSize:"12px",fontWeight:500,color:"#6B6B80",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"8px"}}>Datum</label>
                <CustomCalendar
                  value={date}
                  onChange={(d) => { setDate(d); setTime(""); }}
                  minDate={todayStr}
                  isAvailable={isDateAvailable}
                />
                {date && !isDateAvailable(date) && (
                  <p style={{fontSize:"13px",color:"#E24B4A",marginTop:"6px"}}>An diesem Tag ist das Restaurant geschlossen.</p>
                )}
              </div>

              {/* Personenzahl */}
              <div>
                <label style={{fontSize:"12px",fontWeight:500,color:"#6B6B80",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"8px"}}>Personenzahl</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px"}}>
                  {[1,2,3,4,5,6,7,8,9,10,12,15,20,25,30].map(n => (
                    <button key={n} onClick={() => setPartySize(String(n))} style={{
                      padding:"10px 4px",borderRadius:"10px",fontSize:"14px",fontWeight:500,
                      cursor:"pointer",fontFamily:"inherit",border:"1.5px solid",transition:"all 0.15s",textAlign:"center",
                      background: partySize===String(n) ? "#FF5C35" : "#fff",
                      color: partySize===String(n) ? "#fff" : "#1A1A2E",
                      borderColor: partySize===String(n) ? "#FF5C35" : "#F0EBE3",
                    }}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Uhrzeit */}
              {date && isDateAvailable(date) && (
                <div>
                  <label style={{fontSize:"12px",fontWeight:500,color:"#6B6B80",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"8px"}}>Uhrzeit</label>
                  {availableTimes.length === 0 ? (
                    <p style={{fontSize:"14px",color:"#6B6B80"}}>Keine verfügbaren Zeiten.</p>
                  ) : (
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px"}}>
                      {availableTimes.map(t => (
                        <button key={t} className={`time-slot${time===t?" selected":""}`} onClick={() => setTime(t)} style={{
                          padding:"10px",borderRadius:"8px",fontSize:"14px",fontWeight:500,
                          cursor:"pointer",fontFamily:"inherit",border:"1.5px solid #F0EBE3",
                          background:"#fff",color:"#1A1A2E",transition:"all 0.15s",
                        }}>{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="next-btn"
              onClick={() => {
                if (!date) { setError("Bitte Datum wählen."); return; }
                if (!isDateAvailable(date)) { setError("Restaurant an diesem Tag geschlossen."); return; }
                if (!time) { setError("Bitte Uhrzeit wählen."); return; }
                setError(""); setStep(1);
              }}
              style={{width:"100%",marginTop:"32px",padding:"14px",background:"#FF5C35",color:"#fff",border:"none",borderRadius:"10px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}
            >
              Weiter →
            </button>
            {error && <p style={{color:"#E24B4A",fontSize:"13px",marginTop:"10px",textAlign:"center"}}>{error}</p>}
          </div>
        )}

        {/* STEP 2 — Deine Daten */}
        {step === 1 && (
          <div>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:"26px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-0.5px",marginBottom:"6px"}}>Deine Kontaktdaten</h2>
            <p style={{fontSize:"14px",color:"#6B6B80",marginBottom:"28px",fontWeight:300}}>Damit wir deine Reservierung bestätigen können.</p>

            <div style={{background:"#FFF0EB",border:"1px solid rgba(255,92,53,0.15)",borderRadius:"12px",padding:"14px 16px",marginBottom:"24px",display:"flex",gap:"16px",flexWrap:"wrap"}}>
              <div style={{fontSize:"13px",color:"#1A1A2E"}}><span style={{color:"#6B6B80"}}>Datum: </span><strong>{new Date(date).toLocaleDateString("de-AT",{weekday:"short",day:"numeric",month:"short"})}</strong></div>
              <div style={{fontSize:"13px",color:"#1A1A2E"}}><span style={{color:"#6B6B80"}}>Uhrzeit: </span><strong>{time} Uhr</strong></div>
              <div style={{fontSize:"13px",color:"#1A1A2E"}}><span style={{color:"#6B6B80"}}>Personen: </span><strong>{partySize}</strong></div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              <div>
                <label style={{fontSize:"12px",fontWeight:500,color:"#6B6B80",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"6px"}}>Name *</label>
                <input style={{width:"100%",padding:"12px 14px",border:"1.5px solid #F0EBE3",borderRadius:"10px",fontSize:"15px",fontFamily:"inherit",color:"#1A1A2E",background:"#fff"}} type="text" placeholder="Maria Muster" value={guestName} onChange={e => setGuestName(e.target.value)} />
              </div>
              <div>
                <label style={{fontSize:"12px",fontWeight:500,color:"#6B6B80",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"6px"}}>Telefon</label>
                <input style={{width:"100%",padding:"12px 14px",border:"1.5px solid #F0EBE3",borderRadius:"10px",fontSize:"15px",fontFamily:"inherit",color:"#1A1A2E",background:"#fff"}} type="tel" placeholder="+43 660 123456" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
              </div>
              <div>
                <label style={{fontSize:"12px",fontWeight:500,color:"#6B6B80",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"6px"}}>E-Mail</label>
                <input style={{width:"100%",padding:"12px 14px",border:"1.5px solid #F0EBE3",borderRadius:"10px",fontSize:"15px",fontFamily:"inherit",color:"#1A1A2E",background:"#fff"}} type="email" placeholder="maria@email.at" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
              </div>
              <div>
                <label style={{fontSize:"12px",fontWeight:500,color:"#6B6B80",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"6px"}}>Sonderwünsche</label>
                <textarea style={{width:"100%",padding:"12px 14px",border:"1.5px solid #F0EBE3",borderRadius:"10px",fontSize:"15px",fontFamily:"inherit",color:"#1A1A2E",background:"#fff",minHeight:"80px",resize:"vertical",lineHeight:"1.5"}} placeholder="Allergien, Anlass, Sitzplatzwunsch..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            {error && <p style={{color:"#E24B4A",fontSize:"13px",marginTop:"10px"}}>{error}</p>}

            <div style={{display:"flex",gap:"10px",marginTop:"28px"}}>
              <button onClick={() => setStep(0)} style={{flex:1,padding:"13px",borderRadius:"10px",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:"transparent",border:"1.5px solid #F0EBE3",color:"#6B6B80",transition:"all 0.2s"}}>← Zurück</button>
              <button className="next-btn" onClick={() => { if(!guestName){setError("Bitte Namen eingeben.");return;} setError("");setStep(2); }} style={{flex:2,padding:"13px",background:"#FF5C35",color:"#fff",border:"none",borderRadius:"10px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>Weiter →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — Bestätigung */}
        {step === 2 && (
          <div>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:"26px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-0.5px",marginBottom:"6px"}}>Alles korrekt?</h2>
            <p style={{fontSize:"14px",color:"#6B6B80",marginBottom:"28px",fontWeight:300}}>Überprüfe deine Angaben und bestätige die Reservierung.</p>

            <div style={{background:"#fff",border:"1.5px solid #F0EBE3",borderRadius:"14px",padding:"20px",marginBottom:"24px"}}>
              {[
                {l:"Restaurant", v:restaurant?.name||""},
                {l:"Datum", v:new Date(date).toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})},
                {l:"Uhrzeit", v:`${time} Uhr`},
                {l:"Personen", v:`${partySize} ${parseInt(partySize)===1?"Person":"Personen"}`},
                {l:"Name", v:guestName},
                ...(guestPhone ? [{l:"Telefon", v:guestPhone}] : []),
                ...(guestEmail ? [{l:"E-Mail", v:guestEmail}] : []),
                ...(notes ? [{l:"Notizen", v:notes}] : []),
              ].map((r,i,arr) => (
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #F0EBE3":"none",fontSize:"14px",gap:"16px"}}>
                  <span style={{color:"#6B6B80",flexShrink:0}}>{r.l}</span>
                  <span style={{fontWeight:500,color:"#1A1A2E",textAlign:"right"}}>{r.v}</span>
                </div>
              ))}
            </div>

            {error && (
              <div style={{background:"#FEE8E8",border:"1px solid rgba(226,75,74,0.2)",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",color:"#E24B4A",marginBottom:"16px"}}>
                {error}
              </div>
            )}

            <div style={{display:"flex",gap:"10px"}}>
              <button onClick={() => setStep(1)} style={{flex:1,padding:"13px",borderRadius:"10px",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:"transparent",border:"1.5px solid #F0EBE3",color:"#6B6B80"}}>← Zurück</button>
              <button className="next-btn" onClick={handleSubmit} disabled={submitting} style={{flex:2,padding:"13px",background:"#FF5C35",color:"#fff",border:"none",borderRadius:"10px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:submitting?0.7:1,transition:"all 0.2s"}}>
                {submitting ? "Wird gesendet..." : "Reservierung bestätigen →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}