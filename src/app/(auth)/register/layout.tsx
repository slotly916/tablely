import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/register",
  title: "Konto erstellen | Butlery",
  description: "Butlery für dein Restaurant einrichten.",
  index: false,
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
