import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen – Tablely",
  description: "AGB von Tablely, betrieben von Michael Kleinlercher e.U.",
  robots: { index: false, follow: false },
};

export default function AGB() {
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#FFFAF5",minHeight:"100vh",color:"#1A1A2E"}}>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 48px",borderBottom:"1px solid #F0EBE3",background:"rgba(255,250,245,0.97)"}}>
        <a href="/" style={{fontFamily:"Georgia,serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E",textDecoration:"none",letterSpacing:"-0.5px"}}>
          table<span style={{color:"#FF5C35"}}>ly</span>
        </a>
        <a href="/" style={{fontSize:"14px",color:"#6B6B80",textDecoration:"none"}}>← Zurück</a>
      </nav>

      <div style={{maxWidth:"720px",margin:"0 auto",padding:"64px 24px"}}>
        <h1 style={{fontFamily:"Georgia,serif",fontSize:"40px",fontWeight:700,letterSpacing:"-1px",marginBottom:"8px"}}>Allgemeine Geschäftsbedingungen</h1>
        <p style={{fontSize:"14px",color:"#6B6B80",marginBottom:"48px"}}>Stand: März 2026 – Michael Kleinlercher e.U., Tablely</p>

        <Section title="1. Geltungsbereich">
          <p style={p}>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Leistungen der Michael Kleinlercher e.U. (nachfolgend „Anbieter") im Rahmen des Dienstes Tablely (tablely.at) gegenüber Unternehmern im Sinne des § 1 UGB (nachfolgend „Kunde"). Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.</p>
        </Section>

        <Section title="2. Leistungsbeschreibung">
          <p style={p}>Tablely ist eine webbasierte SaaS-Lösung (Software as a Service) zur automatisierten Verwaltung von Tischreservierungen für Gastronomiebetriebe. Der Funktionsumfang umfasst insbesondere:</p>
          <ul style={{paddingLeft:"20px",marginTop:"12px"}}>
            {[
              "Automatische Entgegennahme von Reservierungen per WhatsApp mittels KI",
              "KI-gestützter Telefonassistent zur Reservierungsaufnahme",
              "Online-Buchungsformular für Endkunden",
              "Echtzeit-Dashboard zur Verwaltung aller Reservierungen",
              "Automatische Erinnerungen an Gäste per WhatsApp oder E-Mail",
            ].map((item, i) => (
              <li key={i} style={{fontSize:"15px",color:"#6B6B80",lineHeight:1.8,fontWeight:300}}>{item}</li>
            ))}
          </ul>
          <p style={{...p,marginTop:"12px"}}>Der genaue Leistungsumfang ergibt sich aus dem jeweils gewählten Tarif. Der Anbieter behält sich das Recht vor, den Funktionsumfang des Dienstes weiterzuentwickeln und anzupassen.</p>
        </Section>

        <Section title="3. Vertragsschluss und Warteliste">
          <p style={p}>Die Eintragung in die Warteliste auf tablely.at stellt kein verbindliches Angebot dar und begründet keinen Anspruch auf Zugang zum Dienst. Ein Vertragsverhältnis kommt erst durch ausdrückliche schriftliche Bestätigung des Anbieters zustande.</p>
        </Section>

        <Section title="4. Vergütung und Zahlungsbedingungen">
          <p style={p}>Die Preise für die Nutzung von Tablely richten sich nach dem jeweils gültigen Preisblatt. Alle Preise verstehen sich in Euro exklusive der gesetzlichen Umsatzsteuer (soweit anwendbar). Die Vergütung ist monatlich im Voraus fällig. Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang zum Dienst zu sperren.</p>
        </Section>

        <Section title="5. Laufzeit und Kündigung">
          <p style={p}>Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von beiden Seiten mit einer Frist von 30 Tagen zum Ende des jeweiligen Abrechnungsmonats gekündigt werden. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.</p>
        </Section>

        <Section title="6. Verfügbarkeit und Wartung">
          <p style={p}>Der Anbieter strebt eine Verfügbarkeit des Dienstes von 99 % im Jahresmittel an. Ausgenommen sind Wartungsarbeiten, die nach Möglichkeit außerhalb der Hauptnutzungszeiten durchgeführt werden, sowie Ausfälle, die auf höhere Gewalt oder Umstände zurückzuführen sind, die außerhalb des Einflussbereichs des Anbieters liegen.</p>
        </Section>

        <Section title="7. Pflichten des Kunden">
          <p style={p}>Der Kunde ist verpflichtet, die für die Nutzung des Dienstes erforderlichen Zugangsdaten vertraulich zu behandeln und den Anbieter unverzüglich zu informieren, wenn Anhaltspunkte für einen Missbrauch bestehen. Der Kunde ist für die Einhaltung der datenschutzrechtlichen Vorschriften gegenüber seinen eigenen Kunden (Restaurantgästen) selbst verantwortlich.</p>
        </Section>

        <Section title="8. Haftungsbeschränkung">
          <p style={p}>Der Anbieter haftet nur für Schäden, die auf vorsätzlichem oder grob fahrlässigem Verhalten beruhen. Die Haftung für leichte Fahrlässigkeit, entgangenen Gewinn sowie mittelbare Schäden ist — soweit gesetzlich zulässig — ausgeschlossen. Die Gesamthaftung des Anbieters ist auf die vom Kunden in den letzten 12 Monaten geleisteten Zahlungen begrenzt.</p>
        </Section>

        <Section title="9. Datenschutz">
          <p style={p}>Der Anbieter verarbeitet personenbezogene Daten des Kunden und seiner Endkunden gemäß der gültigen Datenschutzerklärung (abrufbar unter tablely.at/datenschutz) sowie den anwendbaren datenschutzrechtlichen Bestimmungen, insbesondere der DSGVO.</p>
        </Section>

        <Section title="10. Änderungen der AGB">
          <p style={p}>Der Anbieter behält sich vor, diese AGB jederzeit zu ändern. Änderungen werden dem Kunden mindestens 30 Tage vor Inkrafttreten per E-Mail mitgeteilt. Widerspricht der Kunde nicht innerhalb von 14 Tagen nach Erhalt der Mitteilung, gelten die geänderten AGB als akzeptiert.</p>
        </Section>

        <Section title="11. Anwendbares Recht und Gerichtsstand">
          <p style={p}>Es gilt ausschließlich österreichisches Recht unter Ausschluss des UN-Kaufrechts (CISG). Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist — soweit gesetzlich zulässig — Innsbruck, Österreich.</p>
        </Section>

        <Section title="12. Salvatorische Klausel">
          <p style={p}>Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein oder werden, so berührt dies die Wirksamkeit der übrigen Bestimmungen nicht. Die unwirksame Bestimmung ist durch eine wirksame zu ersetzen, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung möglichst nahekommt.</p>
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