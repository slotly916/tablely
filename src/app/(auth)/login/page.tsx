"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  }

  async function handleLogin() {
    if (!email || !password) {
      setErrorMsg("Bitte alle Felder ausfüllen.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setErrorMsg("E-Mail oder Passwort falsch.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <a href="/" style={styles.logo}>table<span style={{color:"#FF5C35"}}>ly</span></a>
        <h1 style={styles.title}>Willkommen zurück</h1>
        <p style={styles.sub}>Melde dich in deinem Tablely Konto an.</p>

        <button onClick={handleGoogleLogin} style={{
          width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
          padding:"13px",borderRadius:"10px",border:"1.5px solid #F0EBE3",background:"#fff",
          fontSize:"14px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:"#1A1A2E",
          marginBottom:"16px",transition:"all .2s",
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Mit Google einloggen
        </button>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"}}>
          <div style={{flex:1,height:"1px",background:"#F0EBE3"}}/>
          <span style={{fontSize:"12px",color:"#6B6B80"}}>oder mit E-Mail</span>
          <div style={{flex:1,height:"1px",background:"#F0EBE3"}}/>
        </div>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>E-Mail</label>
            <input
              style={styles.input}
              type="email"
              placeholder="deine@email.at"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={status === "loading"}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Passwort</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Dein Passwort"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={status === "loading"}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <a href="/forgot-password" style={{...styles.link, fontSize:"12px", textAlign:"right"}}>
              Passwort vergessen?
            </a>
          </div>

          {errorMsg && <p style={styles.error}>{errorMsg}</p>}

          <button
            style={{...styles.btn, opacity: status === "loading" ? 0.7 : 1}}
            onClick={handleLogin}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Wird eingeloggt..." : "Einloggen →"}
          </button>
        </div>

        <p style={styles.footer}>
          Noch kein Konto?{" "}
          <a href="/register" style={styles.link}>Kostenlos registrieren</a>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    background: "#F0EBE3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: "#FFFAF5",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 8px 40px rgba(26,26,46,0.08)",
  },
  logo: {
    fontFamily: "Georgia, serif",
    fontSize: "24px",
    fontWeight: 700,
    color: "#1A1A2E",
    textDecoration: "none",
    display: "block",
    marginBottom: "28px",
  },
  title: {
    fontFamily: "Georgia, serif",
    fontSize: "26px",
    fontWeight: 700,
    color: "#1A1A2E",
    letterSpacing: "-0.5px",
    marginBottom: "8px",
  },
  sub: {
    fontSize: "15px",
    color: "#6B6B80",
    marginBottom: "28px",
    lineHeight: 1.6,
    fontWeight: 300,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#1A1A2E",
  },
  input: {
    padding: "12px 14px",
    border: "1.5px solid #F0EBE3",
    borderRadius: "10px",
    fontSize: "15px",
    fontFamily: "inherit",
    background: "#fff",
    color: "#1A1A2E",
    outline: "none",
    transition: "border-color .2s",
  },
  btn: {
    background: "#FF5C35",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: "4px",
    transition: "all .2s",
  },
  error: {
    color: "#E24B4A",
    fontSize: "13px",
    margin: 0,
  },
  footer: {
    fontSize: "14px",
    color: "#6B6B80",
    textAlign: "center",
    marginTop: "20px",
  },
  link: {
    color: "#FF5C35",
    textDecoration: "none",
    fontWeight: 500,
  },
};