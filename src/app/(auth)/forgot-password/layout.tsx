import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/forgot-password",
  title: "Passwort zurücksetzen | Butlery",
  description: "Link zum Zurücksetzen des Passworts anfordern.",
  index: false,
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
