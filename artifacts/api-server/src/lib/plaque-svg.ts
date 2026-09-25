import type { fichesTable } from "@workspace/db";
import kinshasaSeal from "../assets/kinshasa-seal.png";
import { plaqueQrPath } from "./plaque-qr";

type FicheRow = typeof fichesTable.$inferSelect;

const xml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]!);

function star(cx: number, cy: number, outer: number, inner: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 === 0 ? outer : inner;
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(" ");
}

function textLine(label: string, y: number, centerX = 535, maxWidth = 780) {
  const fontSize = Math.min(96, Math.max(40, Math.floor(1200 / (label.length * 0.68))));
  const fit = fontSize * label.length * 0.68 > maxWidth ? ` textLength="${maxWidth}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<text x="${centerX}" y="${y}" text-anchor="middle" fill="#193761" font-family="Arial Narrow,DejaVu Sans Condensed,Arial,sans-serif" font-weight="900" font-stretch="condensed" font-size="${fontSize}"${fit}>${xml(label)}</text>`;
}

export function plaqueSvg(f: FicheRow, plaqueNo: string, verificationUrl: string) {
  const isRue = /^rue\b/i.test(f.avenue.trim());
  const address = f.avenue.replace(/^(?:av(?:enue)?|rue)[.\s]+/i, "").trim();
  const addressKey = encodeURIComponent(JSON.stringify([f.parcelleNo, f.avenue, f.localite ?? "", f.quartier, f.commune])).replace(/'/g, "%27");
  const numberFontSize = Math.min(230, Math.max(48, Math.floor(760 / (f.parcelleNo.length * 0.65))));
  const numberFit = numberFontSize * f.parcelleNo.length * 0.65 > 760 ? ' textLength="760" lengthAdjust="spacingAndGlyphs"' : "";
  // Align the QR's bottom edge with the C/ address baseline.
  const qrX = 956;
  const qrSize = 128;
  const qrY = 650 - qrSize;
  const quietZone = 18;

  const border = "M112 24 H1088 C1088 63 1114 83 1176 83 V717 C1114 717 1088 737 1088 776 H112 C112 737 86 717 24 717 V83 C86 83 112 63 112 24 Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" data-address-key="${addressKey}" aria-label="Plaque parcellaire ${xml(plaqueNo)}">
<title>Plaque parcellaire ${xml(plaqueNo)} — ${xml(f.commune)}</title>
 <defs>
   <linearGradient id="border-horizontal" gradientUnits="userSpaceOnUse" x1="112" y1="0" x2="1088" y2="0">
     <stop offset="0%" stop-color="#193761"/><stop offset="17%" stop-color="#193761"/>
     <stop offset="29%" stop-color="#65bd80"/><stop offset="37%" stop-color="#ffe57a"/>
     <stop offset="48%" stop-color="#ce1126"/><stop offset="57%" stop-color="#ce1126"/>
     <stop offset="68%" stop-color="#ffe57a"/><stop offset="78%" stop-color="#65bd80"/>
     <stop offset="89%" stop-color="#193761"/><stop offset="100%" stop-color="#193761"/>
   </linearGradient>
   <linearGradient id="border-vertical" gradientUnits="userSpaceOnUse" x1="0" y1="83" x2="0" y2="717">
     <stop offset="0%" stop-color="#193761"/><stop offset="27%" stop-color="#193761"/>
     <stop offset="38%" stop-color="#65bd80"/><stop offset="45%" stop-color="#ffe57a"/>
     <stop offset="52%" stop-color="#ce1126"/><stop offset="59%" stop-color="#ce1126"/>
     <stop offset="67%" stop-color="#ffe57a"/><stop offset="75%" stop-color="#65bd80"/>
     <stop offset="85%" stop-color="#193761"/><stop offset="100%" stop-color="#193761"/>
   </linearGradient>
 </defs>
<rect width="1200" height="800" fill="#fff"/>
 <path d="${border}" fill="none" stroke="#193761" stroke-width="13"/>
 <path d="M112 24 H1088 M112 776 H1088" fill="none" stroke="url(#border-horizontal)" stroke-width="11"/>
 <path d="M24 83 V717 M1176 83 V717" fill="none" stroke="url(#border-vertical)" stroke-width="11"/>
<svg x="95" y="110" width="190" height="125" viewBox="0 0 960 640" aria-label="Drapeau de la RDC">
  <rect width="960" height="640" fill="#007fff"/>
  <path d="M0 565 850 0 H960 V87 L110 640 H0Z" fill="#f7d116"/>
  <path d="M0 604 909 0 H960 V47 L51 640 H0Z" fill="#ce1126"/>
  <polygon points="${star(175, 190, 134, 54)}" fill="#f7d116"/>
</svg>
 <image id="plaque-layout-v8" x="943" y="102" width="154" height="154" href="${kinshasaSeal}" preserveAspectRatio="xMidYMid meet"/>
 <text x="600" y="290" text-anchor="middle" fill="#193761" font-family="Arial Narrow,DejaVu Sans Condensed,Arial,sans-serif" font-weight="900" font-stretch="condensed" font-size="${numberFontSize}"${numberFit}>${xml(f.parcelleNo)}</text>
 ${textLine(`${isRue ? "RUE" : "AV."} ${address.toUpperCase()}`, 392, 600, 900)}
 ${textLine(`LOC/ ${(f.localite?.trim() || "—").toUpperCase()}`, 478, 600, 900)}
 ${textLine(`Q/ ${f.quartier.toUpperCase()}`, 564)}
 ${textLine(`C/ ${f.commune.toUpperCase()}`, 650)}
 <rect x="${qrX - quietZone}" y="${qrY - quietZone}" width="${qrSize + quietZone * 2}" height="${qrSize + quietZone * 2}" fill="#fff"/>
 ${plaqueQrPath(verificationUrl)}
</svg>`;
}