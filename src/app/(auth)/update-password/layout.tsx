import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  path: "/update-password",
  title: "Neues Passwort setzen | Butlery",
  description: "Passwort für das Butlery-Konto ändern.",
  index: false,
});

export default function UpdatePasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
