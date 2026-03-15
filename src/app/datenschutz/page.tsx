import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Tablely",
  description: "Datenschutzerklärung von Tablely gemäß DSGVO und österreichischem Datenschutzgesetz.",
  robots: { index: false, follow: false },
};

export default function Datenschutz() {
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#FFFAF5",minHeight:"100vh",color:"#1A1A2E"}}>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 48px",borderBottom:"1px solid #F0EBE3",background:"rgba(255,250,245,0.97)"}}>
        <a href="/" style={{fontFamily:"Georgia,serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E",textDecoration:"none",letterSpacing:"-0.5px"}}>
          table<span style={{color:"#FF5C35"}}>ly</span>
        </a>
        <a href="/" style={{fontSize:"14px",color:"#6B6B80",textDecoration:"none"}}>← Zurück</a>
      </nav>

      <div style={{maxWidth:"720px",margin:"0 auto",padding:"64px 24px"}}>
        <h1 style={{fontFamily:"Georgia,serif",fontSize:"40px",fontWeight:700,letterSpacing:"-1px",marginBottom:"8px"}}>Datenschutzerklärung</h1>
        <p style={{fontSize:"14px",color:"#6B6B80",marginBottom:"48px"}}>Gemäß DSGVO, DSG und TKG 2003 – Stand: März 2026</p>

        <Section title="1. Verantwortlicher">
          <p style={p}>Verantwortlicher im Sinne der DSGVO ist:</p>
          <div style={{background:"#fff",border:"1.5px solid #F0EBE3",borderRadius:"12px",padding:"20px",marginTop:"12px"}}>
            <p style={{...p,marginBottom:"4px"}}><strong style={{color:"#1A1A2E"}}>Michael Kleinlercher e.U.</strong></p>
            <p style={{...p,marginBottom:"4px"}}>Bruggen 94, 9962 St. Veit in Defereggen, Österreich</p>
            <p style={{...p,marginBottom:"4px"}}>E-Mail: info@mkd-agentur.at</p>
            <p style={p}>Tel.: +43 660 110 9224</p>
          </div>
        </Section>

        <Section title="2. Erhebung und Verarbeitung personenbezogener Daten">
          <p style={p}>Wir erheben personenbezogene Daten nur, soweit dies zur Bereitstellung unserer Dienstleistungen erforderlich ist. Beim Eintragen in die Warteliste auf tablely.at erheben wir folgende Daten:</p>
          <ul style={{paddingLeft:"20px",marginTop:"12px"}}>
            {["Vor- und Nachname", "Name des Restaurants", "E-Mail-Adresse"].map((item, i) => (
              <li key={i} style={{fontSize:"15px",color:"#6B6B80",lineHeight:1.8,fontWeight:300}}>{item}</li>
            ))}
          </ul>
          <p style={{...p,marginTop:"12px"}}>Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch Eintragung in die Warteliste).</p>
        </Section>

        <Section title="3. Zweck der Datenverarbeitung">
          <p style={p}>Die erhobenen Daten werden ausschließlich für folgende Zwecke verwendet:</p>
          <ul style={{paddingLeft:"20px",marginTop:"12px"}}>
            {[
              "Verwaltung der Warteliste für den Frühzugang zu Tablely",
              "Kontaktaufnahme bei Verfügbarkeit des Produkts",
              "Versand einer Bestätigungsmail nach der Anmeldung",
            ].map((item, i) => (
              <li key={i} style={{fontSize:"15px",color:"#6B6B80",lineHeight:1.8,fontWeight:300}}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="4. Speicherung und Löschung">
          <p style={p}>Ihre Daten werden in einer gesicherten Datenbank (Supabase, gehostet in der EU) gespeichert. Die Daten werden gelöscht, sobald der Zweck der Speicherung entfallen ist — spätestens jedoch 24 Monate nach Ihrer Eintragung, sofern keine anderweitige gesetzliche Aufbewahrungspflicht besteht.</p>
          <p style={{...p,marginTop:"12px"}}>Sie können jederzeit die Löschung Ihrer Daten beantragen unter: <a href="mailto:info@mkd-agentur.at" style={{color:"#FF5C35"}}>info@mkd-agentur.at</a></p>
        </Section>

        <Section title="5. Weitergabe von Daten an Dritte">
          <p style={p}>Ihre Daten werden nicht an Dritte verkauft oder zu Werbezwecken weitergegeben. Wir setzen folgende Auftragsverarbeiter ein, mit denen Datenverarbeitungsverträge gemäß Art. 28 DSGVO bestehen:</p>
          <ul style={{paddingLeft:"20px",marginTop:"12px"}}>
            {[
              "Supabase Inc. – Datenbankhosting (EU-Server)",
              "Resend Inc. – E-Mail-Versand",
              "Vercel Inc. – Webhosting",
            ].map((item, i) => (
              <li key={i} style={{fontSize:"15px",color:"#6B6B80",lineHeight:1.8,fontWeight:300}}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="6. Cookies und Tracking">
          <p style={p}>Unsere Website verwendet keine Tracking-Cookies und keine Analyse-Tools wie Google Analytics. Es werden ausschließlich technisch notwendige Cookies verwendet, die für den Betrieb der Website erforderlich sind.</p>
        </Section>

        <Section title="7. Ihre Rechte">
          <p style={p}>Gemäß DSGVO haben Sie folgende Rechte:</p>
          <ul style={{paddingLeft:"20px",marginTop:"12px"}}>
            {[
              "Recht auf Auskunft (Art. 15 DSGVO)",
              "Recht auf Berichtigung (Art. 16 DSGVO)",
              "Recht auf Löschung (Art. 17 DSGVO)",
              "Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)",
              "Recht auf Datenübertragbarkeit (Art. 20 DSGVO)",
              "Widerspruchsrecht (Art. 21 DSGVO)",
              "Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)",
            ].map((item, i) => (
              <li key={i} style={{fontSize:"15px",color:"#6B6B80",lineHeight:1.8,fontWeight:300}}>{item}</li>
            ))}
          </ul>
          <p style={{...p,marginTop:"12px"}}>Zur Ausübung Ihrer Rechte wenden Sie sich an: <a href="mailto:info@mkd-agentur.at" style={{color:"#FF5C35"}}>info@mkd-agentur.at</a></p>
        </Section>

        <Section title="8. Beschwerderecht">
          <p style={p}>Sie haben das Recht, sich bei der österreichischen Datenschutzbehörde zu beschweren:</p>
          <div style={{background:"#fff",border:"1.5px solid #F0EBE3",borderRadius:"12px",padding:"20px",marginTop:"12px"}}>
            <p style={{...p,marginBottom:"4px"}}><strong style={{color:"#1A1A2E"}}>Österreichische Datenschutzbehörde</strong></p>
            <p style={{...p,marginBottom:"4px"}}>Barichgasse 40–42, 1030 Wien</p>
            <p style={{...p,marginBottom:"4px"}}>Tel.: +43 1 52 152-0</p>
            <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" style={{color:"#FF5C35",fontSize:"15px"}}>www.dsb.gv.at</a>
          </div>
        </Section>

        <Section title="9. Aktualität dieser Datenschutzerklärung">
          <p style={p}>Diese Datenschutzerklärung ist aktuell gültig und hat den Stand März 2026. Durch die Weiterentwicklung unserer Website oder aufgrund geänderter gesetzlicher Vorschriften kann es notwendig werden, diese Datenschutzerklärung zu ändern.</p>
        </Section>
      </div>

      <Footer />
    </div>
  );
}

const p: React.CSSProperties = {
  fontSize: "15px",
  color: "#6B6B80",
  lineHeight: 1.7,
  fontWeight: 300,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{marginBottom:"40px"}}>
      <h2 style={{fontFamily:"Georgia,serif",fontSize:"20px",fontWeight:700,marginBottom:"16px",paddingBottom:"10px",borderBottom:"1.5px solid #F0EBE3"}}>{title}</h2>
      {children}
    </div>
  );
}

function Footer() {
  return (
    <footer style={{padding:"24px 48px",borderTop:"1px solid #F0EBE3",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
      <a href="/" style={{fontFamily:"Georgia,serif",fontSize:"17px",fontWeight:700,color:"#1A1A2E",textDecoration:"none"}}>
        table<span style={{color:"#FF5C35"}}>ly</span>
      </a>
      <div style={{display:"flex",gap:"24px",fontSize:"13px"}}>
        <a href="/impressum" style={{color:"#6B6B80",textDecoration:"none"}}>Impressum</a>
        <a href="/datenschutz" style={{color:"#6B6B80",textDecoration:"none"}}>Datenschutz</a>
        <a href="/agb" style={{color:"#6B6B80",textDecoration:"none"}}>AGB</a>
      </div>
    </footer>
  );
}