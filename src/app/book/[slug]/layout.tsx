import type { Metadata } from "next";
import { ORG_ID, abs, jsonLdGraph, pageMeta } from "@/lib/seo";

// Die Buchungsseite ist eine Client-Komponente: ohne diesen Layer traegt jede
// Restaurant-Buchungsseite den Titel und das Canonical der Startseite.
// Deshalb wird der Restaurantname hier serverseitig geholt.

type BookingRestaurant = { name: string; address: string | null; phone: string | null };

async function loadRestaurant(slug: string): Promise<BookingRestaurant | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const res = await fetch(
      `${url}/rest/v1/restaurants?slug=eq.${encodeURIComponent(slug)}&select=name,address,phone&limit=1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        // Eine Stunde Cache: der Name eines Restaurants aendert sich selten,
        // und die Metadaten sollen die Buchungsseite nicht ausbremsen.
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const row = ((await res.json()) as BookingRestaurant[])?.[0];
    if (!row) return null;
    // Manche Namen und Adressen haben fuehrende/anhaengende Leerzeichen in der
    // DB. Im Titel faellt das als doppeltes Leerzeichen auf.
    return {
      name: row.name?.trim() ?? "",
      address: row.address?.trim() || null,
      phone: row.phone?.trim() || null,
    };
  } catch {
    // Metadaten duerfen die Seite nie zum Absturz bringen.
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await loadRestaurant(slug);

  // Unbekannter Slug: die Seite rendert einen "Restaurant nicht gefunden"-
  // Hinweis. So etwas gehoert nicht in den Index.
  if (!restaurant) {
    return pageMeta({
      path: `/book/${slug}`,
      title: "Tisch reservieren | Butlery",
      description: "Reserviere online einen Tisch.",
      index: false,
    });
  }

  const ort = restaurant.address ? ` (${restaurant.address})` : "";
  return pageMeta({
    path: `/book/${slug}`,
    title: `Tisch reservieren bei ${restaurant.name} | Butlery`,
    description: `Online einen Tisch bei ${restaurant.name}${ort} reservieren: Datum, Uhrzeit und Personenzahl auswählen, Bestätigung sofort per E-Mail.`,
  });
}

export default async function BookLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await loadRestaurant(slug);

  return (
    <>
      {restaurant && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdGraph({
              "@type": "Restaurant",
              name: restaurant.name,
              url: abs(`/book/${slug}`),
              acceptsReservations: true,
              ...(restaurant.address ? { address: restaurant.address } : {}),
              ...(restaurant.phone ? { telephone: restaurant.phone } : {}),
              potentialAction: {
                "@type": "ReserveAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: abs(`/book/${slug}`),
                  inLanguage: "de-AT",
                  actionPlatform: [
                    "http://schema.org/DesktopWebPlatform",
                    "http://schema.org/MobileWebPlatform",
                  ],
                },
                result: { "@type": "FoodEstablishmentReservation", name: "Tischreservierung" },
              },
              provider: { "@id": ORG_ID },
            }),
          }}
        />
      )}
      {children}
    </>
  );
}
