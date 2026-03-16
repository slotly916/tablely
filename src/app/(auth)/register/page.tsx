"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleRegister() {
    if (!name || !email || !password) {
      setErrorMsg("Bitte alle Felder ausfüllen.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("success");
  }

  if (status === "success") {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.logo}>table<span style={{color:"#FF5C35"}}>ly</span></div>
          <div style={{textAlign:"center", padding:"20px 0"}}>
            <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"#E8F8F1",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#25C281" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={styles.title}>E-Mail bestätigen</h2>
            <p style={styles.sub}>Wir haben dir eine Bestätigungsmail an <strong>{email}</strong> gesendet. Klicke den Link um fortzufahren.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <a href="/" style={styles.logo}>table<span style={{color:"#FF5C35"}}>ly</span></a>
        <h1 style={styles.title}>Konto erstellen</h1>
        <p style={styles.sub}>Starte deinen kostenlosen Zugang zu Tablely.</p>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Dein Name</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Michael Mustermann"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={status === "loading"}
            />
          </div>
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
              placeholder="Mindestens 8 Zeichen"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={status === "loading"}
              onKeyDown={e => e.key === "Enter" && handleRegister()}
            />
          </div>

          {errorMsg && <p style={styles.error}>{errorMsg}</p>}

          <button
            style={{...styles.btn, opacity: status === "loading" ? 0.7 : 1}}
            onClick={handleRegister}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Wird registriert..." : "Kostenlos registrieren →"}
          </button>
        </div>

        <p style={styles.footer}>
          Bereits ein Konto?{" "}
          <a href="/login" style={styles.link}>Einloggen</a>
        </p>

        <p style={{fontSize:"12px",color:"#6B6B80",textAlign:"center",marginTop:"16px",lineHeight:1.5}}>
          Mit der Registrierung stimmst du unseren{" "}
          <a href="/agb" style={styles.link}>AGB</a> und der{" "}
          <a href="/datenschutz" style={styles.link}>Datenschutzerklärung</a> zu.
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