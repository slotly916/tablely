"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

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

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/dashboard");
        return;
      }
      const { data: rests } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false });
      setRestaurants(rests || []);
      const { data: reqs } = await supabase.from("number_requests").select("*").order("created_at", { ascending: false });
      setNumberRequests(reqs || []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function toggleBlock(id: string, blocked: boolean) {
    const supabase = createClient();
    await supabase.from("restaurants").update({ is_blocked: !blocked }).eq("id", id);
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, is_blocked: !blocked } : r));
  }

  async function updateNumberRequest(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("number_requests").update({ status }).eq("id", id);
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

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0F0F14"}}>
      <div style={{color:"rgba(255,255,255,.4)",fontSize:"14px"}}>Wird geladen...</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0F0F14",fontFamily:"'DM Sans',sans-serif",color:"#FFFAF5"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}select{appearance:none;}`}</style>

      <header style={{borderBottom:"1px solid rgba(255,255,255,.08)",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700}}>table<span style={{color:"#FF5C35"}}>ly</span></div>
          <span style={{fontSize:"11px",background:"rgba(255,92,53,.15)",color:"#FF5C35",border:"1px solid rgba(255,92,53,.2)",padding:"2px 10px",borderRadius:"20px",fontWeight:600}}>Admin</span>
        </div>
        <button onClick={()=>router.push("/dashboard")} style={{background:"transparent",border:"1px solid rgba(255,255,255,.1)",color:"rgba(255,255,255,.4)",padding:"7px 14px",borderRadius:"7px",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>→ Dashboard</button>
      </header>

      <div style={{padding:"32px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"10px",marginBottom:"32px"}}>
          {[
            {l:"Gesamt",v:stats.total,c:"#FF5C35"},
            {l:"Im Test",v:stats.trial,c:"#FCD34D"},
            {l:"Bezahlt",v:stats.active,c:"#34D399"},
            {l:"Läuft ab",v:stats.expiringSoon,c:"#F97316"},
            {l:"Abgelaufen",v:stats.expired,c:"#F87171"},
            {l:"Nummern",v:stats.pendingNumbers,c:"#25D366"},
            {l:"Ohne WA",v:stats.noWhatsApp,c:"#818CF8"},
          ].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"12px",padding:"16px",textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,color:s.c,marginBottom:"4px"}}>{s.v}</div>
              <div style={{fontSize:"10px",color:"rgba(255,255,255,.3)"}}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:"4px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"10px",padding:"3px",marginBottom:"24px",width:"fit-content"}}>
          {[{k:"overview",l:"Übersicht"},{k:"restaurants",l:`Restaurants (${stats.total})`},{k:"numbers",l:`Nummern (${stats.pendingNumbers})`}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k as "overview"|"restaurants"|"numbers")} style={{padding:"7px 18px",borderRadius:"8px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:"none",background:tab===t.k?"rgba(255,255,255,.1)":"transparent",color:tab===t.k?"#FFFAF5":"rgba(255,255,255,.4)"}}>{t.l}</button>
          ))}
        </div>

        {tab==="overview" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"}}>
            <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"14px",padding:"20px"}}>
              <div style={{fontSize:"12px",fontWeight:600,color:"#F97316",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"14px"}}>⚠ Läuft bald ab</div>
              {restaurants.filter(r=>daysLeft(r)<=5&&daysLeft(r)>0).length===0
                ? <div style={{fontSize:"13px",color:"rgba(255,255,255,.3)"}}>Keine</div>
                : restaurants.filter(r=>daysLeft(r)<=5&&daysLeft(r)>0).map(r=>(
                  <div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.06)",fontSize:"13px"}}>
                    <div><div style={{fontWeight:500}}>{r.name}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,.3)"}}>{r.email}</div></div>
                    <div style={{color:"#F97316",fontWeight:600}}>{daysLeft(r)}d</div>
                  </div>
                ))
              }
            </div>
            <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"14px",padding:"20px"}}>
              <div style={{fontSize:"12px",fontWeight:600,color:"#25D366",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"14px"}}>📱 Nummern Anfragen</div>
              {numberRequests.filter(r=>r.status==="pending").length===0
                ? <div style={{fontSize:"13px",color:"rgba(255,255,255,.3)"}}>Keine offenen Anfragen</div>
                : numberRequests.filter(r=>r.status==="pending").map(r=>(
                  <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                    <div><div style={{fontSize:"13px",fontWeight:500}}>{r.restaurant_name}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,.3)"}}>{r.email}</div></div>
                    <button onClick={()=>updateNumberRequest(r.id,"done")} style={{background:"rgba(37,211,102,.15)",border:"1px solid rgba(37,211,102,.25)",color:"#25D366",padding:"4px 10px",borderRadius:"6px",fontSize:"11px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Erledigt</button>
                  </div>
                ))
              }
            </div>
            <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"14px",padding:"20px",gridColumn:"1/-1"}}>
              <div style={{fontSize:"12px",fontWeight:600,color:"#818CF8",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"14px"}}>🆕 Letzte Registrierungen</div>
              {restaurants.slice(0,5).map((r,i)=>(
                <div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr 120px 100px 80px",gap:"12px",padding:"10px 0",borderBottom:i<4?"1px solid rgba(255,255,255,.06)":"none",alignItems:"center",fontSize:"13px"}}>
                  <div><div style={{fontWeight:500}}>{r.name}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,.3)"}}>{r.email}</div></div>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,.3)"}}>{new Date(r.created_at).toLocaleDateString("de-AT")}</div>
                  <div style={{fontSize:"10px",fontWeight:600,padding:"3px 8px",borderRadius:"5px",width:"fit-content",background:r.plan==="trial"?"rgba(251,191,36,.12)":"rgba(52,211,153,.12)",color:r.plan==="trial"?"#FCD34D":"#34D399"}}>{r.plan==="trial"?`Trial ${daysLeft(r)}d`:"Aktiv"}</div>
                  <div style={{fontSize:"11px",color:r.whatsapp_phone_id?"#25D366":"rgba(255,255,255,.2)"}}>{r.whatsapp_phone_id?"✓ WA":"✗ WA"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="restaurants" && (
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"14px",overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 160px 90px 70px 70px 100px",gap:"12px",padding:"10px 20px",borderBottom:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.02)"}}>
              {["Restaurant","E-Mail","Plan","Trial","WA","Aktion"].map((h,i)=>(
                <div key={i} style={{fontSize:"10px",fontWeight:600,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:".7px"}}>{h}</div>
              ))}
            </div>
            {restaurants.map((r,i)=>(
              <div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr 160px 90px 70px 70px 100px",gap:"12px",padding:"12px 20px",borderBottom:i<restaurants.length-1?"1px solid rgba(255,255,255,.06)":"none",alignItems:"center",fontSize:"13px"}}>
                <div><div style={{fontWeight:500}}>{r.name}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,.3)"}}>{new Date(r.created_at).toLocaleDateString("de-AT")}</div></div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.email}</div>
                <div style={{fontSize:"10px",fontWeight:600,padding:"3px 8px",borderRadius:"5px",width:"fit-content",background:r.plan==="trial"?"rgba(251,191,36,.12)":"rgba(52,211,153,.12)",color:r.plan==="trial"?"#FCD34D":"#34D399"}}>{r.plan}</div>
                <div style={{fontSize:"12px",color:daysLeft(r)<=5?"#F87171":"rgba(255,255,255,.4)"}}>{daysLeft(r)}d</div>
                <div style={{fontSize:"11px",color:r.whatsapp_phone_id?"#25D366":"rgba(255,255,255,.2)"}}>{r.whatsapp_phone_id?"✓":"✗"}</div>
                <button onClick={()=>toggleBlock(r.id,r.is_blocked)} style={{padding:"4px 10px",borderRadius:"6px",fontSize:"11px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:"1px solid",background:r.is_blocked?"rgba(52,211,153,.1)":"rgba(239,68,68,.1)",color:r.is_blocked?"#34D399":"#F87171",borderColor:r.is_blocked?"rgba(52,211,153,.2)":"rgba(239,68,68,.2)"}}>
                  {r.is_blocked?"Entsperren":"Sperren"}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab==="numbers" && (
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"14px",overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 180px 100px 140px",gap:"12px",padding:"10px 20px",borderBottom:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.02)"}}>
              {["Restaurant","E-Mail","Datum","Status"].map((h,i)=>(
                <div key={i} style={{fontSize:"10px",fontWeight:600,color:"rgba(255,255,255,.3)",textTransform:"uppercase",letterSpacing:".7px"}}>{h}</div>
              ))}
            </div>
            {numberRequests.length===0
              ? <div style={{padding:"48px",textAlign:"center",color:"rgba(255,255,255,.3)",fontSize:"14px"}}>Noch keine Anfragen</div>
              : numberRequests.map((r,i)=>(
                <div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr 180px 100px 140px",gap:"12px",padding:"12px 20px",borderBottom:i<numberRequests.length-1?"1px solid rgba(255,255,255,.06)":"none",alignItems:"center",fontSize:"13px"}}>
                  <div style={{fontWeight:500}}>{r.restaurant_name}</div>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,.4)"}}>{r.email}</div>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,.3)"}}>{new Date(r.created_at).toLocaleDateString("de-AT")}</div>
                  <select value={r.status} onChange={e=>updateNumberRequest(r.id,e.target.value)} style={{fontSize:"11px",fontWeight:600,padding:"4px 8px",borderRadius:"6px",cursor:"pointer",fontFamily:"inherit",outline:"none",background:r.status==="pending"?"rgba(251,191,36,.12)":r.status==="done"?"rgba(52,211,153,.12)":"rgba(99,102,241,.12)",color:r.status==="pending"?"#FCD34D":r.status==="done"?"#34D399":"#818CF8",border:`1px solid ${r.status==="pending"?"rgba(251,191,36,.25)":r.status==="done"?"rgba(52,211,153,.25)":"rgba(99,102,241,.25)"}`}}>
                    <option value="pending">◐ Ausstehend</option>
                    <option value="in_progress">⟳ In Bearbeitung</option>
                    <option value="done">✓ Erledigt</option>
                  </select>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}