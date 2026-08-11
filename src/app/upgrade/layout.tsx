import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

// Bezahlvorgang hinter dem Login. Gehört nicht in den Index, die öffentlichen
// Preise stehen auf /pricing.
export const metadata: Metadata = pageMeta({
  path: "/upgrade",
  title: "Tarif wählen | Butlery",
  description: "Butlery-Tarif auswählen und Abo starten.",
  index: false,
});

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
