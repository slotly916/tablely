import Link from "next/link";

// Gemeinsame Nav + Footer für die Unterseiten (Blog, KI-Transparenz).
// Übernimmt das Landing-Design nach dem Slop-Fix: weisse Fläche, kühle Border,
// Playfair nur für die Wortmarke/Headlines, System-Stack im Fliesstext.
// Bewusst ohne backdrop-filter, ohne Verläufe, ohne Icon-Karten.

const SERIF = "var(--font-playfair), Georgia, serif";

export const FOOTER_LINKS: [string, string][] = [
  ["Blog", "/blog"],
  ["Presse", "/presse"],
  ["KI-Transparenz", "/ki-transparenz"],
  ["Impressum", "/impressum"],
  ["Datenschutz", "/datenschutz"],
  ["AGB", "/agb"],
];

export function SiteNav() {
  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 32px", background: "var(--paper)",
      borderBottom: "1px solid var(--border)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <Link href="/" style={{ fontFamily: SERIF, fontSize: "22px", fontWeight: 700, color: "var(--dark)", textDecoration: "none", letterSpacing: "-0.5px" }}>
        <img src="/butlery-logo-dunkel.png" width={1416} height={496} alt="Butlery" style={{height:"24px",width:"auto",display:"inline-block",verticalAlign:"middle"}}/>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <Link href="/blog" style={{ fontSize: "14px", color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>Blog</Link>
        <Link href="/demo" style={{ fontSize: "14px", color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>Demo</Link>
        <Link href="/login" style={{ fontSize: "14px", color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>Login</Link>
        <Link href="/" style={{
          background: "var(--dark)", color: "#fff", border: "1px solid var(--dark)",
          padding: "9px 20px", borderRadius: "100px", fontSize: "13px", fontWeight: 500, textDecoration: "none",
        }}>
          Jetzt testen
        </Link>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ padding: "36px 32px", borderTop: "1px solid var(--border)", background: "var(--paper)" }}>
      <div style={{ maxWidth: "1080px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <Link href="/" style={{ fontFamily: SERIF, fontSize: "19px", fontWeight: 700, color: "var(--dark)", textDecoration: "none" }}>
          <img src="/butlery-logo-dunkel.png" width={1416} height={496} alt="Butlery" style={{height:"24px",width:"auto",display:"inline-block",verticalAlign:"middle"}}/>
        </Link>
        <div style={{ display: "flex", gap: "22px", flexWrap: "wrap" }}>
          {FOOTER_LINKS.map(([label, href]) => (
            <Link key={href} href={href} style={{ fontSize: "12.5px", color: "var(--muted)", textDecoration: "none" }}>{label}</Link>
          ))}
        </div>
        <p style={{ fontSize: "12.5px", color: "var(--muted)" }}>© 2026 Butlery · Michael Kleinlercher e.U.</p>
      </div>
    </footer>
  );
}

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-sans)", background: "var(--paper)", color: "var(--dark)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteNav />
      <main style={{ flex: 1 }}>{children}</main>
      <SiteFooter />
    </div>
  );
}
