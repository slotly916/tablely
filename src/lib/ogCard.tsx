import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Social-Preview-Karte. Vorher zeigte die Metadata auf /og-image.png — eine
// Datei, die es in public/ nie gab. Jede Vorschau auf WhatsApp, LinkedIn, X
// oder Slack lief damit ins Leere.
//
// Die Karte wird beim Build erzeugt (force-static in den Routen), das Logo
// also zur Buildzeit von der Platte gelesen. Kein Laufzeit-Dateizugriff.

import { SOCIAL_IMAGE_ALT } from "./seo";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";
export const ogAlt = SOCIAL_IMAGE_ALT;

export function renderOgCard() {
  const logo = readFileSync(join(process.cwd(), "public", "butlery-logo-hell.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#1A1A2E",
          padding: "80px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={520} height={182} alt="Butlery" />
        <div
          style={{
            display: "flex",
            marginTop: "44px",
            fontSize: "40px",
            color: "rgba(255,255,255,0.82)",
            textAlign: "center",
            lineHeight: 1.35,
          }}
        >
          Reservierungen per WhatsApp, Telefon und Online
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "22px",
            fontSize: "30px",
            color: "#FF5C35",
          }}
        >
          Für Restaurants in Österreich
        </div>
      </div>
    ),
    { ...ogSize }
  );
}
