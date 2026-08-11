"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function FeedbackPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reservationId = params.id as string;
  const initialRating = parseInt(searchParams.get("rating") || "3");
  
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    loadData();
  }, [reservationId]);

  async function loadData() {
    const supabase = createClient();
    setLoadError("");

    const { data: res, error: resErr } = await supabase
      .from("reservations")
      .select("guest_name, restaurant_id")
      .eq("id", reservationId)
      .single();
    // PGRST116 = kein Treffer: der Link ist ungueltig. Alles andere ist eine Stoerung.
    if (resErr && resErr.code !== "PGRST116") {
      console.error("Reservierung laden fehlgeschlagen:", resErr);
      setLoadError("Wir konnten deine Reservierung gerade nicht laden. Bitte versuche es in einem Moment nochmal.");
      setLoading(false);
      return;
    }
    if (!res) {
      setLoadError("Dieser Feedback-Link ist leider nicht mehr gültig.");
      setLoading(false);
      return;
    }

    setGuestName(res.guest_name);
    const { data: rest, error: restErr } = await supabase
      .from("restaurants")
      .select("name")
      .eq("id", res.restaurant_id)
      .single();
    // Der Restaurantname ist nur Deko — ein Fehler darf das Feedback nicht blockieren.
    if (restErr) console.error("Restaurantname laden fehlgeschlagen:", restErr);
    if (rest) setRestaurantName(rest.name);
    setLoading(false);
  }

  async function submitFeedback() {
    setSubmitting(true);
    setSubmitError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("reservations")
      .update({
        feedback_rating: rating,
        feedback_comment: comment || null,
        feedback_submitted_at: new Date().toISOString(),
      })
      .eq("id", reservationId);
    if (error) {
      console.error("Feedback speichern fehlgeschlagen:", error);
      setSubmitError("Dein Feedback konnte nicht gesendet werden. Bitte versuche es nochmal — dein Text bleibt erhalten.");
      setSubmitting(false);
      return;
    }
    setSuccess(true);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div style={{minHeight:"100vh",background:"#F5F0EB",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{color:"#6B6B80",fontFamily:"var(--font-sans)"}}>Laden...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{minHeight:"100vh",background:"#F5F0EB",fontFamily:"var(--font-sans)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
        <div style={{maxWidth:"420px",width:"100%",background:"#fff",borderRadius:"20px",padding:"36px 28px",border:"1px solid #F0EBE3",textAlign:"center"}}>
          <div style={{width:"52px",height:"52px",borderRadius:"50%",background:"#FEE8E8",border:"1px solid rgba(226,75,74,.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke="#E24B4A" strokeWidth="1.6"/><path d="M11 6.5v5.5M11 15v.5" stroke="#E24B4A" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"#1A1A2E",marginBottom:"10px"}}>Feedback nicht möglich</h2>
          <p style={{fontSize:"14px",color:"#6B6B80",lineHeight:1.6,marginBottom:"20px"}}>{loadError}</p>
          <button onClick={() => { setLoading(true); loadData(); }} style={{
            padding:"11px 24px",borderRadius:"10px",background:"#FF5C35",border:"none",color:"#fff",
            fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
          }}>Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#F5F0EB",fontFamily:"var(--font-sans)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        textarea:focus{border-color:#FF5C35!important;outline:none;}
      `}</style>
      <div style={{maxWidth:"480px",width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:"24px"}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,color:"#1A1A2E"}}>
            <img src="/butlery-logo-dunkel.png" alt="Butlery" style={{height:"24px",width:"auto",display:"inline-block",verticalAlign:"middle"}}/>
          </span>
        </div>

        <div style={{background:"#fff",borderRadius:"20px",padding:"36px 28px",border:"1px solid #F0EBE3",boxShadow:"0 4px 20px rgba(0,0,0,0.04)"}}>
          {!success ? (
            <>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#1A1A2E",marginBottom:"8px",textAlign:"center"}}>
                Danke für dein Feedback
              </h1>
              <p style={{fontSize:"14px",color:"#6B6B80",textAlign:"center",marginBottom:"24px",lineHeight:1.6,fontWeight:300}}>
                Hallo {guestName}, was hätten wir bei <strong style={{color:"#1A1A2E"}}>{restaurantName}</strong> besser machen können?
              </p>

              <div style={{textAlign:"center",marginBottom:"24px",padding:"20px",background:"#FFF0EB",borderRadius:"14px",border:"1px solid rgba(255,92,53,0.15)"}}>
                <div style={{fontSize:"12px",color:"#6B6B80",marginBottom:"10px"}}>Deine Bewertung</div>
                <div style={{display:"flex",justifyContent:"center",gap:"6px"}}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRating(n)} style={{
                      background:"transparent",border:"none",cursor:"pointer",fontSize:"32px",
                      opacity: n <= rating ? 1 : 0.25,
                      transition:"opacity .15s",
                    }}>⭐</button>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:"20px"}}>
                <label style={{fontSize:"12px",fontWeight:600,color:"#6B6B80",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"8px"}}>
                  Was können wir besser machen?
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Erzähl uns ehrlich was nicht gepasst hat. Dein Feedback bleibt zwischen uns und hilft uns besser zu werden."
                  rows={5}
                  style={{
                    width:"100%",padding:"12px 14px",border:"1px solid #EDE8E3",borderRadius:"10px",
                    fontSize:"14px",fontFamily:"inherit",color:"#1A1A2E",resize:"vertical",
                    background:"#F9F9F8",lineHeight:1.5,
                  }}
                />
              </div>

              {submitError && (
                <div style={{background:"#FEE8E8",border:"1px solid rgba(226,75,74,0.25)",borderRadius:"10px",padding:"10px 14px",fontSize:"13px",color:"#B3312F",marginBottom:"14px",lineHeight:1.5}}>
                  {submitError}
                </div>
              )}

              <button onClick={submitFeedback} disabled={submitting} style={{
                width:"100%",padding:"13px",borderRadius:"10px",background:"#FF5C35",border:"none",
                color:"#fff",fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                opacity:submitting?0.7:1,
              }}>
                {submitting ? "Wird gesendet..." : "Feedback senden"}
              </button>

              <p style={{fontSize:"11px",color:"#6B6B80",textAlign:"center",marginTop:"14px",lineHeight:1.5}}>
                Dein Feedback geht nur ans Restaurant — nicht öffentlich.
              </p>
            </>
          ) : (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"48px",marginBottom:"16px"}}>🙏</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"24px",fontWeight:700,color:"#1A1A2E",marginBottom:"10px"}}>
                Vielen Dank!
              </h2>
              <p style={{fontSize:"14px",color:"#6B6B80",lineHeight:1.6,fontWeight:300}}>
                Dein Feedback wurde an {restaurantName} weitergeleitet. Wir werden alles tun um es beim nächsten Mal besser zu machen.
              </p>
            </div>
          )}
        </div>

        <div style={{textAlign:"center",marginTop:"20px",fontSize:"11px",color:"#6B6B80"}}>
          Powered by <strong>Butlery</strong>
        </div>
      </div>
    </div>
  );
}