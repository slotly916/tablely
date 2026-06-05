"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PLANS = [
  { id: "standard", name: "Standard", price: 99, tagline: "Für kleine Restaurants", features: ["Online Buchungsseite", "Dashboard", "E-Mail Erinnerungen", "Walk-in Assistent"] },
  { id: "plus", name: "Plus", price: 129, tagline: "Die meisten wählen Plus", popular: true, features: ["Alles aus Standard", "WhatsApp KI", "Automatische Erinnerungen", "Bis zu 60% weniger No-Shows", "Eigene WhatsApp Nummer"] },
  { id: "premium", name: "Premium", price: 249, tagline: "Maximaler Komfort", features: ["Alles aus Plus", "KI Telefon (bald)", "Prioritäts-Support", "Persönliches Onboarding"] },
];

function CheckoutForm({ plan, onBack }: { plan: typeof PLANS[0]; onBack: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleSubmit() {
    if (!stripe || !elements) return;
    setProcessing(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Bitte prüfe deine Eingaben.");
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?paid=1`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || "Zahlung fehlgeschlagen.");
      setProcessing(false);
    }
    // Bei Erfolg leitet Stripe automatisch zu return_url weiter
  }

  return (
    <div>
      <div style={{background:"#FFF0EB",border:"1px solid rgba(255,92,53,.15)",borderRadius:"12px",padding:"16px 20px",marginBottom:"24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:"13px",color:"#6B6B80",marginBottom:"2px"}}>Gewählter Plan</div>
          <div style={{fontSize:"16px",fontWeight:600,color:"#1A1A2E"}}>{plan.name}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:"24px",fontWeight:700,color:"#FF5C35",fontFamily:"'Playfair Display',serif"}}>{plan.price}€</div>
          <div style={{fontSize:"12px",color:"#6B6B80"}}>pro Monat</div>
        </div>
      </div>

      <div style={{marginBottom:"20px"}}>
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && <p style={{color:"#E24B4A",fontSize:"13px",marginBottom:"14px"}}>{error}</p>}

      <button onClick={handleSubmit} disabled={!stripe || processing} style={{
        width:"100%",background:"#FF5C35",color:"#fff",border:"none",padding:"15px",
        borderRadius:"12px",fontSize:"15px",fontWeight:600,cursor:processing?"default":"pointer",
        fontFamily:"inherit",opacity:processing?0.7:1,marginBottom:"12px",
      }}>
        {processing ? "Wird verarbeitet..." : `Jetzt ${plan.price}€/Monat zahlen`}
      </button>

      <button onClick={onBack} disabled={processing} style={{
        width:"100%",background:"transparent",color:"#6B6B80",border:"none",
        padding:"8px",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",
      }}>
        ← Anderen Plan wählen
      </button>

      <p style={{fontSize:"11px",color:"#6B6B80",textAlign:"center",lineHeight:1.6,marginTop:"16px"}}>
        Sichere Zahlung über Stripe. Jederzeit kündbar.
      </p>
    </div>
  );
}

export default function UpgradePage() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<{id:string;name:string;email:string} | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: rest } = await supabase.from("restaurants").select("id, name, email").eq("email", user.email).single();
      if (rest) setRestaurant(rest);
    }
    load();
  }, [router]);

  async function choosePlan(plan: typeof PLANS[0]) {
    if (!restaurant) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: restaurant.id, email: restaurant.email, plan: plan.id }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setClientSecret(data.clientSecret);
      setSelectedPlan(plan);
      setLoading(false);
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:"100vh",background:"#F0EBE3",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>

      <div style={{width:"100%",maxWidth: selectedPlan ? "480px" : "1000px"}}>

        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"28px",fontWeight:700,color:"#1A1A2E",marginBottom:"10px"}}>
            table<span style={{color:"#FF5C35",fontStyle:"italic"}}>ly</span>
          </div>
          {!selectedPlan ? (
            <>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,4vw,36px)",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1px",marginBottom:"10px"}}>
                Deine Testphase ist vorbei
              </h1>
              <p style={{fontSize:"15px",color:"#6B6B80",fontWeight:300,maxWidth:"480px",margin:"0 auto",lineHeight:1.6}}>
                Wähle einen Plan um Tablely weiter zu nutzen. Alle deine Daten und Einstellungen bleiben erhalten.
              </p>
            </>
          ) : (
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"26px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1px"}}>
              Zahlung abschließen
            </h1>
          )}
        </div>

        {error && (
          <div style={{background:"#FEE8E8",border:"1px solid rgba(226,75,74,.2)",borderRadius:"10px",padding:"12px 16px",marginBottom:"20px",color:"#E24B4A",fontSize:"13px",textAlign:"center"}}>
            {error}
          </div>
        )}

        {!selectedPlan ? (
          // PLAN AUSWAHL
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:"20px"}}>
            {PLANS.map(plan => (
              <div key={plan.id} style={{
                background:"#FFFAF5",
                border: plan.popular ? "2px solid #FF5C35" : "1px solid #EDE8E3",
                borderRadius:"20px",padding:"28px",position:"relative",
                boxShadow: plan.popular ? "0 20px 40px rgba(255,92,53,.15)" : "0 8px 24px rgba(26,26,46,.06)",
              }}>
                {plan.popular && (
                  <div style={{position:"absolute",top:"-12px",left:"50%",transform:"translateX(-50%)",background:"#FF5C35",color:"#fff",fontSize:"11px",fontWeight:600,padding:"4px 14px",borderRadius:"20px",whiteSpace:"nowrap"}}>
                    {plan.tagline}
                  </div>
                )}
                <div style={{fontSize:"13px",fontWeight:600,color:"#6B6B80",marginBottom:"8px"}}>{plan.name}</div>
                {!plan.popular && <div style={{fontSize:"12px",color:"#6B6B80",marginBottom:"12px"}}>{plan.tagline}</div>}
                <div style={{display:"flex",alignItems:"baseline",gap:"4px",marginBottom:"20px"}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:"40px",fontWeight:700,color:"#1A1A2E",letterSpacing:"-1.5px"}}>{plan.price}€</span>
                  <span style={{fontSize:"14px",color:"#6B6B80"}}>/Monat</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"24px"}}>
                  {plan.features.map((f,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"8px"}}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0,marginTop:"2px"}}><path d="M3 8l3 3 7-7" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span style={{fontSize:"13px",color:"#1A1A2E",lineHeight:1.4}}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={()=>choosePlan(plan)} disabled={loading} style={{
                  width:"100%",
                  background: plan.popular ? "#FF5C35" : "#1A1A2E",
                  color:"#fff",border:"none",padding:"14px",borderRadius:"12px",
                  fontSize:"14px",fontWeight:600,cursor:loading?"default":"pointer",fontFamily:"inherit",
                  opacity:loading?0.7:1,
                }}>
                  {loading ? "..." : `${plan.name} wählen`}
                </button>
              </div>
            ))}
          </div>
        ) : (
          // ZAHLUNG MIT ELEMENTS
          <div style={{background:"#FFFAF5",borderRadius:"20px",padding:"32px",boxShadow:"0 20px 40px rgba(26,26,46,.1)"}}>
            {clientSecret && (
              <Elements stripe={stripePromise} options={{
                clientSecret,
                appearance: {
                  theme: "flat",
                  variables: { colorPrimary: "#FF5C35", fontFamily: "DM Sans, sans-serif", borderRadius: "10px" },
                },
              }}>
                <CheckoutForm plan={selectedPlan} onBack={()=>{setSelectedPlan(null);setClientSecret("");}} />
              </Elements>
            )}
          </div>
        )}
      </div>
    </div>
  );
}