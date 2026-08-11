import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/admin",
  title: "Administration | Butlery",
  description: "Interner Bereich.",
  index: false,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
