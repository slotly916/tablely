"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const STEPS = ["Restaurant", "Tische", "Gruppen", "Öffnungszeiten", "Einstellungen", "WhatsApp", "App"];
const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [restaurantName, setRestaurantName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [tables, setTables] = useState<Array<{name: string; capacity: number}>>([
    { name: "Tisch 1", capacity: 2 },
    { name: "Tisch 2", capacity: 4 },
  ]);

  // Tisch-Gruppen — array of arrays of table names
  const [groups, setGroups] = useState<string[][]>([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupSelection, setGroupSelection] = useState<string[]>([]);

  const [hours, setHours] = useState(
    DAYS.map((_, i) => ({ day: i, open: "11:00", close: "22:00", closed: i === 6 }))
  );

  const [stayDuration, setStayDuration] = useState(150);
  const [largeGroupThreshold, setLargeGroupThreshold] = useState(15);

  const [waPhoneId, setWaPhoneId] = useState("");
  const [skipWa, setSkipWa] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqStatus, setReqStatus] = useState<"idle"|"loading"|"sent"|"error">("idle");

  // GUARD: Wenn der User schon ein Restaurant hat, direkt ins Dashboard.
  // Verhindert die Onboarding-Schleife und doppelte Restaurants beim
  // erneuten Google-Login (der immer auf /onboarding leitet).
  useEffect(() => {
    async function checkExisting() {
      const supabase = createClient();
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.error("Auth-Fehler:", authErr);
        setError("Deine Sitzung konnte nicht geprüft werden. Bitte lade die Seite neu bevor du fortfährst.");
        return;
      }
      if (!user) return;
      const { data: existing, error: existErr } = await supabase
        .from("restaurants")
        .select("id")
        .eq("email", user.email)
        .limit(1);
      if (existErr) {
        console.error("Bestehendes Restaurant prüfen fehlgeschlagen:", existErr);
        setError("Wir konnten nicht prüfen ob du schon ein Restaurant hast. Bitte lade die Seite neu — sonst legst du es eventuell doppelt an.");
        return;
      }
      if (existing && existing.length > 0) {
        router.replace("/dashboard");
      }
    }
    checkExisting();
  }, [router]);

  function addTable() {
    setTables([...tables, { name: `Tisch ${tables.length + 1}`, capacity: 2 }]);
  }
  function removeTable(i: number) {
    const tableName = tables[i].name;
    setTables(tables.filter((_, idx) => idx !== i));
    // Auch aus Gruppen entfernen
    setGroups(groups.map(g => g.filter(n => n !== tableName)).filter(g => g.length >= 2));
  }
  function updateTable(i: number, field: string, value: string | number) {
    setTables(tables.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  }
  function updateHours(i: number, field: string, value: string | boolean) {
    setHours(hours.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  }

  // Tables that are already in a group
  const tablesInGroups = new Set<string>();
  groups.forEach(g => g.forEach(n => tablesInGroups.add(n)));

  function saveNewGroup() {
    if (groupSelection.length < 2) return;
    setGroups([...groups, groupSelection]);
    setShowNewGroup(false);
    setGroupSelection([]);
  }

  function deleteGroup(idx: number) {
    setGroups(groups.filter((_, i) => i !== idx));
  }

  async function requestNumber() {
    if (!reqName.trim() || !reqPhone.trim()) {
      setReqStatus("error");
      return;
    }
    setReqStatus("loading");
    try {
      const res = await fetch("/api/request-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: reqName, phone: reqPhone, restaurantName }),
      });
      if (!res.ok) { setReqStatus("error"); return; }
      setReqStatus("sent");
    } catch {
      setReqStatus("error");
    }
  }

  async function handleFinish() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw new Error("Deine Sitzung konnte nicht geprüft werden. Bitte lade die Seite neu." + (authErr.message ? ` (${authErr.message})` : ""));
      if (!user) { router.push("/login"); return; }

      // Doppel-Check: existiert schon ein Restaurant für diese Mail? Dann nicht nochmal anlegen.
      // Bei einem Fehler brechen wir bewusst ab statt anzulegen — sonst entstehen
      // genau die Duplikate die wir vermeiden wollen.
      const { data: alreadyExists, error: existErr } = await supabase
        .from("restaurants")
        .select("id")
        .eq("email", user.email)
        .limit(1);
      if (existErr) throw new Error("Wir konnten nicht prüfen ob du schon ein Restaurant hast. Bitte versuche es nochmal." + (existErr.message ? ` (${existErr.message})` : ""));
      if (alreadyExists && alreadyExists.length > 0) {
        router.push("/dashboard");
        return;
      }

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

      // PostgrestError ist kein Error-Objekt — sonst landet man im catch bei der
      // generischen Meldung und der eigentliche Grund geht verloren.
      if (rErr || !restaurant) throw new Error("Dein Restaurant konnte nicht angelegt werden." + (rErr?.message ? ` (${rErr.message})` : ""));

      let insertedTables: { id: string; name: string }[] = [];
      if (tables.length > 0) {
        const sorted = [...tables].sort((a, b) => {
          const na = parseInt(a.name.replace(/[^0-9]/g, "")) || 0;
          const nb = parseInt(b.name.replace(/[^0-9]/g, "")) || 0;
          return na - nb;
        });
        const { data, error: tErr } = await supabase.from("tables")
          .insert(sorted.map(t => ({
            name: t.name,
            capacity: t.capacity,
            restaurant_id: restaurant.id,
            combinable_with: []
          })))
          .select();
        if (tErr) throw new Error("Deine Tische konnten nicht gespeichert werden." + (tErr.message ? ` (${tErr.message})` : ""));
        insertedTables = data || [];
      }

      // Apply groups — for each group, update combinable_with
      for (const group of groups) {
        const groupTableIds = group
          .map(name => insertedTables.find(t => t.name === name)?.id)
          .filter(Boolean) as string[];
        
        if (groupTableIds.length >= 2) {
          for (const tableId of groupTableIds) {
            const others = groupTableIds.filter(id => id !== tableId);
            const { error: gErr } = await supabase.from("tables")
              .update({ combinable_with: others })
              .eq("id", tableId);
            if (gErr) throw new Error("Die Tisch-Gruppen konnten nicht gespeichert werden. Du kannst sie später in den Einstellungen anlegen." + (gErr.message ? ` (${gErr.message})` : ""));
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
      if (hErr) throw new Error("Deine Öffnungszeiten konnten nicht gespeichert werden. Du kannst sie in den Einstellungen nachtragen." + (hErr.message ? ` (${hErr.message})` : ""));

      try {
        await fetch("/api/welcome-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, name: user.user_metadata?.full_name || restaurantName, restaurantName }),
        });
      } catch {}

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

        <div style={{display:"flex",gap:"4px",marginBottom:"32px"}}>
          {STEPS.map((s, i) => (
            <div key={i} style={{flex:1}}>
              <div style={{height:"3px",borderRadius:"2px",background:i<=step?"#FF5C35":"#F0EBE3",transition:"background .3s",marginBottom:"5px"}}/>
              <div style={{fontSize:"10px",color:i===step?"#FF5C35":"#6B6B80",fontWeight:i===step?600:400,whiteSpace:"nowrap"}}>{s}</div>
            </div>
          ))}
        </div>

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

        {/* STEP 2 — TISCHE (vereinfacht, ohne Kombinationen) */}
        {step === 1 && (
          <>
            <h1 style={title}>Deine Tische</h1>
            <p style={sub}>Lege deine Tische mit Personenzahl an. Tisch-Gruppen kommen im nächsten Schritt.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"14px"}}>
              {tables.map((t, i) => (
                <div key={i} style={{background:"#fff",borderRadius:"10px",padding:"12px 14px",border:"1px solid #F0EBE3",display:"flex",gap:"10px",alignItems:"center"}}>
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
              ))}
            </div>
            <button onClick={addTable} style={outlineBtn}>+ Tisch hinzufügen</button>
          </>
        )}

        {/* STEP 3 — TISCH-GRUPPEN (NEU) */}
        {step === 2 && (
          <>
            <h1 style={title}>Tisch-Gruppen</h1>
            <p style={sub}>Welche Tische können zusammen geschoben werden? Das hilft Tablely bei größeren Gruppen.</p>
            
            <div style={{background:"rgba(255,92,53,.08)",border:"1px solid rgba(255,92,53,.15)",borderRadius:"10px",padding:"12px 16px",fontSize:"12px",color:"#FF5C35",lineHeight:1.6,marginBottom:"16px"}}>
              💡 Beispiel: Tisch 5 + Tisch 6 stehen nebeneinander und ergeben zusammen 10 Plätze. Tablely nutzt das automatisch wenn eine Gruppe von 8 Personen kommt.
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"14px"}}>
              {/* Existing groups */}
              {groups.map((g, i) => {
                const totalCapacity = g.reduce((sum, name) => sum + (tables.find(t => t.name === name)?.capacity || 0), 0);
                return (
                  <div key={i} style={{background:"#fff",border:"1px solid #F0EBE3",borderRadius:"12px",padding:"14px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                        <div style={{fontSize:"13px",fontWeight:600,color:"#1A1A2E"}}>Gruppe {i+1}</div>
                        <div style={{fontSize:"11px",color:"#FF5C35",background:"rgba(255,92,53,.1)",padding:"2px 10px",borderRadius:"20px",fontWeight:600}}>
                          {totalCapacity} Personen zusammen
                        </div>
                      </div>
                      <button onClick={() => deleteGroup(i)} style={{background:"none",border:"none",cursor:"pointer",color:"#E24B4A",fontSize:"18px",lineHeight:1}}>×</button>
                    </div>
                    <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                      {g.map(name => {
                        const cap = tables.find(t => t.name === name)?.capacity || 0;
                        return (
                          <div key={name} style={{padding:"4px 10px",background:"#FFF0EB",border:"1px solid rgba(255,92,53,.15)",borderRadius:"6px",fontSize:"12px",color:"#1A1A2E",fontWeight:500}}>
                            {name} <span style={{fontSize:"10px",color:"#6B6B80"}}>({cap}P)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {showNewGroup ? (
                <div style={{background:"#fff",border:"1px solid #FF5C35",borderRadius:"12px",padding:"14px 16px"}}>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#1A1A2E",marginBottom:"6px"}}>Neue Gruppe</div>
                  <div style={{fontSize:"12px",color:"#6B6B80",marginBottom:"10px"}}>Mindestens 2 Tische auswählen:</div>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"}}>
                    {tables.map(t => {
                      const isSelected = groupSelection.includes(t.name);
                      const isInOtherGroup = tablesInGroups.has(t.name);
                      return (
                        <button key={t.name} disabled={isInOtherGroup} onClick={() => {
                          if (isSelected) setGroupSelection(groupSelection.filter(n => n !== t.name));
                          else setGroupSelection([...groupSelection, t.name]);
                        }} style={{
                          padding:"5px 10px",borderRadius:"6px",fontSize:"12px",fontWeight:500,cursor:isInOtherGroup?"not-allowed":"pointer",fontFamily:"inherit",border:"1px solid",
                          background: isSelected ? "#FF5C35" : isInOtherGroup ? "rgba(0,0,0,.05)" : "transparent",
                          color: isSelected ? "#fff" : isInOtherGroup ? "rgba(0,0,0,.3)" : "#1A1A2E",
                          borderColor: isSelected ? "#FF5C35" : "#F0EBE3",
                          opacity: isInOtherGroup ? 0.5 : 1,
                        }}>
                          {t.name} ({t.capacity}P)
                        </button>
                      );
                    })}
                  </div>
                  {groupSelection.length >= 2 && (
                    <div style={{fontSize:"11px",color:"#FF5C35",fontWeight:600,marginBottom:"10px"}}>
                      = {groupSelection.reduce((sum, name) => sum + (tables.find(t => t.name === name)?.capacity || 0), 0)} Personen zusammen
                    </div>
                  )}
                  <div style={{display:"flex",gap:"8px"}}>
                    <button onClick={() => { setShowNewGroup(false); setGroupSelection([]); }} style={{padding:"7px 14px",borderRadius:"8px",background:"transparent",border:"1px solid #F0EBE3",color:"#6B6B80",fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>Abbrechen</button>
                    <button onClick={saveNewGroup} disabled={groupSelection.length < 2} style={{padding:"7px 16px",borderRadius:"8px",background:"#FF5C35",border:"none",color:"#fff",fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:groupSelection.length < 2 ? 0.5 : 1}}>✓ Erstellen</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowNewGroup(true)} style={outlineBtn}>+ Neue Tisch-Gruppe</button>
              )}

              {groups.length === 0 && !showNewGroup && (
                <div style={{fontSize:"12px",color:"#6B6B80",fontStyle:"italic",textAlign:"center",padding:"16px"}}>
                  Optional — kannst du auch später in den Einstellungen erstellen.
                </div>
              )}
            </div>
          </>
        )}

        {/* STEP 4 — Öffnungszeiten */}
        {step === 3 && (
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

        {/* STEP 5 — Einstellungen */}
        {step === 4 && (
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
                  Tische werden für diese Dauer blockiert.
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

        {/* STEP 6 — WhatsApp */}
        {step === 5 && (
          <>
            <h1 style={title}>Eigene WhatsApp Nummer</h1>
            <p style={sub}>Wir stellen dir eine eigene österreichische WhatsApp Business Nummer zur Verfügung — vollständig eingerichtet. Trag kurz deinen Namen und deine Telefonnummer ein, dann melden wir uns bei dir.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              {reqStatus === "sent" ? (
                <div style={{background:"#E8F8F1",borderRadius:"16px",padding:"28px",border:"1px solid #C8EDD9",textAlign:"center"}}>
                  <div style={{width:"48px",height:"48px",borderRadius:"50%",background:"#25C281",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{fontSize:"16px",fontWeight:600,color:"#1A1A2E",marginBottom:"6px"}}>Anfrage gesendet!</div>
                  <p style={{fontSize:"13px",color:"#6B6B80",lineHeight:1.6,fontWeight:300}}>
                    Wir melden uns innerhalb von 12–24 Stunden bei dir und richten deine WhatsApp Business Nummer ein.
                  </p>
                </div>
              ) : (
                <div style={{background:"#F5F0EB",borderRadius:"16px",padding:"24px",border:"1px solid #F0EBE3"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"}}>
                    <div style={{width:"40px",height:"40px",borderRadius:"10px",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 1.5C5.7 1.5 1.5 5.7 1.5 11c0 1.6.4 3.1 1.1 4.4L1.5 20.5l5.3-1.1C8 20.1 9.5 20.5 11 20.5c5.3 0 9.5-4.2 9.5-9.5S16.3 1.5 11 1.5z" fill="white"/></svg>
                    </div>
                    <div>
                      <div style={{fontSize:"15px",fontWeight:600,color:"#1A1A2E"}}>Nummer anfordern</div>
                      <div style={{fontSize:"12px",color:"#6B6B80"}}>Einsatzbereit in 12–24 Stunden</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"14px"}}>
                    <input
                      style={input}
                      type="text"
                      placeholder="Dein Name"
                      value={reqName}
                      onChange={e=>{setReqName(e.target.value); if(reqStatus==="error")setReqStatus("idle");}}
                    />
                    <input
                      style={input}
                      type="tel"
                      placeholder="Deine Telefonnummer"
                      value={reqPhone}
                      onChange={e=>{setReqPhone(e.target.value); if(reqStatus==="error")setReqStatus("idle");}}
                    />
                  </div>
                  {reqStatus === "error" && (
                    <p style={{fontSize:"12px",color:"#E24B4A",marginBottom:"12px"}}>Bitte Name und Telefonnummer eingeben.</p>
                  )}
                  <button
                    onClick={requestNumber}
                    disabled={reqStatus==="loading"}
                    style={{width:"100%",background:"#FF5C35",color:"#fff",border:"none",padding:"13px",borderRadius:"10px",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",opacity:reqStatus==="loading"?0.7:1}}
                  >
                    {reqStatus==="loading" ? "Wird gesendet..." : "Anfrage absenden"}
                  </button>
                </div>
              )}

              <label style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",fontSize:"13px",color:"#6B6B80"}}>
                <input type="checkbox" checked={skipWa} onChange={e=>setSkipWa(e.target.checked)}/>
                Später einrichten — ich möchte zuerst das Dashboard kennenlernen
              </label>
            </div>
          </>
        )}

        {/* STEP 7 — App */}
        {step === 6 && (
          <>
            <h1 style={title}>App installieren</h1>
            <p style={sub}>Tablely kann wie eine App installiert werden. So hast du das Dashboard immer griffbereit.</p>
            <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <div style={{background:"#F5F0EB",borderRadius:"14px",padding:"18px",border:"1px solid #F0EBE3"}}>
                <div style={{fontSize:"13px",fontWeight:600,color:"#1A1A2E",marginBottom:"10px"}}>iPhone / iPad</div>
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>1. Safari öffnen und tablely.at/dashboard aufrufen</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>2. Teilen-Symbol antippen (Pfeil nach oben)</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>3. Zum Home-Bildschirm hinzufügen</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>4. Hinzufügen bestätigen</div>
                </div>
              </div>
              <div style={{background:"#F5F0EB",borderRadius:"14px",padding:"18px",border:"1px solid #F0EBE3"}}>
                <div style={{fontSize:"13px",fontWeight:600,color:"#1A1A2E",marginBottom:"10px"}}>Android / Chrome</div>
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>1. Chrome öffnen und tablely.at/dashboard aufrufen</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>2. Drei Punkte oben rechts antippen</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>3. Zum Startbildschirm hinzufügen</div>
                  <div style={{fontSize:"13px",color:"#6B6B80"}}>4. Bestätigen</div>
                </div>
              </div>
            </div>
          </>
        )}

        {error && <p style={{color:"#E24B4A",fontSize:"13px",marginTop:"12px"}}>{error}</p>}

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
const card: React.CSSProperties = { background:"#FFFAF5",borderRadius:"20px",padding:"40px",width:"100%",maxWidth:"560px",boxShadow:"0 8px 40px rgba(26,26,46,0.08)" };
const logo: React.CSSProperties = { fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#1A1A2E",textDecoration:"none",display:"block",marginBottom:"28px" };
const title: React.CSSProperties = { fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-0.5px",marginBottom:"8px" };
const sub: React.CSSProperties = { fontSize:"14px",color:"#6B6B80",marginBottom:"24px",lineHeight:1.6,fontWeight:300 };
const form: React.CSSProperties = { display:"flex",flexDirection:"column",gap:"16px" };
const input: React.CSSProperties = { padding:"12px 14px",border:"1.5px solid #F0EBE3",borderRadius:"10px",fontSize:"14px",fontFamily:"inherit",background:"#fff",color:"#1A1A2E",outline:"none",width:"100%" };
const btn: React.CSSProperties = { background:"#FF5C35",color:"#fff",border:"none",padding:"14px",borderRadius:"10px",fontSize:"15px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all .2s" };
const outlineBtn: React.CSSProperties = { background:"transparent",color:"#1A1A2E",border:"1.5px solid #F0EBE3",padding:"12px 18px",borderRadius:"10px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit" };