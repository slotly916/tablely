"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Toast, { useToast, errorText } from "@/components/Toast";

const ADMIN_EMAIL = "michael@tablely.at";

type Restaurant = {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  trial_start: string;
  trial_days: number;
  is_blocked: boolean;
  created_at: string;
  whatsapp_phone_id: string | null;
  address?: string;
  slug?: string;
};

type NumberRequest = {
  id: string;
  restaurant_name: string;
  email: string;
  status: string;
  created_at: string;
};

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [numberRequests, setNumberRequests] = useState<NumberRequest[]>([]);
  const [tab, setTab] = useState<"overview"|"restaurants"|"numbers">("overview");
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<"all"|"trial"|"active"|"expired">("all");
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);
  const [loadError, setLoadError] = useState("");
  const { toast, showError, showSuccess, closeToast } = useToast();

  const load = useCallback(async () => {
    const supabase = createClient();
    setLoadError("");

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      console.error("Auth-Fehler:", authErr);
      setLoadError(errorText("Deine Sitzung konnte nicht geprüft werden.", authErr));
      setLoading(false);
      return;
    }
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push("/dashboard");
      return;
    }
    const { data: rests, error: restErr } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false });
    if (restErr) {
      console.error("Restaurants laden fehlgeschlagen:", restErr);
      setLoadError(errorText("Die Restaurants konnten nicht geladen werden.", restErr));
      setLoading(false);
      return;
    }
    setRestaurants(rests || []);

    // number_requests hat laut Schema-Notiz evtl. keine RLS-Policy — dann kommt
    // hier ein Fehler statt einer leeren Liste. Das muss sichtbar sein.
    const { data: reqs, error: reqErr } = await supabase.from("number_requests").select("*").order("created_at", { ascending: false });
    if (reqErr) {
      console.error("Nummern-Anfragen laden fehlgeschlagen:", reqErr);
      setLoadError(errorText("Die WhatsApp-Nummern-Anfragen konnten nicht geladen werden.", reqErr));
      setLoading(false);
      return;
    }
    setNumberRequests(reqs || []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function toggleBlock(id: string, blocked: boolean) {
    const supabase = createClient();
    const { error } = await supabase.from("restaurants").update({ is_blocked: !blocked }).eq("id", id);
    if (error) {
      console.error("Sperrstatus ändern fehlgeschlagen:", error);
      showError(errorText(`Das Restaurant konnte nicht ${blocked ? "entsperrt" : "gesperrt"} werden.`, error));
      return;
    }
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, is_blocked: !blocked } : r));
    if (selectedRest?.id === id) setSelectedRest({ ...selectedRest, is_blocked: !blocked });
    showSuccess(blocked ? "Restaurant entsperrt." : "Restaurant gesperrt.");
  }

  async function updateNumberRequest(id: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase.from("number_requests").update({ status }).eq("id", id);
    if (error) {
      console.error("Anfrage-Status ändern fehlgeschlagen:", error);
      showError(errorText("Der Status der Anfrage konnte nicht geändert werden.", error));
      return;
    }
    setNumberRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  function daysLeft(r: Restaurant) {
    if (!r.trial_start) return 0;
    const start = new Date(r.trial_start);
    const days = r.trial_days || 30;
    return Math.max(0, days - Math.floor((Date.now() - start.getTime()) / 86400000));
  }

  const stats = {
    total: restaurants.length,
    trial: restaurants.filter(r => r.plan === "trial").length,
    active: restaurants.filter(r => r.plan !== "trial").length,
    expiringSoon: restaurants.filter(r => daysLeft(r) <= 5 && daysLeft(r) > 0).length,
    expired: restaurants.filter(r => daysLeft(r) === 0 && r.plan === "trial").length,
    pendingNumbers: numberRequests.filter(r => r.status === "pending").length,
    noWhatsApp: restaurants.filter(r => !r.whatsapp_phone_id).length,
  };

  // Filtered restaurants
  const filtered = restaurants.filter(r => {
    const matchSearch = !search || 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.toLowerCase().includes(search.toLowerCase());
    
    const matchPlan = filterPlan === "all" ||
      (filterPlan === "trial" && r.plan === "trial") ||
      (filterPlan === "active" && r.plan !== "trial") ||
      (filterPlan === "expired" && daysLeft(r) === 0 && r.plan === "trial");
    
    return matchSearch && matchPlan;
  });

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0A0A12"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"14px"}}>
        <div style={{width:"32px",height:"32px",borderRadius:"50%",border:"2px solid rgba(255,255,255,.08)",borderTopColor:"#FF5C35",animation:"spin .7s linear infinite"}}/>
        <div style={{color:"rgba(255,255,255,.4)",fontSize:"13px"}}>Wird geladen...</div>
      </div>
    </div>
  );

  if (loadError) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0A0A12",fontFamily:"var(--font-sans)",padding:"24px"}}>
      <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(248,113,113,.25)",borderRadius:"16px",padding:"32px",maxWidth:"460px",width:"100%",textAlign:"center"}}>
        <div style={{width:"52px",height:"52px",borderRadius:"50%",background:"rgba(248,113,113,.12)",border:"1px solid rgba(248,113,113,.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#F87171" strokeWidth="1.6"/><path d="M11 6.5v5.5M11 15v.5" stroke="#F87171" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"#FFFAF5",marginBottom:"8px"}}>Admin-Daten konnten nicht geladen werden</h2>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,.5)",lineHeight:1.6,marginBottom:"20px"}}>{loadError}</p>
        <button onClick={() => { setLoading(true); load(); }} style={{
          padding:"11px 24px",borderRadius:"10px",background:"#FF5C35",border:"none",color:"#fff",
          fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
        }}>Erneut versuchen</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0A0A12",fontFamily:"var(--font-sans)",color:"#FFFAF5"}}>
      <Toast toast={toast} onClose={closeToast}/>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        select,input{appearance:none;-webkit-appearance:none;}
        input:focus{border-color:rgba(255,92,53,.5)!important;outline:none;}
        ::placeholder{color:rgba(255,255,255,.2);}
        .card-hover:hover{background:rgba(255,255,255,.05)!important;border-color:rgba(255,92,53,.2)!important;}
        .row-hover:hover{background:rgba(255,255,255,.03)!important;}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:3px;}
      `}</style>

      {/* HEADER */}
      <header style={{
        borderBottom:"1px solid rgba(255,255,255,.06)",
        padding:"16px 32px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        background:"rgba(10,10,18,.8)",backdropFilter:"blur(12px)",
        position:"sticky",top:0,zIndex:40,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700}}>
            <img src="/butlery-logo-dunkel.png" alt="Butlery" style={{height:"24px",width:"auto",display:"inline-block",verticalAlign:"middle"}}/>
          </div>
          <span style={{fontSize:"10px",background:"rgba(255,92,53,.12)",color:"#FF5C35",border:"1px solid rgba(255,92,53,.2)",padding:"3px 10px",borderRadius:"20px",fontWeight:600,letterSpacing:".5px",textTransform:"uppercase"}}>Admin</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)"}}>{new Date().toLocaleDateString("de-AT",{weekday:"long",day:"numeric",month:"long"})}</div>
          <button onClick={()=>router.push("/dashboard")} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"rgba(255,255,255,.6)",padding:"7px 14px",borderRadius:"8px",fontSize:"12px",cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>Dashboard →</button>
        </div>
      </header>

      <div style={{maxWidth:"1400px",margin:"0 auto",padding:"32px"}}>

        {/* HERO STATS */}
        <div style={{marginBottom:"32px"}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700,letterSpacing:"-1px",marginBottom:"6px"}}>
            {new Date().getHours() < 12 ? "Guten Morgen" : new Date().getHours() < 18 ? "Guten Tag" : "Guten Abend"}, Michi
          </h1>
          <p style={{fontSize:"14px",color:"rgba(255,255,255,.4)",fontWeight:300}}>
            {stats.total} Restaurants registriert · {stats.pendingNumbers} offene Anfragen · {stats.expiringSoon} laufen bald ab
          </p>
        </div>

        {/* KEY METRICS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px",marginBottom:"32px"}}>
          {[
            {label:"Restaurants gesamt",val:stats.total,trend:"+3 diese Woche",color:"#FF5C35",icon:(
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 7l7-4 7 4M3 7v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7M7 16v-5h6v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )},
            {label:"Aktive Tests",val:stats.trial,trend:`${stats.expiringSoon} laufen bald ab`,color:"#FCD34D",icon:(
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            )},
            {label:"Zahlende Kunden",val:stats.active,trend:`${Math.round((stats.active/Math.max(stats.total,1))*100)}% conversion`,color:"#34D399",icon:(
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10l4 4 10-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )},
            {label:"Offene Anfragen",val:stats.pendingNumbers,trend:"WhatsApp Nummern",color:"#25D366",icon:(
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2C5.6 2 2 5.6 2 10c0 1.4.4 2.7 1 3.9L2 18l4.1-1c1.2.6 2.5 1 3.9 1 4.4 0 8-3.6 8-8s-3.6-8-8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
            )},
          ].map((s,i)=>(
            <div key={i} style={{
              background:"rgba(255,255,255,.03)",
              border:"1px solid rgba(255,255,255,.06)",
              borderRadius:"16px",padding:"20px",
              transition:"all .2s",
            }} className="card-hover">
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
                <div style={{width:"36px",height:"36px",borderRadius:"10px",background:`${s.color}15`,border:`1px solid ${s.color}30`,display:"flex",alignItems:"center",justifyContent:"center",color:s.color}}>
                  {s.icon}
                </div>
              </div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"32px",fontWeight:700,color:"#fff",letterSpacing:"-1px",lineHeight:1,marginBottom:"6px"}}>
                {s.val}
              </div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,.5)",fontWeight:500,marginBottom:"4px"}}>{s.label}</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,.3)"}}>{s.trend}</div>
            </div>
          ))}
        </div>

        {/* SECONDARY STATS */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"32px"}}>
          <div style={{background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:"14px",padding:"16px 20px",display:"flex",alignItems:"center",gap:"14px"}}>
            <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"rgba(248,113,113,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",color:"#F87171",fontWeight:700}}>!</div>
            <div style={{flex:1}}>
              <div style={{fontSize:"20px",fontWeight:700,color:"#F87171",lineHeight:1,marginBottom:"2px"}}>{stats.expired}</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,.5)"}}>Abgelaufene Trials</div>
            </div>
          </div>
          <div style={{background:"rgba(249,115,22,.08)",border:"1px solid rgba(249,115,22,.2)",borderRadius:"14px",padding:"16px 20px",display:"flex",alignItems:"center",gap:"14px"}}>
            <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"rgba(249,115,22,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",color:"#F97316"}}>⏳</div>
            <div style={{flex:1}}>
              <div style={{fontSize:"20px",fontWeight:700,color:"#F97316",lineHeight:1,marginBottom:"2px"}}>{stats.expiringSoon}</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,.5)"}}>Laufen in ≤ 5 Tagen ab</div>
            </div>
          </div>
          <div style={{background:"rgba(129,140,248,.08)",border:"1px solid rgba(129,140,248,.2)",borderRadius:"14px",padding:"16px 20px",display:"flex",alignItems:"center",gap:"14px"}}>
            <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"rgba(129,140,248,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",color:"#818CF8"}}>×</div>
            <div style={{flex:1}}>
              <div style={{fontSize:"20px",fontWeight:700,color:"#818CF8",lineHeight:1,marginBottom:"2px"}}>{stats.noWhatsApp}</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,.5)"}}>Ohne WhatsApp verbunden</div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",gap:"4px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"12px",padding:"4px",marginBottom:"24px",width:"fit-content"}}>
          {[
            {k:"overview",l:"Übersicht"},
            {k:"restaurants",l:`Alle Restaurants`,count:stats.total},
            {k:"numbers",l:`WhatsApp Anfragen`,count:stats.pendingNumbers,highlight:stats.pendingNumbers>0},
          ].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k as "overview"|"restaurants"|"numbers")} style={{
              padding:"8px 18px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:"none",
              background:tab===t.k?"rgba(255,92,53,.15)":"transparent",
              color:tab===t.k?"#FF5C35":"rgba(255,255,255,.5)",
              display:"flex",alignItems:"center",gap:"8px",
            }}>
              {t.l}
              {t.count !== undefined && (
                <span style={{
                  fontSize:"10px",fontWeight:600,padding:"2px 7px",borderRadius:"10px",
                  background: t.highlight ? "#FF5C35" : (tab===t.k?"rgba(255,92,53,.2)":"rgba(255,255,255,.08)"),
                  color: t.highlight ? "#fff" : (tab===t.k?"#FF5C35":"rgba(255,255,255,.5)"),
                }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab==="overview" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"}}>
            
            {/* Trials laufen ab */}
            <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"16px",overflow:"hidden"}}>
              <div style={{padding:"18px 20px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"28px",height:"28px",borderRadius:"8px",background:"rgba(249,115,22,.15)",border:"1px solid rgba(249,115,22,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px"}}>⏳</div>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#FFFAF5"}}>Trials laufen bald ab</div>
                </div>
                <span style={{fontSize:"11px",color:"rgba(255,255,255,.4)",background:"rgba(255,255,255,.05)",padding:"3px 10px",borderRadius:"10px"}}>{restaurants.filter(r=>daysLeft(r)<=5&&daysLeft(r)>0).length} Restaurants</span>
              </div>
              <div style={{padding:"6px"}}>
                {restaurants.filter(r=>daysLeft(r)<=5&&daysLeft(r)>0).length===0 ? (
                  <div style={{padding:"32px",textAlign:"center",color:"rgba(255,255,255,.3)",fontSize:"13px"}}>Keine Trials laufen bald ab</div>
                ) : restaurants.filter(r=>daysLeft(r)<=5&&daysLeft(r)>0).map(r=>(
                  <div key={r.id} className="row-hover" onClick={()=>setSelectedRest(r)} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"10px",cursor:"pointer",transition:"all .15s"}}>
                    <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:600,color:"#FF5C35",flexShrink:0}}>
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"13px",fontWeight:500,color:"#FFFAF5"}}>{r.name}</div>
                      <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.email}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:"15px",fontWeight:700,color:daysLeft(r)<=2?"#F87171":"#F97316",fontFamily:"'Playfair Display',serif"}}>{daysLeft(r)}</div>
                      <div style={{fontSize:"10px",color:"rgba(255,255,255,.4)"}}>Tage</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Anfragen */}
            <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"16px",overflow:"hidden"}}>
              <div style={{padding:"18px 20px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"28px",height:"28px",borderRadius:"8px",background:"rgba(37,211,102,.15)",border:"1px solid rgba(37,211,102,.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5C4 1.5 1.5 4 1.5 7c0 1 .3 1.9.7 2.7l-.7 3.3 3.4-.7c.8.4 1.7.7 2.6.7 3 0 5.5-2.5 5.5-5.5S10 1.5 7 1.5z" fill="#25D366"/></svg>
                  </div>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#FFFAF5"}}>Offene Nummern-Anfragen</div>
                </div>
                {stats.pendingNumbers > 0 && (
                  <span style={{fontSize:"11px",color:"#fff",background:"#FF5C35",padding:"3px 10px",borderRadius:"10px",fontWeight:600}}>{stats.pendingNumbers} offen</span>
                )}
              </div>
              <div style={{padding:"6px"}}>
                {numberRequests.filter(r=>r.status==="pending").length===0 ? (
                  <div style={{padding:"32px",textAlign:"center",color:"rgba(255,255,255,.3)",fontSize:"13px"}}>Keine offenen Anfragen</div>
                ) : numberRequests.filter(r=>r.status==="pending").map(r=>(
                  <div key={r.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"10px"}}>
                    <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(37,211,102,.15)",border:"1px solid rgba(37,211,102,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:600,color:"#25D366",flexShrink:0}}>
                      {r.restaurant_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"13px",fontWeight:500,color:"#FFFAF5"}}>{r.restaurant_name}</div>
                      <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.email}</div>
                    </div>
                    <button onClick={()=>updateNumberRequest(r.id,"done")} style={{
                      background:"#25D366",border:"none",color:"#fff",padding:"6px 14px",borderRadius:"8px",
                      fontSize:"11px",cursor:"pointer",fontFamily:"inherit",fontWeight:600,
                      whiteSpace:"nowrap",flexShrink:0,
                    }}>✓ Erledigt</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Neueste Registrierungen */}
            <div style={{gridColumn:"1/-1",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"16px",overflow:"hidden"}}>
              <div style={{padding:"18px 20px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"28px",height:"28px",borderRadius:"8px",background:"rgba(129,140,248,.15)",border:"1px solid rgba(129,140,248,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px"}}>★</div>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#FFFAF5"}}>Letzte Registrierungen</div>
                </div>
                <button onClick={()=>setTab("restaurants")} style={{fontSize:"11px",color:"#FF5C35",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>Alle anzeigen →</button>
              </div>
              <div style={{padding:"6px"}}>
                {restaurants.slice(0,5).map(r=>(
                  <div key={r.id} className="row-hover" onClick={()=>setSelectedRest(r)} style={{display:"flex",alignItems:"center",gap:"14px",padding:"14px 16px",borderRadius:"10px",cursor:"pointer",transition:"all .15s"}}>
                    <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:600,color:"#FF5C35",flexShrink:0}}>
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"14px",fontWeight:500,color:"#FFFAF5",marginBottom:"2px"}}>{r.name}</div>
                      <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)"}}>{r.email}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",flexShrink:0}}>
                      <div style={{fontSize:"10px",fontWeight:600,padding:"4px 10px",borderRadius:"6px",
                        background:r.plan==="trial"?"rgba(251,191,36,.12)":"rgba(52,211,153,.12)",
                        color:r.plan==="trial"?"#FCD34D":"#34D399",
                        border:`1px solid ${r.plan==="trial"?"rgba(251,191,36,.2)":"rgba(52,211,153,.2)"}`,
                      }}>
                        {r.plan==="trial"?`Trial · ${daysLeft(r)}d`:"Aktiv"}
                      </div>
                      <div style={{fontSize:"11px",color:r.whatsapp_phone_id?"#25D366":"rgba(255,255,255,.25)"}}>
                        {r.whatsapp_phone_id?"WA ✓":"WA ✗"}
                      </div>
                      <div style={{fontSize:"11px",color:"rgba(255,255,255,.3)"}}>
                        {new Date(r.created_at).toLocaleDateString("de-AT",{day:"numeric",month:"short"})}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* RESTAURANTS TAB */}
        {tab==="restaurants" && (
          <>
            {/* Filter Bar */}
            <div style={{display:"flex",gap:"12px",marginBottom:"16px",flexWrap:"wrap"}}>
              <div style={{position:"relative",flex:1,minWidth:"240px"}}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)"}}><circle cx="6" cy="6" r="4.5" stroke="rgba(255,255,255,.3)" strokeWidth="1.3"/><path d="M9.5 9.5l3 3" stroke="rgba(255,255,255,.3)" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <input
                  value={search}
                  onChange={e=>setSearch(e.target.value)}
                  placeholder="Suche nach Name, E-Mail oder Telefon..."
                  style={{
                    width:"100%",padding:"10px 14px 10px 34px",
                    background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",
                    borderRadius:"10px",color:"#fff",fontSize:"13px",fontFamily:"inherit",
                  }}
                />
              </div>
              <div style={{display:"flex",gap:"4px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"10px",padding:"3px"}}>
                {[
                  {k:"all",l:"Alle",c:stats.total},
                  {k:"trial",l:"Trial",c:stats.trial},
                  {k:"active",l:"Aktiv",c:stats.active},
                  {k:"expired",l:"Abgelaufen",c:stats.expired},
                ].map(f=>(
                  <button key={f.k} onClick={()=>setFilterPlan(f.k as "all"|"trial"|"active"|"expired")} style={{
                    padding:"7px 14px",borderRadius:"7px",fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:"none",
                    background:filterPlan===f.k?"rgba(255,92,53,.15)":"transparent",
                    color:filterPlan===f.k?"#FF5C35":"rgba(255,255,255,.5)",
                    display:"flex",alignItems:"center",gap:"6px",
                  }}>
                    {f.l} <span style={{fontSize:"10px",opacity:.6}}>({f.c})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Restaurant Cards Grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))",gap:"14px"}}>
              {filtered.length === 0 ? (
                <div style={{gridColumn:"1/-1",padding:"60px",textAlign:"center",color:"rgba(255,255,255,.3)",fontSize:"14px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"16px"}}>
                  Keine Restaurants gefunden
                </div>
              ) : filtered.map(r=>{
                const days = daysLeft(r);
                const isExpiring = days<=5 && days>0;
                const isExpired = days===0 && r.plan==="trial";
                return (
                  <div key={r.id} onClick={()=>setSelectedRest(r)} className="card-hover" style={{
                    background:"rgba(255,255,255,.03)",
                    border:`1px solid ${r.is_blocked?"rgba(239,68,68,.3)":isExpired?"rgba(248,113,113,.2)":isExpiring?"rgba(249,115,22,.2)":"rgba(255,255,255,.06)"}`,
                    borderRadius:"14px",padding:"18px",cursor:"pointer",transition:"all .2s",
                  }}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:"12px",marginBottom:"14px"}}>
                      <div style={{width:"44px",height:"44px",borderRadius:"50%",background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",fontWeight:600,color:"#FF5C35",flexShrink:0}}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:"15px",fontWeight:600,color:"#FFFAF5",marginBottom:"3px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                        <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.email}</div>
                      </div>
                      {r.is_blocked && (
                        <div style={{fontSize:"9px",fontWeight:700,padding:"2px 8px",borderRadius:"5px",background:"rgba(239,68,68,.15)",color:"#F87171",border:"1px solid rgba(239,68,68,.25)",textTransform:"uppercase",letterSpacing:".5px",flexShrink:0}}>Gesperrt</div>
                      )}
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px"}}>
                      <div style={{padding:"8px 10px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)",borderRadius:"8px"}}>
                        <div style={{fontSize:"9px",color:"rgba(255,255,255,.4)",fontWeight:500,marginBottom:"2px",textTransform:"uppercase",letterSpacing:".3px"}}>Plan</div>
                        <div style={{fontSize:"12px",fontWeight:600,color:r.plan==="trial"?"#FCD34D":"#34D399"}}>
                          {r.plan==="trial"?`Trial · ${days}d`:"Aktiv"}
                        </div>
                      </div>
                      <div style={{padding:"8px 10px",background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)",borderRadius:"8px"}}>
                        <div style={{fontSize:"9px",color:"rgba(255,255,255,.4)",fontWeight:500,marginBottom:"2px",textTransform:"uppercase",letterSpacing:".3px"}}>WhatsApp</div>
                        <div style={{fontSize:"12px",fontWeight:600,color:r.whatsapp_phone_id?"#25D366":"rgba(255,255,255,.3)"}}>
                          {r.whatsapp_phone_id?"Verbunden":"Nicht verbunden"}
                        </div>
                      </div>
                    </div>

                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:"11px",color:"rgba(255,255,255,.3)"}}>
                      <div>Seit {new Date(r.created_at).toLocaleDateString("de-AT",{day:"numeric",month:"short",year:"numeric"})}</div>
                      <button onClick={e=>{e.stopPropagation();toggleBlock(r.id,r.is_blocked);}} style={{
                        padding:"5px 12px",borderRadius:"6px",fontSize:"11px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:"1px solid",
                        background:r.is_blocked?"rgba(52,211,153,.1)":"rgba(239,68,68,.08)",
                        color:r.is_blocked?"#34D399":"#F87171",
                        borderColor:r.is_blocked?"rgba(52,211,153,.25)":"rgba(239,68,68,.2)",
                      }}>
                        {r.is_blocked?"Entsperren":"Sperren"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* NUMBERS TAB */}
        {tab==="numbers" && (
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"14px",overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.02)",display:"grid",gridTemplateColumns:"1fr 200px 110px 160px",gap:"12px"}}>
              {["Restaurant","E-Mail","Datum","Status"].map((h,i)=>(
                <div key={i} style={{fontSize:"10px",fontWeight:600,color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:".7px"}}>{h}</div>
              ))}
            </div>
            {numberRequests.length===0 ? (
              <div style={{padding:"60px",textAlign:"center",color:"rgba(255,255,255,.3)",fontSize:"14px"}}>Noch keine Anfragen</div>
            ) : numberRequests.map((r,i)=>(
              <div key={r.id} className="row-hover" style={{display:"grid",gridTemplateColumns:"1fr 200px 110px 160px",gap:"12px",padding:"14px 20px",borderBottom:i<numberRequests.length-1?"1px solid rgba(255,255,255,.06)":"none",alignItems:"center",transition:"all .15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"rgba(37,211,102,.15)",border:"1px solid rgba(37,211,102,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:600,color:"#25D366",flexShrink:0}}>
                    {r.restaurant_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{fontSize:"13px",fontWeight:500,color:"#FFFAF5"}}>{r.restaurant_name}</div>
                </div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,.5)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.email}</div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)"}}>{new Date(r.created_at).toLocaleDateString("de-AT")}</div>
                <select value={r.status} onChange={e=>updateNumberRequest(r.id,e.target.value)} style={{
                  fontSize:"11px",fontWeight:600,padding:"6px 10px",borderRadius:"8px",cursor:"pointer",fontFamily:"inherit",outline:"none",
                  background:r.status==="pending"?"rgba(251,191,36,.12)":r.status==="done"?"rgba(52,211,153,.12)":"rgba(99,102,241,.12)",
                  color:r.status==="pending"?"#FCD34D":r.status==="done"?"#34D399":"#818CF8",
                  border:`1px solid ${r.status==="pending"?"rgba(251,191,36,.25)":r.status==="done"?"rgba(52,211,153,.25)":"rgba(99,102,241,.25)"}`,
                }}>
                  <option value="pending">◐ Ausstehend</option>
                  <option value="in_progress">⟳ In Bearbeitung</option>
                  <option value="done">✓ Erledigt</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESTAURANT DETAIL MODAL */}
      {selectedRest && (
        <div onClick={e=>{if(e.target===e.currentTarget)setSelectedRest(null);}} style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(8px)",
          display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"24px",
        }}>
          <div style={{
            background:"#13131F",border:"1px solid rgba(255,255,255,.08)",
            borderRadius:"20px",padding:"32px",width:"100%",maxWidth:"560px",
            boxShadow:"0 40px 80px rgba(0,0,0,.5)",
          }}>
            <div style={{display:"flex",alignItems:"flex-start",gap:"14px",marginBottom:"24px"}}>
              <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"rgba(255,92,53,.15)",border:"1px solid rgba(255,92,53,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",fontWeight:600,color:"#FF5C35",flexShrink:0,fontFamily:"'Playfair Display',serif"}}>
                {selectedRest.name.charAt(0).toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",fontWeight:700,color:"#FFFAF5",marginBottom:"4px",letterSpacing:"-.3px"}}>{selectedRest.name}</h3>
                <p style={{fontSize:"12px",color:"rgba(255,255,255,.4)"}}>{selectedRest.email}</p>
              </div>
              <button onClick={()=>setSelectedRest(null)} style={{background:"transparent",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:"22px",lineHeight:1}}>×</button>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"20px"}}>
              {[
                {l:"Plan",v:selectedRest.plan==="trial"?`Trial · ${daysLeft(selectedRest)}d`:"Aktiv",c:selectedRest.plan==="trial"?"#FCD34D":"#34D399"},
                {l:"WhatsApp",v:selectedRest.whatsapp_phone_id?"Verbunden":"Nicht verbunden",c:selectedRest.whatsapp_phone_id?"#25D366":"rgba(255,255,255,.5)"},
                {l:"Telefon",v:selectedRest.phone || "—",c:"#FFFAF5"},
                {l:"Registriert",v:new Date(selectedRest.created_at).toLocaleDateString("de-AT"),c:"#FFFAF5"},
              ].map((item,i)=>(
                <div key={i} style={{padding:"12px 14px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"10px"}}>
                  <div style={{fontSize:"10px",color:"rgba(255,255,255,.4)",fontWeight:600,textTransform:"uppercase",letterSpacing:".5px",marginBottom:"4px"}}>{item.l}</div>
                  <div style={{fontSize:"13px",fontWeight:500,color:item.c}}>{item.v}</div>
                </div>
              ))}
            </div>

            {selectedRest.address && (
              <div style={{padding:"12px 14px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"10px",marginBottom:"20px"}}>
                <div style={{fontSize:"10px",color:"rgba(255,255,255,.4)",fontWeight:600,textTransform:"uppercase",letterSpacing:".5px",marginBottom:"4px"}}>Adresse</div>
                <div style={{fontSize:"13px",color:"#FFFAF5"}}>{selectedRest.address}</div>
              </div>
            )}

            <div style={{display:"flex",gap:"8px"}}>
              {selectedRest.slug && (
                <a href={`/book/${selectedRest.slug}`} target="_blank" rel="noopener noreferrer" style={{
                  flex:1,padding:"11px",borderRadius:"10px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",
                  color:"rgba(255,255,255,.7)",fontSize:"13px",fontWeight:500,fontFamily:"inherit",
                  textAlign:"center",textDecoration:"none",
                }}>Booking Page öffnen</a>
              )}
              <button onClick={()=>toggleBlock(selectedRest.id,selectedRest.is_blocked)} style={{
                flex:1,padding:"11px",borderRadius:"10px",border:"1px solid",cursor:"pointer",fontFamily:"inherit",
                background:selectedRest.is_blocked?"rgba(52,211,153,.1)":"rgba(239,68,68,.1)",
                color:selectedRest.is_blocked?"#34D399":"#F87171",
                borderColor:selectedRest.is_blocked?"rgba(52,211,153,.25)":"rgba(239,68,68,.25)",
                fontSize:"13px",fontWeight:600,
              }}>
                {selectedRest.is_blocked?"Entsperren":"Restaurant sperren"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}