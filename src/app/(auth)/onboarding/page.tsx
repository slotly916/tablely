"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const STEPS = ["Restaurant", "Tische", "Öffnungszeiten", "Einstellungen", "WhatsApp", "App"];
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
  const [tables, setTables] = useState<Array<{name: string; capacity: number; combinable_with: string[]}>>([
    { name: "Tisch 1", capacity: 2, combinable_with: [] },
    { name: "Tisch 2", capacity: 4, combinable_with: [] },
  ]);

  // Step 3 — Öffnungszeiten
  const [hours, setHours] = useState(
    DAYS.map((_, i) => ({ day: i, open: "11:00", close: "22:00", closed: i === 6 }))
  );

  // Step 4 — Einstellungen
  const [stayDuration, setStayDuration] = useState(150);
  const [largeGroupThreshold, setLargeGroupThreshold] = useState(15);

  // Step 5 — WhatsApp
  const [waPhoneId, setWaPhoneId] = useState("");
  const [skipWa, setSkipWa] = useState(false);

  function addTable() {
    setTables([...tables, { name: `Tisch ${tables.length + 1}`, capacity: 2, combinable_with: [] }]);
  }
  function removeTable(i: number) {
    setTables(tables.filter((_, idx) => idx !== i));
  }
  function updateTable(i: number, field: string, value: string | number | string[]) {
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

      // Slug generieren
      const slug = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") + "-";

      const { data: restaurant, error: rErr } = await supabase
        .from("restaurants")
        .insert([{
          name: restaurantName,
          email: user.email,
          phone,
          address,
          slug,
          stay_duration: stayDuration,
          large_group_threshold: largeGroupThreshold,
          trial_start: new Date().toISOString(),
          trial_days: 30,
          plan: "trial",
          whatsapp_phone_id: waPhoneId || null,
        }])
        .select()
        .single();

      if (rErr) throw rErr;

      if (tables.length > 0) {
        const sorted = [...tables].sort((a, b) => {
          const na = parseInt(a.name.replace(/[^0-9]/g, "")) || 0;
          const nb = parseInt(b.name.replace(/[^0-9]/g, "")) || 0;
          return na - nb;
        });
        // Insert tables first, then update with table IDs for combinable_with
        const { data: insertedTables, error: tErr } = await supabase.from("tables")
          .insert(sorted.map(t => ({ 
            name: t.name, 
            capacity: t.capacity, 
            restaurant_id: restaurant.id,
            combinable_with: []
          })))
          .select();
        if (tErr) throw tErr;
        
        // Now update combinable_with with actual table IDs
        if (insertedTables) {
          for (const t of sorted) {
            if (t.combinable_with && t.combinable_with.length > 0) {
              const myTable = insertedTables.find(it => it.name === t.name);
              const combinableIds = t.combinable_with
                .map(name => insertedTables.find(it => it.name === name)?.id)
                .filter(Boolean);
              if (myTable && combinableIds.length > 0) {
                await supabase.from("tables")
                  .update({ combinable_with: combinableIds })
                  .eq("id", myTable.id);
              }
            }
          }
        }
      }

      const { error: hErr } = await supabase.from("opening_hours")
        .insert(hours.map(h => ({
          restaurant_id: restaurant.id,
          day_of_week: h.day,
          open_time: h.open,
          close_time: h.close,
          is_closed: h.closed,
        })));
      if (hErr) throw hErr;

      // Willkommensmail
      try {
        await fetch("/api/welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, name: user.user_metadata?.full_name || restaurantName, restaurantName }),
        });
      } catch {}

      // Admin Benachrichtigung
      try {
        await fetch("/api/notify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantName, email: user.email, phone, address }),
        });
      } catch {}

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern.");
      setLoading(false);
    }
  }

  return (
    <div style={wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;}
        input:focus,select:focus{border-color:#FF5C35!important;outline:none;}
        select{appearance:none;-webkit-appearance:none;}
      `}</style>
      <div style={card}>
        <a href="/" style={logo}>table<span style={{color:"#FF5C35"}}>ly</span></a>

        {/* Progress */}
        <div style={{display:"flex",gap:"6px",marginBottom:"32px"}}>
          {STEPS.map((s, i) => (
            <div key={i} style={{flex:1}}>
              <div style={{height:"3px",borderRadius:"2px",background:i<=step?"#FF5C35":"#F0EBE3",transition:"background .3s",marginBottom:"5px"}}/>
              <div style={{fontSize:"10px",color:i===step?"#FF5C35":"#6B6B80",fontWeight:i===step?600:400,whiteSpace:"nowrap"}}>{s}</div>
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
                <input style={input} type="text" placeholder="Ristorante da Marco" value={restaurantName} onChange={e=>setRestaurantName(e.target.value)}/>
              </Field>
              <Field label="Telefonnummer">
                <input style={input} type="tel" placeholder="+43 512 123456" value={phone} onChange={e=>setPhone(e.target.value)}/>
              </Field>
              <Field label="Adresse">
                <input style={input} type="text" placeholder="Musterstraße 1, 6020 Innsbruck" value={address} onChange={e=>setAddress(e.target.value)}/>
              </Field>
            </div>
          </>
        )}

        {/* STEP 2 — Tische */}
        {step === 1 && (
          <>
            <h1 style={title}>Deine Tische</h1>
            <p style={sub}>Definiere deine Tische und welche zusammen geschoben werden können.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"16px"}}>
              {tables.map((t, i) => (
                <div key={i} style={{background:"#FFFFFF",borderRadius:"10px",padding:"12px",border:"1px solid #F0EBE3"}}>
                  <div style={{display:"flex",gap:"10px",alignItems:"center",marginBottom:"8px"}}>
                    <input style={{...input,flex:1}} type="text" placeholder="Tischname" value={t.name} onChange={e=>updateTable(i,"name",e.target.value)}/>
                    <select style={{...input,width:"110px"}} value={t.capacity} onChange={e=>updateTable(i,"capacity",parseInt(e.target.value))}>
                      {[1,2,3,4,5,6,7,8,10,12,15,20].map(n=>(
                        <option key={n} value={n}>{n} Pers.</option>
                      ))}
                    </select>
                    {tables.length > 1 && (
                      <button onClick={()=>removeTable(i)} style={{background:"none",border:"none",cursor:"pointer",color:"#E24B4A",fontSize:"20px",lineHeight:1,flexShrink:0}}>×</button>
                    )}
                  </div>
                  {tables.length > 1 && (
                    <div>
                      <div style={{fontSize:"11px",color:"#6B6B80",marginBottom:"6px"}}>Kombinierbar mit:</div>
                      <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                        {tables.map((other, j) => j !== i && (
                          <button key={j} onClick={()=>{
                            const isSelected = t.combinable_with.includes(other.name);
                            const newCombinable = isSelected 
                              ? t.combinable_with.filter(n => n !== other.name)
                              : [...t.combinable_with, other.name];
                            updateTable(i, "combinable_with", newCombinable);
                          }} style={{
                            padding:"4px 10px",borderRadius:"14px",fontSize:"11px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:"1px solid",
                            background: t.combinable_with.includes(other.name) ? "#FF5C35" : "transparent",
                            color: t.combinable_with.includes(other.name) ? "#fff" : "#6B6B80",
                            borderColor: t.combinable_with.includes(other.name) ? "#FF5C35" : "#F0EBE3",
                          }}>{other.name}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addTable} style={outlineBtn}>+ Tisch hinzufügen</button>
            <div style={{background:"rgba(255,92,53,.08)",border:"1px solid rgba(255,92,53,.15)",borderRadius:"10px",padding:"12px 16px",fontSize:"12px",color:"#FF5C35",lineHeight:1.6,marginTop:"12px"}}>
              💡 Tipp: Wähle bei jedem Tisch aus welche Tische daneben stehen und zusammengeschoben werden können. Tablely nutzt das automatisch für Gruppen.
            </div>
          </>
        )}

        {/* STEP 3 — Öffnungszeiten */}
        {step === 2 && (
          <>
            <h1 style={title}>Öffnungszeiten</h1>
            <p style={sub}>Wann ist dein Restaurant geöffnet?</p>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {DAYS.map((day, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 0",borderBottom:"1px solid #F0EBE3"}}>
                  <span style={{width:"90px",fontSize:"13px",fontWeight:500,color:"#1A1A2E"}}>{day}</span>
                  {hours[i].closed ? (
                    <span style={{fontSize:"13px",color:"#6B6B80",flex:1}}>Geschlossen</span>
                  ) : (
                    <>
                      <input style={{...input,width:"90px",padding:"8px 10px",fontSize:"13px"}} type="time" value={hours[i].open} onChange={e=>updateHours(i,"open",e.target.value)}/>
                      <span style={{fontSize:"13px",color:"#6B6B80"}}>–</span>
                      <input style={{...input,width:"90px",padding:"8px 10px",fontSize:"13px"}} type="time" value={hours[i].close} onChange={e=>updateHours(i,"close",e.target.value)}/>
                    </>
                  )}
                  <label style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"6px",fontSize:"12px",color:"#6B6B80",cursor:"pointer"}}>
                    <input type="checkbox" checked={hours[i].closed} onChange={e=>updateHours(i,"closed",e.target.checked)}/>
                    Zu
                  </label>
                </div>
              ))}
            </div>
          </>
        )}

        {/* STEP 4 — Einstellungen */}
        {step === 3 && (
          <>
            <h1 style={title}>Einstellungen</h1>
            <p style={sub}>Diese Einstellungen können später jederzeit geändert werden.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
              <Field label="Aufenthaltsdauer pro Reservierung">
                <select style={input} value={stayDuration} onChange={e=>setStayDuration(parseInt(e.target.value))}>
                  <option value={60}>1 Stunde</option>
                  <option value={90}>1,5 Stunden</option>
                  <option value={120}>2 Stunden</option>
                  <option value={150}>2,5 Stunden (Standard)</option>
                  <option value={180}>3 Stunden</option>
                  <option value={240}>4 Stunden</option>
                </select>
                <div style={{fontSize:"11px",color:"#6B6B80",marginTop:"4px"}}>
                  Tische werden für diese Dauer blockiert. Nach {Math.floor(stayDuration/60)}:{String(stayDuration%60).padStart(2,"0")}h ist der Tisch wieder frei.
                </div>
              </Field>
              <Field label="Großgruppen-Meldung ab">
                <select style={input} value={largeGroupThreshold} onChange={e=>setLargeGroupThreshold(parseInt(e.target.value))}>
                  {[5,8,10,12,15,20,25,30].map(n=>(
                    <option key={n} value={n}>Ab {n} Personen</option>
                  ))}
                </select>
                <div style={{fontSize:"11px",color:"#6B6B80",marginTop:"4px"}}>
                  Ab dieser Personenzahl erscheint eine Benachrichtigung im Dashboard zur manuellen Prüfung.
                </div>
              </Field>
            </div>
          </>
        )}

        {/* STEP 5 — WhatsApp */}
        {step === 4 && (
          <>
            <h1 style={title}>WhatsApp KI verbinden</h1>
            <p style={sub}>Verbinde deine WhatsApp Business Nummer in wenigen Klicks — direkt über Meta.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

              {/* Embedded Signup Button */}
              <div style={{background:"#F5F0EB",borderRadius:"16px",padding:"24px",border:"1px solid #F0EBE3",textAlign:"center"}}>
                <div style={{width:"48px",height:"48px",borderRadius:"12px",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M13 2C7 2 2 7 2 13c0 1.9.5 3.7 1.4 5.3L2 24l5.9-1.4C9.3 23.5 11.1 24 13 24c6 0 11-5 11-11S19 2 13 2zm5.5 15.5c-.2.6-1.3 1.2-1.8 1.3-.5 0-.9.1-3.2-.7s-3.6-2.6-4.1-3.4c-.5-.8-1.3-2-1.3-3.4s.7-1.8.9-2.1c.3-.2.5-.3.8-.3h.5c.2 0 .4.1.6.6l1 2.6c.1.2.1.5 0 .7l-.4.5c-.1.2-.3.4-.1.7.6 1 1.4 1.8 2.5 2.4.3.2.5.1.7-.1l.6-.8c.2-.3.4-.3.7-.1l2.5 1.2c.3.1.4.3.4.5-.1.4-.2 1-.8 1.4z" fill="white"/></svg>
                </div>
                <div style={{fontSize:"15px",fontWeight:600,color:"#1A1A2E",marginBottom:"6px"}}>Mit Meta verbinden</div>
                <p style={{fontSize:"13px",color:"#6B6B80",lineHeight:1.6,marginBottom:"16px",fontWeight:300}}>
                  Klicke den Button und melde dich mit deinem Facebook Konto an. Wähle deine WhatsApp Business Nummer aus — fertig.
                </p>
                <a
                  href="https://business.facebook.com/messaging/whatsapp/onboard/?app_id=2357064618049055&config_id=1240740414802290&extras=%7B%22sessionInfoVersion%22%3A%223%22%2C%22version%22%3A%22v4%22%7D"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#1877F2",color:"#fff",padding:"12px 24px",borderRadius:"10px",fontSize:"14px",fontWeight:500,textDecoration:"none"}}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M18 9a9 9 0 1 0-10.406 8.892v-6.29H5.31V9h2.284V7.018c0-2.254 1.343-3.5 3.4-3.5.984 0 2.014.175 2.014.175v2.214h-1.135c-1.118 0-1.467.694-1.467 1.407V9h2.496l-.399 2.602h-2.097v6.29A9.003 9.003 0 0 0 18 9z" fill="white"/></svg>
                  Mit Facebook / Meta verbinden →
                </a>
              </div>

              {/* Tablely stellt Nummer */}
              <div style={{background:"#F5F0EB",borderRadius:"12px",padding:"18px",border:"1px solid #F0EBE3"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                  <div style={{width:"32px",height:"32px",borderRadius:"8px",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C5 1.5 1.5 5 1.5 9c0 1.3.3 2.6 1 3.7L1.5 16.5l3.9-1C6.4 16.1 7.7 16.5 9 16.5c4 0 7.5-3.5 7.5-7.5S13 1.5 9 1.5z" fill="white"/></svg>
                  </div>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#1A1A2E"}}>Wir stellen dir eine Nummer zur Verfügung</div>
                </div>
                <p style={{fontSize:"12px",color:"#6B6B80",lineHeight:1.6,marginBottom:"12px",fontWeight:300}}>
                  Du bekommst eine eigene österreichische WhatsApp Business Nummer von uns — vollständig eingerichtet. Deine Nummer ist innerhalb von <strong style={{color:"#1A1A2E"}}>12–24 Stunden</strong> einsatzbereit.
                </p>
                <div style={{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"12px"}}>
                  {["✓ Eigene +43 Nummer","✓ Vollständig eingerichtet von uns","✓ Keine technischen Kenntnisse nötig","✓ Private Nummer bleibt unberührt"].map((f,i)=>(
                    <div key={i} style={{fontSize:"12px",color:"#1A1A2E",fontWeight:400}}>{f}</div>
                  ))}
                </div>
                <a href="mailto:info@tablely.at?subject=WhatsApp Nummer für mein Restaurant&body=Hallo Tablely Team, ich möchte eine österreichische WhatsApp Nummer für mein Restaurant." style={{display:"inline-flex",alignItems:"center",gap:"6px",background:"#FF5C35",color:"#fff",padding:"9px 16px",borderRadius:"8px",fontSize:"13px",fontWeight:500,textDecoration:"none"}}>
                  Nummer anfordern → info@tablely.at
                </a>
              </div>

              <label style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",fontSize:"13px",color:"#6B6B80"}}>
                <input type="checkbox" checked={skipWa} onChange={e=>setSkipWa(e.target.checked)}/>
                Später einrichten — ich möchte zuerst das Dashboard kennenlernen
              </label>
            </div>
          </>
        )}

        {/* STEP 6 — App installieren */}
        {step === 5 && (
          <>
            <h1 style={title}>App installieren</h1>
            <p style={sub}>Tablely kann wie eine App installiert werden. So hast du das Dashboard immer griffbereit.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <div style={{background:"#F5F0EB",borderRadius:"14px",padding:"18px",border:"1px solid #F0EBE3"}}>
                <div style={{fontSize:"13px",fontWeight:600,color:"#1A1A2E",marginBottom:"10px"}}>iPhone / iPad</div>
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>1. Safari oeffnen und tablely.at/dashboard aufrufen</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>2. Teilen-Symbol antippen (Pfeil nach oben)</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>3. Zum Home-Bildschirm hinzufuegen</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>4. Hinzufuegen bestaetigen</div>
                </div>
              </div>
              <div style={{background:"#F5F0EB",borderRadius:"14px",padding:"18px",border:"1px solid #F0EBE3"}}>
                <div style={{fontSize:"13px",fontWeight:600,color:"#1A1A2E",marginBottom:"10px"}}>Android / Chrome</div>
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>1. Chrome oeffnen und tablely.at/dashboard aufrufen</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>2. Drei Punkte oben rechts antippen</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>3. Zum Startbildschirm hinzufuegen</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>4. Bestaetigen</div>
                </div>
              </div>
              <div style={{background:"rgba(255,92,53,.08)",border:"1px solid rgba(255,92,53,.15)",borderRadius:"10px",padding:"12px 16px",fontSize:"12px",color:"#FF5C35",lineHeight:1.6}}>
                Tipp: Auf dem iPad im Querformat sieht das Dashboard am besten aus.
              </div>
            </div>
          </>
        )}

        {error && <p style={{color:"#E24B4A",fontSize:"13px",marginTop:"12px"}}>{error}</p>}

        {/* Navigation */}
        <div style={{display:"flex",gap:"10px",marginTop:"32px"}}>
          {step > 0 && (
            <button onClick={()=>setStep(step-1)} style={outlineBtn}>← Zurück</button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={()=>{
              if (step===0 && !restaurantName) { setError("Bitte Restaurant-Name eingeben."); return; }
              setError("");
              setStep(step+1);
            }} style={{...btn,flex:1}}>
              Weiter →
            </button>
          ) : (
            <button onClick={handleFinish} disabled={loading} style={{...btn,flex:1,opacity:loading?0.7:1}}>
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
    <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
      <label style={{fontSize:"13px",fontWeight:500,color:"#1A1A2E"}}>{label}</label>
      {children}
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight:"100vh",background:"#F0EBE3",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'DM Sans',sans-serif" };
const card: React.CSSProperties = { background:"#FFFAF5",borderRadius:"20px",padding:"40px",width:"100%",maxWidth:"520px",boxShadow:"0 8px 40px rgba(26,26,46,0.08)" };
const logo: React.CSSProperties = { fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#1A1A2E",textDecoration:"none",display:"block",marginBottom:"28px" };
const title: React.CSSProperties = { fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-0.5px",marginBottom:"8px" };
const sub: React.CSSProperties = { fontSize:"14px",color:"#6B6B80",marginBottom:"24px",lineHeight:1.6,fontWeight:300 };
const form: React.CSSProperties = { display:"flex",flexDirection:"column",gap:"16px" };
const input: React.CSSProperties = { padding:"12px 14px",border:"1.5px solid #F0EBE3",borderRadius:"10px",fontSize:"14px",fontFamily:"inherit",background:"#fff",color:"#1A1A2E",outline:"none",width:"100%" };
const btn: React.CSSProperties = { background:"#FF5C35",color:"#fff",border:"none",padding:"14px",borderRadius:"10px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all .2s" };
const outlineBtn: React.CSSProperties = { background:"transparent",color:"#1A1A2E",border:"1.5px solid #F0EBE3",padding:"14px 20px",borderRadius:"10px",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit" };