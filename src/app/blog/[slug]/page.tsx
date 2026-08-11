import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import { POSTS, getPost, formatDate } from "@/lib/blog";
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

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  // Unbekannter Slug endet in notFound(). Der Titel darf trotzdem kein
  // Canonical der Startseite erben, deshalb auch hier pageMeta.
  if (!post) {
    return pageMeta({
      path: `/blog/${slug}`,
      title: "Artikel nicht gefunden | Butlery",
      description: "Diesen Artikel gibt es nicht mehr.",
      index: false,
    });
  }
  return pageMeta({
    path: `/blog/${post.slug}`,
    title: `${post.title} | Butlery`,
    description: post.teaser,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.date,
  });
}

export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <PageShell>
      {/* BlogPosting + Breadcrumb: Autor, Datum und Herausgeber sind über @id
          mit der Organisation aus dem Root-Layout verknüpft. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(
            {
              "@type": "BlogPosting",
              headline: post.title,
              description: post.teaser,
              inLanguage: SITE_LANG,
              datePublished: post.date,
              dateModified: post.date,
              mainEntityOfPage: { "@type": "WebPage", "@id": abs(`/blog/${post.slug}`) },
              url: abs(`/blog/${post.slug}`),
              author: { "@id": FOUNDER_ID },
              publisher: { "@id": ORG_ID },
              isPartOf: { "@type": "Blog", "@id": abs("/blog"), name: "Butlery Blog" },
            },
            breadcrumbSchema([
              ["Blog", "/blog"],
              [post.title, `/blog/${post.slug}`],
            ])
          ),
        }}
      />

      {/* Lesetypografie: ~680px Textbreite, grosse Zeilenhöhe, ruhige Abstände. */}
      <style>{`
        .prose{font-size:17.5px;line-height:1.85;color:#33333F;font-weight:300;}
        .prose p{margin:0 0 22px;}
        .prose h2{font-family:${SERIF};font-size:26px;font-weight:700;color:var(--dark);
                  letter-spacing:-0.7px;line-height:1.25;margin:44px 0 14px;}
        .prose h2:first-child{margin-top:0;}
        .prose a{color:var(--orange);text-decoration:none;border-bottom:1px solid rgba(255,92,53,.35);}
        .prose a:hover{border-bottom-color:var(--orange);}
        .prose ul{margin:0 0 22px;padding-left:22px;}
        .prose li{margin-bottom:8px;}
        .prose strong{font-weight:600;color:var(--dark);}
        @media(max-width:768px){.prose{font-size:16.5px;}.prose h2{font-size:23px;}}
      `}</style>

      <article style={{ padding: "70px 32px 100px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <Link
            href="/blog"
            style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13.5px", color: "var(--muted)", textDecoration: "none", marginBottom: "34px" }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Alle Artikel
          </Link>

          <time dateTime={post.date} style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "12px" }}>
            {formatDate(post.date)}
          </time>

          <h1 style={{ fontFamily: SERIF, fontSize: "clamp(30px,4.6vw,44px)", fontWeight: 700, letterSpacing: "-1.5px", lineHeight: 1.12, marginBottom: "20px" }}>
            {post.title}
          </h1>

          <p style={{ fontSize: "18px", color: "var(--muted)", lineHeight: 1.8, fontWeight: 300, marginBottom: "18px" }}>
            {post.teaser}
          </p>

          <div style={{ fontSize: "13.5px", color: "var(--muted)", paddingBottom: "34px", marginBottom: "38px", borderBottom: "1px solid var(--border)" }}>
            Michael Kleinlercher · Gründer von Butlery
          </div>

          {/* Statisches, selbst verfasstes HTML aus src/lib/blog.ts — kein Nutzer-Input. */}
          <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />

          <div style={{ marginTop: "56px", paddingTop: "34px", borderTop: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <Link
              href="/demo"
              style={{ display: "inline-flex", alignItems: "center", gap: "9px", background: "var(--orange)", color: "#fff", padding: "14px 28px", borderRadius: "100px", fontSize: "15px", fontWeight: 500, textDecoration: "none" }}
            >
              Live Demo ansehen
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path d="M3.5 7.5h8M8 4l3.5 3.5L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/blog"
              style={{ display: "inline-flex", alignItems: "center", padding: "14px 26px", borderRadius: "100px", border: "1px solid var(--border)", color: "var(--muted)", fontSize: "15px", fontWeight: 500, textDecoration: "none" }}
            >
              Weitere Artikel
            </Link>
          </div>
        </div>
      </article>
    </PageShell>
  );
}
