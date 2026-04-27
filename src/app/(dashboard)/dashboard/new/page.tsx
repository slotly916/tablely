"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Table = {
  id: string;
  name: string;
  capacity: number;
};

export default function NewReservation() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const dark = false;

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("19:00");
  const [tableId, setTableId] = useState("");
  const [channel, setChannel] = useState("online");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const bg = dark ? "#0F0F14" : "#F5F0EB";
  const surface = dark ? "rgba(255,255,255,0.04)" : "#fff";
  const border = dark ? "rgba(255,255,255,0.08)" : "#EDE8E3";
  const text = dark ? "#FFFAF5" : "#1A1A2E";
  const muted = dark ? "rgba(255,255,255,0.3)" : "#6B6B80";
  const inputBg = dark ? "rgba(255,255,255,0.05)" : "#fff";
  const inputBorder = dark ? "rgba(255,255,255,0.1)" : "#EDE8E3";

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: rest } = await supabase
      .from("restaurants").select("*").eq("email", user.email).single();
    if (!rest) { router.push("/onboarding"); return; }

    setRestaurantId(rest.id);

    const { data: tbls } = await supabase
      .from("tables").select("*").eq("restaurant_id", rest.id).order("name");
    setTables(tbls || []);
    if (tbls && tbls.length > 0) setTableId(tbls[0].id);
  }

  async function handleSubmit() {
    if (!guestName || !date || !time || !partySize) {
      setError("Bitte Name, Datum, Uhrzeit und Personenzahl ausfüllen.");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase.from("reservations").insert([{
      restaurant_id: restaurantId,
      table_id: tableId || null,
      guest_name: guestName,
      guest_phone: guestPhone || null,
      guest_email: guestEmail || null,
      party_size: parseInt(partySize),
      date,
      time,
      channel,
      notes: notes || null,
      status: "confirmed",
    }]);

    if (err) {
      setError("Fehler beim Speichern: " + err.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    color: text,
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 500,
    color: muted,
    marginBottom: "6px",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  return (
    <div style={{minHeight:"100vh",background:bg,fontFamily:"'DM Sans',sans-serif",display:"flex",transition:"background 0.3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: ${muted}; }
        input:focus, select:focus, textarea:focus { border-color: #FF5C35 !important; }
        select { appearance: none; -webkit-appearance: none; }
        .back-btn:hover { color: #FF5C35 !important; }
        .submit-btn:hover { background: #FF7A5A !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,92,53,0.3) !important; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{width:"64px",background:dark?"#0A0A0F":"#1A1A2E",borderRight:`1px solid ${border}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0",position:"fixed",top:0,bottom:0,left:0,zIndex:50}}>
        <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"#FF5C35",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"32px",flexShrink:0}}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5h12M3 9h8M3 13h5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
        {[
          {path:"/dashboard",active:false,icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>},
          {path:"/dashboard/new",active:true,icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>},
          {path:"/dashboard/settings",active:false,icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M9 1.5V4M9 14v2.5M1.5 9H4M14 9h2.5M3.7 3.7l1.6 1.6M12.7 12.7l1.6 1.6M3.7 14.3l1.6-1.6M12.7 5.3l1.6-1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>},
        ].map((item,i) => (
          <button key={i} onClick={() => router.push(item.path)} style={{
            width:"40px",height:"40px",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",
            background: item.active ? "rgba(255,92,53,0.15)" : "transparent",
            border: item.active ? "1px solid rgba(255,92,53,0.2)" : "1px solid transparent",
            color: item.active ? "#FF5C35" : "rgba(255,255,255,0.3)",
            cursor:"pointer",marginBottom:"4px",transition:"all 0.15s"
          }}>
            {item.icon}
          </button>
        ))}
      </aside>

      {/* MAIN */}
      <main style={{marginLeft:"64px",flex:1,display:"flex",flexDirection:"column"}}>

        {/* TOP BAR */}
        <header style={{height:"60px",borderBottom:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",background:dark?"rgba(15,15,20,0.95)":"rgba(245,240,235,0.95)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:40}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <button className="back-btn" onClick={() => router.push("/dashboard")} style={{background:"none",border:"none",cursor:"pointer",color:muted,fontSize:"13px",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"6px",transition:"color 0.15s",padding:0}}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Dashboard
            </button>
            <span style={{color:muted}}>›</span>
            <span style={{fontSize:"13px",color:text,fontWeight:500}}>Neue Reservierung</span>
          </div>

        </header>

        <div style={{padding:"32px",maxWidth:"680px"}}>

          <div style={{marginBottom:"28px"}}>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,color:text,letterSpacing:"-0.5px",marginBottom:"6px"}}>
              Neue Reservierung
            </h1>
            <p style={{fontSize:"13px",color:muted,fontWeight:300}}>Trag eine Reservierung manuell ein.</p>
          </div>

          <div style={{background:surface,border:`1px solid ${border}`,borderRadius:"16px",padding:"28px",display:"flex",flexDirection:"column",gap:"20px"}}>

            {/* Gast Name */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
              <div>
                <label style={labelStyle}>Name des Gastes *</label>
                <input style={inputStyle} type="text" placeholder="Maria Muster" value={guestName} onChange={e => setGuestName(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Telefon</label>
                <input style={inputStyle} type="tel" placeholder="+43 660 123456" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>E-Mail</label>
              <input style={inputStyle} type="email" placeholder="gast@email.at" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} />
            </div>

            {/* Datum + Uhrzeit + Personen */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px"}}>
              <div>
                <label style={labelStyle}>Datum *</label>
                <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Uhrzeit *</label>
                <input style={inputStyle} type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Personen *</label>
                <select style={inputStyle} value={partySize} onChange={e => setPartySize(e.target.value)}>
                  {[1,2,3,4,5,6,7,8,10,12,15,20].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? "Person" : "Personen"}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tisch + Kanal */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
              <div>
                <label style={labelStyle}>Tisch</label>
                <select style={inputStyle} value={tableId} onChange={e => setTableId(e.target.value)}>
                  <option value="">Automatisch zuweisen</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.capacity} Pers.)</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Kanal</label>
                <select style={inputStyle} value={channel} onChange={e => setChannel(e.target.value)}>
                  <option value="online">Online</option>
                  <option value="phone">Telefon</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="walkin">Walk-in</option>
                </select>
              </div>
            </div>

            {/* Notizen */}
            <div>
              <label style={labelStyle}>Notizen</label>
              <textarea
                style={{...inputStyle, minHeight:"80px", resize:"vertical", lineHeight:"1.5"}}
                placeholder="Allergien, Sonderwünsche, Anlass..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",color:"#F87171"}}>
                {error}
              </div>
            )}

            {/* Buttons */}
            <div style={{display:"flex",gap:"10px",paddingTop:"4px"}}>
              <button onClick={() => router.push("/dashboard")} style={{
                flex:1,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:500,cursor:"pointer",
                fontFamily:"inherit",background:"transparent",border:`1px solid ${border}`,color:muted,transition:"all 0.2s"
              }}>
                Abbrechen
              </button>
              <button className="submit-btn" onClick={handleSubmit} disabled={loading} style={{
                flex:2,padding:"12px",borderRadius:"10px",fontSize:"14px",fontWeight:500,cursor:"pointer",
                fontFamily:"inherit",background:"#FF5C35",color:"#fff",border:"none",
                opacity: loading ? 0.7 : 1,transition:"all 0.2s"
              }}>
                {loading ? "Wird gespeichert..." : "Reservierung speichern →"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}