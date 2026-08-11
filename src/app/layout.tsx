import type { Metadata, Viewport } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import {
  SITE_LANG,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  founderSchema,
  jsonLdGraph,
  organizationSchema,
  softwareSchema,
  websiteSchema,
} from "@/lib/seo";

// Nur die Display-Schrift wird geladen. Der Body laeuft auf dem System-Stack
// (--font-sans in globals.css) — kein zweiter Webfont, kein Google-Sans-Look.
// normal + italic, weil die Preis- und Presseseite kursive Playfair-Akzente
// setzen. Vorher haben diese Seiten dafuer zusaetzlich Google Fonts per
// @import nachgeladen — ein render-blockierender Fremdrequest pro Seite.
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

// ACHTUNG (SEO): Was hier steht, beschreibt die STARTSEITE und wird von Next.js
// an jede Route vererbt, die das Feld nicht selbst setzt. Jede neue Seite muss
// deshalb ihr eigenes Canonical + openGraph setzen — am einfachsten ueber
// pageMeta() aus src/lib/seo.ts. Sonst zeigt sie auf die Startseite.
export const metadata: Metadata = {
  // Titel 61 Zeichen, Description 136: beides bleibt in der Google-Vorschau
  // vollstaendig stehen. Vorher: 69 und 190 Zeichen, beides abgeschnitten.
  title: "Reservierungssoftware für Restaurants in Österreich | Butlery",
  description: "Butlery nimmt Reservierungen per WhatsApp, Telefon und Online automatisch entgegen, trägt sie ins Dashboard ein und erinnert deine Gäste.",
  keywords: [
    "Restaurant Reservierung System Österreich",
    "WhatsApp Reservierung Restaurant",
    "Automatische Reservierungen Gastronomie",
    "Restaurant Software Österreich",
    "No-Show Reduzierung Restaurant",
    "Tischreservierung App",
    "KI Telefon Restaurant",
    "Gastronomie Software",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: "Michael Kleinlercher e.U.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Butlery: Dein Restaurant auf Autopilot",
    description: "Reservierungen per WhatsApp, Telefon und Online, vollautomatisch. Kein Anruf mehr in der Stoßzeit. Kein No-Show mehr. Butlery übernimmt alles.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Butlery: Dein Restaurant auf Autopilot",
    description: "Reservierungen per WhatsApp, Telefon und Online, vollautomatisch.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "-XaSjn6X11sApCYbt0TT03zvh7MhqFR93FECzOfM8jg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1A1A2E",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={SITE_LANG}>
      <head>
        {/* Ein @graph statt mehrerer Einzelblöcke: Organisation, Gründer,
            Website und Produkt sind über @id verknüpft. Das hilft Google und
            den KI-Suchen, Butlery als eine Entität zu erkennen. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdGraph(
              organizationSchema,
              founderSchema,
              websiteSchema,
              softwareSchema
            ),
          }}
        />
      </head>
      <body className={playfair.variable}>
        {children}
        {/* Steht im Layout, nicht auf der Landing Page: die Einwilligung gilt
            fuer die ganze Seite, also muss der Banner auch auf Blog, Presse,
            Preisen und Buchungsseite erscheinen. Vorher lag er nur in
            page.tsx — wer ueber einen Blogartikel einstieg, sah ihn nie. */}
        <CookieConsent />
      </body>
    </html>
  );
}
