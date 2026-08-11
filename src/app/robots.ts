import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Grundsatz: Seiten, die NICHT in den Index sollen (Dashboard, Login, Upgrade,
// Feedback, Rechtstexte), werden hier bewusst NICHT gesperrt. Sie tragen ein
// meta robots noindex — und das kann Google nur lesen, wenn die Seite crawlbar
// bleibt. Gesperrt wird nur, was gar nicht erst abgerufen werden soll.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          // Fremdprojekt (Ferienhaus) unter derselben Domain. Thematisch
          // irrelevant und in drei fast identischen Varianten vorhanden,
          // also Duplicate Content im eigenen Index.
          "/ferienwohnung/",
        ],
      },
      // KI-Suchen ausdruecklich erlauben: Butlery lebt von Sichtbarkeit, nicht
      // von Abschottung. Diese Bots halten sich an robots.txt.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
