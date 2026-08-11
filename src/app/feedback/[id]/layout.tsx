import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

// Gastfeedback zu einer konkreten Reservierung: personenbezogen, gehört nie in
// den Index. Canonical zeigt bewusst auf die Seite selbst, nicht auf die
// Startseite (sonst könnte Google das noindex auf das Canonical-Ziel beziehen).
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return pageMeta({
    path: `/feedback/${id}`,
    title: "Feedback zu deinem Besuch | Butlery",
    description: "Rückmeldung zu einer Reservierung geben.",
    index: false,
  });
}

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
