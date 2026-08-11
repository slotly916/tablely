// Zentrale SEO-Konstanten und Metadaten-Helfer.
//
// WARUM DIESE DATEI EXISTIERT:
// Next.js vererbt Metadata vom Root-Layout an jede Route, die das Feld nicht
// selbst setzt. Da das Root-Layout die Startseite beschreibt, wuerde jede
// Unterseite ohne eigenes `alternates`/`openGraph` das Canonical und die
// og:url der Startseite ausliefern (Duplicate Content). `pageMeta()` setzt
// beides immer explizit — jede neue Route sollte darueber laufen.

import type { Metadata } from "next";

export const SITE_URL = "https://tablely.at";
export const SITE_NAME = "Butlery";
export const SITE_LOCALE = "de_AT";
export const SITE_LANG = "de-AT";
export const SOCIAL_IMAGE_ALT = "Butlery: Reservierungen per WhatsApp, Telefon und Online";

/** Absolute URL aus einem Pfad ("/blog" -> "https://tablely.at/blog"). */
export function abs(path: string): string {
  if (path === "/" || path === "") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetaInput = {
  /** Pfad ab Domain-Wurzel, z.B. "/pricing". */
  path: string;
  title: string;
  description: string;
  /** false = noindex,follow (App-, Konto- und Rechtsseiten). */
  index?: boolean;
  /** Abweichendes Social-Bild (Standard: generiertes /opengraph-image). */
  image?: string;
  /** "article" fuer Blogbeitraege. */
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function pageMeta({
  path,
  title,
  description,
  index = true,
  image,
  type = "website",
  publishedTime,
  modifiedTime,
}: PageMetaInput): Metadata {
  const url = abs(path);
  // Die Dateikonvention app/opengraph-image.tsx gilt nur fuer "/" und wird von
  // Next NICHT an Unterseiten vererbt. Ohne diese Zeile haette jede Unterseite
  // gar kein Vorschaubild. Der Pfad zeigt auf dieselbe generierte Karte.
  const socialImage = image ?? `${SITE_URL}/opengraph-image`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: SITE_LOCALE,
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: socialImage, width: 1200, height: 630, alt: SOCIAL_IMAGE_ALT }],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
      // noindex, aber follow: interne Links sollen weiterhin verfolgt werden.
      : { index: false, follow: true, googleBot: { index: false, follow: true } },
  };
}

/* ============ STRUKTURIERTE DATEN ============ */
// Nur belegbare Angaben aus dem Impressum, der Preisseite und der Linkseite.
// Keine erfundenen Bewertungen, Mitarbeiterzahlen oder Gruendungsdaten.

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const SOFTWARE_ID = `${SITE_URL}/#software`;
export const FOUNDER_ID = `${SITE_URL}/#michael-kleinlercher`;

export const organizationSchema = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE_NAME,
  legalName: "Michael Kleinlercher e.U.",
  alternateName: "Michael Kleinlercher e.U.",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/butlery-logo-dunkel.png`,
    width: 1416,
    height: 496,
  },
  image: `${SITE_URL}/butlery-logo-dunkel.png`,
  description:
    "Butlery ist eine KI-gestuetzte Reservierungssoftware fuer Restaurants in Oesterreich. Reservierungen per WhatsApp, Telefon und Online laufen in ein gemeinsames Dashboard.",
  email: "info@tablely.at",
  telephone: "+436601109224",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Bruggen 94",
    postalCode: "9962",
    addressLocality: "St. Veit in Defereggen",
    addressRegion: "Tirol",
    addressCountry: "AT",
  },
  founder: { "@id": FOUNDER_ID },
  areaServed: { "@type": "Country", name: "Oesterreich" },
  sameAs: [
    "https://www.instagram.com/Butlery.app",
    "https://www.tiktok.com/@Butlery",
  ],
} as const;

export const founderSchema = {
  "@type": "Person",
  "@id": FOUNDER_ID,
  name: "Michael Kleinlercher",
  url: `${SITE_URL}/blog/warum-ich-tablely-gebaut-habe`,
  jobTitle: "Gruender",
  worksFor: { "@id": ORG_ID },
  image: `${SITE_URL}/Michael_Kleinlercher.jpg`,
} as const;

export const websiteSchema = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: SITE_LANG,
  publisher: { "@id": ORG_ID },
} as const;

// Preise gespiegelt aus src/app/pricing/page.tsx (Standard 90, Premium 249).
// Bei Preisaenderungen mit anpassen, sonst weicht das Markup vom Sichtbaren ab.
export const softwareSchema = {
  "@type": "SoftwareApplication",
  "@id": SOFTWARE_ID,
  name: SITE_NAME,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Reservierungssoftware fuer Restaurants",
  operatingSystem: "Web",
  url: SITE_URL,
  inLanguage: SITE_LANG,
  description:
    "Automatische Reservierungen per WhatsApp, Telefon und Online fuer Restaurants in Oesterreich.",
  provider: { "@id": ORG_ID },
  publisher: { "@id": ORG_ID },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: "90",
    highPrice: "249",
    offerCount: 3,
    url: `${SITE_URL}/pricing`,
  },
} as const;

/** BreadcrumbList aus [Label, Pfad]-Paaren. "Start" wird vorangestellt. */
export function breadcrumbSchema(trail: [string, string][]) {
  const items: [string, string][] = [["Start", "/"], ...trail];
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: abs(path),
    })),
  };
}

/** Verpackt beliebig viele Knoten in einen @graph mit gemeinsamem @context. */
export function jsonLdGraph(...nodes: object[]) {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
}
