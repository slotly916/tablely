import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/onboarding",
  title: "Einrichtung | Butlery",
  description: "Restaurant, Tische und Öffnungszeiten einrichten.",
  index: false,
});

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
