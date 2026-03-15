import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Tablely – Reservierungen auf Autopilot | Für Restaurants in Österreich",
  description: "Tablely automatisiert Reservierungen per WhatsApp, Telefon und Online. Die KI antwortet automatisch, trägt alles ins Dashboard ein und erinnert deine Gäste. Kein Stress mehr in der Stoßzeit.",
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
  authors: [{ name: "Tablely", url: "https://tablely.at" }],
  creator: "Tablely",
  publisher: "Tablely",
  metadataBase: new URL("https://tablely.at"),
  alternates: {
    canonical: "https://tablely.at",
  },
  openGraph: {
    type: "website",
    locale: "de_AT",
    url: "https://tablely.at",
    siteName: "Tablely",
    title: "Tablely – Dein Restaurant auf Autopilot",
    description: "Reservierungen per WhatsApp, Telefon und Online — vollautomatisch. Kein Anruf mehr in der Stoßzeit. Kein No-Show mehr. Tablely übernimmt alles.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tablely – Reservierungen auf Autopilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tablely – Dein Restaurant auf Autopilot",
    description: "Reservierungen per WhatsApp, Telefon und Online — vollautomatisch.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <meta name="google-site-verification" content="-XaSjn6X11sApCYbt0TT03zvh7MhqFR93FECzOfM8jg" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="theme-color" content="#FF5C35" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Tablely",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://tablely.at",
              description: "Automatische Reservierungen per WhatsApp, Telefon und Online für Restaurants in Österreich.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
                description: "Warteliste — kostenloser Frühzugang",
              },
              provider: {
                "@type": "Organization",
                name: "Tablely",
                url: "https://tablely.at",
              },
            }),
          }}
        />
      </head>
      <body className={`${playfair.variable} ${dmSans.variable}`}>
        {children}
      </body>
    </html>
  );
}