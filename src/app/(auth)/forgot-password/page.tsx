"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleReset() {
    if (!email) { setErrorMsg("Bitte E-Mail eingeben."); return; }
    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) { setStatus("error"); setErrorMsg(error.message); return; }
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <a href="/" style={styles.logo}>table<span style={{color:"#FF5C35"}}>ly</span></a>
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"#E8F8F1",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#25C281" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={styles.title}>E-Mail gesendet</h2>
            <p style={styles.sub}>Wir haben einen Reset-Link an <strong>{email}</strong> gesendet. Schau in deinen Posteingang.</p>
            <a href="/login" style={{color:"#FF5C35",fontSize:"14px",fontWeight:500,textDecoration:"none"}}>← Zurück zum Login</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <a href="/" style={styles.logo}>table<span style={{color:"#FF5C35"}}>ly</span></a>
        <h1 style={styles.title}>Passwort zurücksetzen</h1>
        <p style={styles.sub}>Gib deine E-Mail ein — wir schicken dir einen Link zum Zurücksetzen.</p>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>E-Mail</label>
            <input
              style={styles.input}
              type="email"
              placeholder="deine@email.at"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReset()}
              disabled={status === "loading"}
            />
          </div>

          {errorMsg && <p style={styles.error}>{errorMsg}</p>}

          <button
            style={{...styles.btn, opacity: status === "loading" ? 0.7 : 1}}
            onClick={handleReset}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Wird gesendet..." : "Reset-Link senden →"}
          </button>
        </div>

        <p style={styles.footer}>
          <a href="/login" style={styles.link}>← Zurück zum Login</a>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { minHeight:"100vh", background:"#F0EBE3", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"'DM Sans',sans-serif" },
  card: { background:"#FFFAF5", borderRadius:"20px", padding:"40px", width:"100%", maxWidth:"440px", boxShadow:"0 8px 40px rgba(26,26,46,0.08)" },
  logo: { fontFamily:"Georgia,serif", fontSize:"24px", fontWeight:700, color:"#1A1A2E", textDecoration:"none", display:"block", marginBottom:"28px" },
  title: { fontFamily:"Georgia,serif", fontSize:"26px", fontWeight:700, color:"#1A1A2E", letterSpacing:"-0.5px", marginBottom:"8px" },
  sub: { fontSize:"15px", color:"#6B6B80", marginBottom:"28px", lineHeight:1.6, fontWeight:300 },
  form: { display:"flex", flexDirection:"column", gap:"16px" },
  field: { display:"flex", flexDirection:"column", gap:"6px" },
  label: { fontSize:"13px", fontWeight:500, color:"#1A1A2E" },
  input: { padding:"12px 14px", border:"1.5px solid #F0EBE3", borderRadius:"10px", fontSize:"15px", fontFamily:"inherit", background:"#fff", color:"#1A1A2E", outline:"none", transition:"border-color .2s" },
  btn: { background:"#FF5C35", color:"#fff", border:"none", padding:"14px", borderRadius:"10px", fontSize:"15px", fontWeight:500, cursor:"pointer", fontFamily:"inherit", marginTop:"4px", transition:"all .2s" },
  error: { color:"#E24B4A", fontSize:"13px", margin:0 },
  footer: { fontSize:"14px", color:"#6B6B80", textAlign:"center", marginTop:"20px" },
  link: { color:"#FF5C35", textDecoration:"none", fontWeight:500 },
};