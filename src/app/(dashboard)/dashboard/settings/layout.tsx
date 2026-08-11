import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/dashboard/settings",
  title: "Einstellungen | Butlery",
  description: "Tische, Bereiche und Öffnungszeiten verwalten.",
  index: false,
});

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
