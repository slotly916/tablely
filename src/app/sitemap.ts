import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";
import { POSTS } from "@/lib/blog";

// Nur indexierbare Seiten. Impressum, Datenschutz, AGB, Login, Dashboard,
// Upgrade, Feedback und /links stehen auf noindex und gehoeren deshalb nicht
// in die Sitemap — sonst widersprechen sich Sitemap und robots-Meta.
// lastModified wird nur dort gesetzt, wo ein echtes Datum existiert (Blog).
// Ein "new Date()" bei jedem Build waere ein Datum, das nichts aussagt.
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
  { path: "/demo", priority: 0.8, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/presse", priority: 0.6, changeFrequency: "monthly" },
  { path: "/ki-transparenz", priority: 0.5, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
      url: abs(path),
      changeFrequency,
      priority,
    })),
    ...POSTS.map((post) => ({
      url: abs(`/blog/${post.slug}`),
      lastModified: new Date(post.date),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
