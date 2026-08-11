import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

// Link-in-Bio-Seite: sammelt nur Verweise, die es alle schon woanders gibt.
// noindex, aber follow, damit die Verlinkungen weiterhin gewertet werden.
export const metadata: Metadata = pageMeta({
  path: "/links",
  title: "Butlery Links",
  description: "Alle Kanäle von Butlery auf einen Blick: Website, Instagram, TikTok und Kontakt.",
  index: false,
});

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
