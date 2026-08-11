import type { Metadata } from "next";
import { breadcrumbSchema, jsonLdGraph, pageMeta } from "@/lib/seo";

// Die Preisseite ist eine Client-Komponente und kann selbst kein `metadata`
// exportieren. Deshalb liegt es hier im Layout.
export const metadata: Metadata = pageMeta({
  path: "/pricing",
  title: "Preise: Standard, Plus und Premium | Butlery",
  description:
    "Alle Butlery-Tarife im Überblick: Standard 90 Euro, Plus 129 Euro und Premium 249 Euro pro Monat. Monatlich kündbar, keine Einrichtungsgebühr.",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(breadcrumbSchema([["Preise", "/pricing"]])),
        }}
      />
      {children}
    </>
  );
}
