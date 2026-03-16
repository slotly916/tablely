"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SUPABASE KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "OK" : "MISSING");

const STEPS = ["Restaurant", "Tische", "Öffnungszeiten"];
const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Restaurant
  const [restaurantName, setRestaurantName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Step 2 — Tische
  const [tables, setTables] = useState([
    { name: "Tisch 1", capacity: 2 },
    { name: "Tisch 2", capacity: 4 },
  ]);

  // Step 3 — Öffnungszeiten
  const [hours, setHours] = useState(
    DAYS.map((_, i) => ({
      day: i,
      open: "11:00",
      close: "22:00",
      closed: i === 6,
    }))
  );

  function addTable() {
    setTables([...tables, { name: `Tisch ${tables.length + 1}`, capacity: 2 }]);
  }

  function removeTable(i: number) {
    setTables(tables.filter((_, idx) => idx !== i));
  }

  function updateTable(i: number, field: string, value: string | number) {
    setTables(tables.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }

  function updateHours(i: number, field: string, value: string | boolean) {
    setHours(hours.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  }

  async function handleFinish() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Restaurant erstellen
      const { data: restaurant, error: rErr } = await supabase
        .from("restaurants")
        .insert([{ name: restaurantName, email: user.email, phone, address }])
        .select()
        .single();

      if (rErr) throw rErr;

      // Tische erstellen
      if (tables.length > 0) {
        const { error: tErr } = await supabase
          .from("tables")
          .insert(tables.map(t => ({ ...t, restaurant_id: restaurant.id })));
        if (tErr) throw tErr;
      }

      // Öffnungszeiten erstellen
      const { error: hErr } = await supabase
        .from("opening_hours")
        .insert(hours.map(h => ({
          restaurant_id: restaurant.id,
          day_of_week: h.day,
          open_time: h.open,
          close_time: h.close,
          is_closed: h.closed,
        })));
      if (hErr) throw hErr;

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern.");
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <a href="/" style={logo}>table<span style={{color:"#FF5C35"}}>ly</span></a>

        {/* Progress */}
        <div style={{display:"flex", gap:"8px", marginBottom:"32px"}}>
          {STEPS.map((s, i) => (
            <div key={i} style={{flex:1}}>
              <div style={{
                height:"4px", borderRadius:"2px",
                background: i <= step ? "#FF5C35" : "#F0EBE3",
                transition: "background .3s",
                marginBottom:"6px"
              }}/>
              <div style={{fontSize:"11px", color: i === step ? "#FF5C35" : "#6B6B80", fontWeight: i === step ? 600 : 400}}>
                {s}
              </div>
            </div>
          ))}
        </div>

        {/* STEP 1 — Restaurant */}
        {step === 0 && (
          <>
            <h1 style={title}>Dein Restaurant einrichten</h1>
            <p style={sub}>Diese Angaben erscheinen auf deiner Buchungsseite.</p>
            <div style={form}>
              <Field label="Name des Restaurants *">
                <input style={input} type="text" placeholder="Ristorante da Marco" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} />
              </Field>
              <Field label="Telefonnummer">
                <input style={input} type="tel" placeholder="+43 512 123456" value={phone} onChange={e => setPhone(e.target.value)} />
              </Field>
              <Field label="Adresse">
                <input style={input} type="text" placeholder="Musterstraße 1, 6020 Innsbruck" value={address} onChange={e => setAddress(e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {/* STEP 2 — Tische */}
        {step === 1 && (
          <>
            <h1 style={title}>Deine Tische</h1>
            <p style={sub}>Definiere deine Tische einmalig. Tablely weist Reservierungen automatisch zu.</p>
            <div style={{display:"flex", flexDirection:"column", gap:"10px", marginBottom:"16px"}}>
              {tables.map((t, i) => (
                <div key={i} style={{display:"flex", gap:"10px", alignItems:"center"}}>
                  <input
                    style={{...input, flex:1}}
                    type="text"
                    placeholder="Tischname"
                    value={t.name}
                    onChange={e => updateTable(i, "name", e.target.value)}
                  />
                  <select
                    style={{...input, width:"100px"}}
                    value={t.capacity}
                    onChange={e => updateTable(i, "capacity", parseInt(e.target.value))}
                  >
                    {[1,2,3,4,5,6,7,8,10,12].map(n => (
                      <option key={n} value={n}>{n} Pers.</option>
                    ))}
                  </select>
                  {tables.length > 1 && (
                    <button onClick={() => removeTable(i)} style={{background:"none", border:"none", cursor:"pointer", color:"#E24B4A", fontSize:"18px", lineHeight:1}}>×</button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addTable} style={{...outlineBtn}}>+ Tisch hinzufügen</button>
          </>
        )}

        {/* STEP 3 — Öffnungszeiten */}
        {step === 2 && (
          <>
            <h1 style={title}>Öffnungszeiten</h1>
            <p style={sub}>Wann ist dein Restaurant geöffnet?</p>
            <div style={{display:"flex", flexDirection:"column", gap:"8px"}}>
              {DAYS.map((day, i) => (
                <div key={i} style={{display:"flex", alignItems:"center", gap:"10px", padding:"8px 0", borderBottom:"1px solid #F0EBE3"}}>
                  <span style={{width:"90px", fontSize:"13px", fontWeight:500, color:"#1A1A2E"}}>{day}</span>
                  {hours[i].closed ? (
                    <span style={{fontSize:"13px", color:"#6B6B80", flex:1}}>Geschlossen</span>
                  ) : (
                    <>
                      <input style={{...input, width:"90px", padding:"8px 10px", fontSize:"13px"}} type="time" value={hours[i].open} onChange={e => updateHours(i, "open", e.target.value)} />
                      <span style={{fontSize:"13px", color:"#6B6B80"}}>–</span>
                      <input style={{...input, width:"90px", padding:"8px 10px", fontSize:"13px"}} type="time" value={hours[i].close} onChange={e => updateHours(i, "close", e.target.value)} />
                    </>
                  )}
                  <label style={{marginLeft:"auto", display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"#6B6B80", cursor:"pointer"}}>
                    <input type="checkbox" checked={hours[i].closed} onChange={e => updateHours(i, "closed", e.target.checked)} />
                    Zu
                  </label>
                </div>
              ))}
            </div>
          </>
        )}

        {error && <p style={{color:"#E24B4A", fontSize:"13px", marginTop:"12px"}}>{error}</p>}

        {/* Navigation */}
        <div style={{display:"flex", gap:"10px", marginTop:"32px"}}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={outlineBtn}>
              ← Zurück
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => {
                if (step === 0 && !restaurantName) { setError("Bitte Restaurant-Name eingeben."); return; }
                setError("");
                setStep(step + 1);
              }}
              style={{...btn, flex:1}}
            >
              Weiter →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              style={{...btn, flex:1, opacity: loading ? 0.7 : 1}}
            >
              {loading ? "Wird gespeichert..." : "Einrichtung abschließen →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{display:"flex", flexDirection:"column", gap:"6px"}}>
      <label style={{fontSize:"13px", fontWeight:500, color:"#1A1A2E"}}>{label}</label>
      {children}
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight:"100vh", background:"#F0EBE3", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"'DM Sans', sans-serif" };
const card: React.CSSProperties = { background:"#FFFAF5", borderRadius:"20px", padding:"40px", width:"100%", maxWidth:"520px", boxShadow:"0 8px 40px rgba(26,26,46,0.08)" };
const logo: React.CSSProperties = { fontFamily:"Georgia, serif", fontSize:"24px", fontWeight:700, color:"#1A1A2E", textDecoration:"none", display:"block", marginBottom:"28px" };
const title: React.CSSProperties = { fontFamily:"Georgia, serif", fontSize:"24px", fontWeight:700, color:"#1A1A2E", letterSpacing:"-0.5px", marginBottom:"8px" };
const sub: React.CSSProperties = { fontSize:"14px", color:"#6B6B80", marginBottom:"24px", lineHeight:1.6, fontWeight:300 };
const form: React.CSSProperties = { display:"flex", flexDirection:"column", gap:"16px" };
const input: React.CSSProperties = { padding:"12px 14px", border:"1.5px solid #F0EBE3", borderRadius:"10px", fontSize:"14px", fontFamily:"inherit", background:"#fff", color:"#1A1A2E", outline:"none" };
const btn: React.CSSProperties = { background:"#FF5C35", color:"#fff", border:"none", padding:"14px", borderRadius:"10px", fontSize:"15px", fontWeight:500, cursor:"pointer", fontFamily:"inherit", transition:"all .2s" };
const outlineBtn: React.CSSProperties = { background:"transparent", color:"#1A1A2E", border:"1.5px solid #F0EBE3", padding:"14px 20px", borderRadius:"10px", fontSize:"14px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" };