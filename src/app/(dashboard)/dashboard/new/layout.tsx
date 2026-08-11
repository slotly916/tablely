import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/dashboard/new",
  title: "Neue Reservierung | Butlery",
  description: "Reservierung manuell anlegen.",
  index: false,
});

export default function NewReservationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
