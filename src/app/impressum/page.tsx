import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum – Tablely",
  description: "Impressum von Tablely, betrieben von Michael Kleinlercher e.U.",
  robots: { index: false, follow: false },
};

export default function Impressum() {
  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#FFFAF5",minHeight:"100vh",color:"#1A1A2E"}}>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 48px",borderBottom:"1px solid #F0EBE3",background:"rgba(255,250,245,0.97)"}}>
        <a href="/" style={{fontFamily:"Georgia,serif",fontSize:"22px",fontWeight:700,color:"#1A1A2E",textDecoration:"none",letterSpacing:"-0.5px"}}>
          table<span style={{color:"#FF5C35"}}>ly</span>
        </a>
        <a href="/" style={{fontSize:"14px",color:"#6B6B80",textDecoration:"none"}}>← Zurück</a>
      </nav>

      <div style={{maxWidth:"720px",margin:"0 auto",padding:"64px 24px"}}>
        <h1 style={{fontFamily:"Georgia,serif",fontSize:"40px",fontWeight:700,letterSpacing:"-1px",marginBottom:"8px"}}>Impressum</h1>
        <p style={{fontSize:"14px",color:"#6B6B80",marginBottom:"48px"}}>Angaben gemäß § 5 ECG und § 25 MedienG</p>

        <Section title="Unternehmensangaben">
          <Row label="Unternehmensname" value="Michael Kleinlercher e.U." />
          <Row label="Betriebsbezeichnung" value="Tablely" />
          <Row label="Inhaberin" value="Michael Kleinlercher" />
          <Row label="Adresse" value="Bruggen 94, 9962 St. Veit in Defereggen, Österreich" />
          <Row label="Firmenbuchnummer" value="639461i" />
          <Row label="Firmenbuchgericht" value="Landesgericht Innsbruck" />
          <Row label="Unternehmensgegenstand" value="Software as a Service (SaaS) – Digitale Reservierungslösung für die Gastronomie" />
        </Section>

        <Section title="Kontakt">
          <Row label="Telefon" value="+43 660 110 9224" />
          <Row label="E-Mail" value="info@mkd-agentur.at" />
          <Row label="Website" value="https://tablely.at" />
        </Section>

        <Section title="Umsatzsteuer">
          <p style={{fontSize:"15px",color:"#6B6B80",lineHeight:1.7,fontWeight:300}}>
            Als Kleinunternehmer im Sinne des § 6 Abs. 1 Z 27 UStG wird keine Umsatzsteuer berechnet. Es gilt die Kleinunternehmerregelung.
          </p>
        </Section>

        <Section title="Online-Streitbeilegung">
          <p style={{fontSize:"15px",color:"#6B6B80",lineHeight:1.7,fontWeight:300,marginBottom:"12px"}}>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          </p>
          <a href="https://ec.europa.eu/odr" target="_blank" rel="noopener noreferrer" style={{color:"#FF5C35",fontSize:"15px"}}>
            https://ec.europa.eu/odr
          </a>
          <p style={{fontSize:"15px",color:"#6B6B80",lineHeight:1.7,fontWeight:300,marginTop:"12px"}}>
            Wir sind zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle weder verpflichtet noch bereit.
          </p>
        </Section>

        <Section title="Haftung für Inhalte">
          <p style={{fontSize:"15px",color:"#6B6B80",lineHeight:1.7,fontWeight:300}}>
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs. 1 ECG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
          </p>
        </Section>

        <Section title="Haftung für Links">
          <p style={{fontSize:"15px",color:"#6B6B80",lineHeight:1.7,fontWeight:300}}>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>
        </Section>

        <Section title="Urheberrecht">
          <p style={{fontSize:"15px",color:"#6B6B80",lineHeight:1.7,fontWeight:300}}>
            Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem österreichischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </Section>
      </div>

      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{marginBottom:"40px"}}>
      <h2 style={{fontFamily:"Georgia,serif",fontSize:"20px",fontWeight:700,marginBottom:"16px",paddingBottom:"10px",borderBottom:"1.5px solid #F0EBE3"}}>{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{display:"flex",gap:"16px",padding:"8px 0",borderBottom:"1px solid #F0EBE3",flexWrap:"wrap"}}>
      <span style={{fontSize:"14px",color:"#6B6B80",minWidth:"200px",fontWeight:400}}>{label}</span>
      <span style={{fontSize:"14px",color:"#1A1A2E",fontWeight:500,flex:1}}>{value}</span>
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