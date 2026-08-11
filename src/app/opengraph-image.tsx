import { ogAlt, ogContentType, ogSize, renderOgCard } from "@/lib/ogCard";

export const dynamic = "force-static";
export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOgCard();
}
