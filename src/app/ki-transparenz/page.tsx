import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { breadcrumbSchema, jsonLdGraph, pageMeta } from "@/lib/seo";

const SERIF = "var(--font-playfair), Georgia, serif";

export const metadata: Metadata = pageMeta({
  path: "/ki-transparenz",
  title: "KI-Transparenz nach EU AI Act | Butlery",
  description:
    "Welche KI-Systeme bei Butlery im Einsatz sind, wie sie gegenüber Gästen gekennzeichnet werden und wo bewusst ein Mensch entscheidet. Information gemäß EU AI Act.",
});

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ paddingTop: "38px", marginTop: "38px", borderTop: "1px solid var(--border)" }}>
      <h2 style={{ fontFamily: SERIF, fontSize: "clamp(22px,3vw,28px)", fontWeight: 700, letterSpacing: "-0.8px", lineHeight: 1.25, marginBottom: "16px" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "16.5px", color: "var(--muted)", lineHeight: 1.85, fontWeight: 300, marginBottom: "16px" }}>
      {children}
    </p>
  );
}

export default function KiTransparenz() {
  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(breadcrumbSchema([["KI-Transparenz", "/ki-transparenz"]])),
        }}
      />
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 32px 110px" }}>
        <h1 style={{ fontFamily: SERIF, fontSize: "clamp(32px,4.8vw,46px)", fontWeight: 700, letterSpacing: "-1.6px", lineHeight: 1.1, marginBottom: "18px" }}>
          So arbeitet die KI von Butlery
        </h1>
        <P>
          Butlery nimmt Reservierungen teilweise automatisiert entgegen. Auf dieser Seite steht, welche
          KI-Systeme dabei laufen, woran deine Gäste sie erkennen und wo bewusst ein Mensch entscheidet.
          Diese Information erfolgt im Sinne der Transparenzpflichten des EU AI Act (Verordnung (EU) 2024/1689,
          insbesondere Artikel 50).
        </P>

        <Block title="Welche KI-Systeme im Einsatz sind">
          <P>
            <strong style={{ color: "var(--dark)", fontWeight: 600 }}>WhatsApp-Assistent.</strong>{" "}
            Schreibt ein Gast an die WhatsApp-Nummer eines Restaurants, wertet ein Sprachmodell die Nachricht
            aus, erkennt Name, Datum, Uhrzeit und Personenzahl, fragt fehlende Angaben nach und legt die
            Reservierung an. Er kann auf Wunsch des Gastes auch eine bestehende Reservierung stornieren.
          </P>
          <P>
            <strong style={{ color: "var(--dark)", fontWeight: 600 }}>Telefonassistent.</strong>{" "}
            Am Telefon nimmt ein Sprachassistent den Anruf entgegen, wandelt Gesprochenes in Text um,
            verarbeitet die Reservierungsdaten und antwortet mit synthetischer Stimme. Dieses System befindet
            sich in Entwicklung und ist noch nicht bei allen Restaurants aktiv.
          </P>
          <P>
            Beide Systeme arbeiten ausschließlich im Rahmen der Reservierungsannahme. Sie greifen auf die
            Öffnungszeiten, Tische und Reservierungen des jeweiligen Restaurants zu — nicht auf Daten anderer
            Betriebe.
          </P>
        </Block>

        <Block title="Wie Gäste die KI erkennen">
          <P>
            Deine Gäste sollen zu keinem Zeitpunkt glauben, mit einem Menschen zu sprechen. Deshalb kennzeichnet
            sich der Assistent von sich aus:
          </P>
          <P>
            Auf WhatsApp stellt er sich in der ersten Nachricht einer neuen Unterhaltung als digitaler Assistent
            des Restaurants vor. Am Telefon nennt er sich bereits in der Begrüßung digitaler Telefonassistent.
            Auf Nachfrage bestätigt er in beiden Kanälen, dass er eine KI ist.
          </P>
          <P>
            Für Anliegen, die über eine Reservierung hinausgehen, verweist der Assistent an das Restaurant.
            Ein Gast kann jederzeit direkt beim Betrieb anrufen — die KI ersetzt den persönlichen Kontakt nicht,
            sie entlastet ihn nur während der Stoßzeit.
          </P>
        </Block>

        <Block title="Wo ein Mensch entscheidet">
          <P>
            Die KI trifft keine automatisierten Entscheidungen über Personen. Sie bewertet keine Gäste, führt
            keine Sperrlisten, erstellt keine Profile und leitet aus dem Verhalten von Gästen keine Konsequenzen ab.
          </P>
          <P>
            Bei größeren Gruppen ab dem im Restaurant hinterlegten Schwellenwert bucht der Assistent nicht selbst,
            sondern legt eine offene Anfrage an, über die das Restaurant entscheidet. Dasselbe gilt, wenn zum
            gewünschten Zeitpunkt kein passender Tisch frei ist. In beiden Fällen erfährt der Gast, dass sich
            das Team persönlich meldet.
          </P>
        </Block>

        <Block title="Daten und Aufbewahrung">
          <P>
            Für die Reservierung verarbeitet Butlery die Angaben, die der Gast selbst nennt: Name, Telefonnummer
            oder E-Mail-Adresse, Datum, Uhrzeit, Personenzahl und etwaige Sonderwünsche. Der Gesprächsverlauf einer
            WhatsApp-Unterhaltung wird gespeichert, damit der Assistent den Kontext einer laufenden Reservierung nicht verliert.
          </P>
          <P>
            Details zu Rechtsgrundlagen, Speicherdauer, eingesetzten Dienstleistern und deinen Rechten stehen in
            der <Link href="/datenschutz" style={{ color: "var(--orange)", textDecoration: "none", borderBottom: "1px solid rgba(255,92,53,.35)" }}>Datenschutzerklärung</Link>.
          </P>
        </Block>

        <Block title="Verantwortlich und erreichbar">
          <P>
            Betreiber von Butlery ist Michael Kleinlercher e.U., St. Veit in Defereggen, Österreich. Fragen zum
            Einsatz der KI beantworte ich persönlich — die Kontaktdaten stehen im{" "}
            <Link href="/impressum" style={{ color: "var(--orange)", textDecoration: "none", borderBottom: "1px solid rgba(255,92,53,.35)" }}>Impressum</Link>.
          </P>
          <P>
            Eine ausführlichere, weniger juristische Erklärung findest du im Blogartikel{" "}
            <Link href="/blog/so-arbeitet-unsere-ki" style={{ color: "var(--orange)", textDecoration: "none", borderBottom: "1px solid rgba(255,92,53,.35)" }}>So arbeitet die KI von Butlery</Link>.
          </P>
        </Block>
      </div>
    </PageShell>
  );
}
