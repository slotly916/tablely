import type { Metadata } from "next";
import { breadcrumbSchema, jsonLdGraph, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/presse",
  title: "Butlery in der Presse: ORF, TT und top.tirol",
  description:
    "Berichte über Butlery und Gründer Michael Kleinlercher: ORF Tirol heute, Tiroler Tageszeitung und top.tirol. Alle Beiträge im Überblick.",
});

export default function PresseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(breadcrumbSchema([["Presse", "/presse"]])),
        }}
      />
      {children}
    </>
  );
}
