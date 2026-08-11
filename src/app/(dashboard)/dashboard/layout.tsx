import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

// Das Dashboard liegt hinter dem Login (Middleware leitet anonyme Zugriffe auf
// /login um). Trotzdem explizit noindex: falls die Middleware je gelockert
// wird, steht die Regel schon da.
export const metadata: Metadata = pageMeta({
  path: "/dashboard",
  title: "Dashboard | Butlery",
  description: "Reservierungen, Tischkarte und Walk-ins deines Restaurants.",
  index: false,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
