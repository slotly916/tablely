import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { getAllPosts, formatDate } from "@/lib/blog";
import {
  FOUNDER_ID,
  ORG_ID,
  SITE_LANG,
  abs,
  breadcrumbSchema,
  jsonLdGraph,
  pageMeta,
} from "@/lib/seo";

const SERIF = "var(--font-playfair), Georgia, serif";

export const metadata: Metadata = pageMeta({
  path: "/blog",
  title: "Blog: KI und Reservierungen in der Gastronomie | Butlery",
  description:
    "Wie Butlery entstanden ist, wie die KI arbeitet und was sich in der Gastronomie damit ändert. Geschrieben von Michael Kleinlercher.",
});

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(
            {
              "@type": "Blog",
              "@id": abs("/blog"),
              name: "Butlery Blog",
              url: abs("/blog"),
              inLanguage: SITE_LANG,
              author: { "@id": FOUNDER_ID },
              publisher: { "@id": ORG_ID },
              blogPost: posts.map((p) => ({
                "@type": "BlogPosting",
                headline: p.title,
                description: p.teaser,
                datePublished: p.date,
                url: abs(`/blog/${p.slug}`),
              })),
            },
            breadcrumbSchema([["Blog", "/blog"]])
          ),
        }}
      />
      <section style={{ padding: "90px 32px 40px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(34px,5vw,52px)", fontWeight: 700, letterSpacing: "-1.8px", lineHeight: 1.08, marginBottom: "16px" }}>
            Blog
          </h1>
          <p style={{ fontSize: "17px", color: "var(--muted)", lineHeight: 1.8, fontWeight: 300 }}>
            Wie Butlery entstanden ist, wie die KI arbeitet und was ich unterwegs über die Gastronomie gelernt habe.
          </p>
        </div>
      </section>

      <section style={{ padding: "0 32px 110px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          {posts.map((post, i) => (
            <article
              key={post.slug}
              style={{
                padding: "34px 0",
                borderTop: "1px solid var(--border)",
                borderBottom: i === posts.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <time
                dateTime={post.date}
                style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "10px" }}
              >
                {formatDate(post.date)}
              </time>
              <h2 style={{ fontFamily: SERIF, fontSize: "clamp(22px,3vw,28px)", fontWeight: 700, letterSpacing: "-0.8px", lineHeight: 1.2, marginBottom: "10px" }}>
                <Link href={`/blog/${post.slug}`} style={{ color: "var(--dark)", textDecoration: "none" }}>
                  {post.title}
                </Link>
              </h2>
              <p style={{ fontSize: "15.5px", color: "var(--muted)", lineHeight: 1.8, fontWeight: 300, marginBottom: "14px" }}>
                {post.teaser}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "14px", fontWeight: 500, color: "var(--orange)", textDecoration: "none" }}
              >
                Weiterlesen
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <path d="M3.5 7.5h8M8 4l3.5 3.5L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
