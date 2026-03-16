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