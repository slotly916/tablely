import type { Metadata } from "next";
import { breadcrumbSchema, jsonLdGraph, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/demo",
  title: "Live-Demo: Reservierung in Echtzeit ansehen | Butlery",
  description:
    "Buche selbst als Gast über WhatsApp oder die Buchungsseite und sieh zu, wie die Reservierung sofort im Dashboard erscheint. Ohne Konto, ohne E-Mail.",
});

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(breadcrumbSchema([["Demo", "/demo"]])),
        }}
      />
      {children}
    </>
  );
}
