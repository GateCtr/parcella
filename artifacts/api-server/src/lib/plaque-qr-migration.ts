import { plaqueQrPath } from "./plaque-qr";

// Replace only the generated QR path. Preserve all other SVG content, version and layout.
const qrAtEnd = /<path d="[^"]*" fill="#111"\/>(\s*<\/svg>)$/;

export function replacePlaqueQr(svg: string, url: string): string {
  const matches = svg.match(qrAtEnd);
  if (!svg.includes('id="plaque-layout-v8"') || !svg.includes("data-address-key=") || !svg.trimEnd().endsWith("</svg>")) {
    throw new Error("SVG de plaque inconnu : migration QR interrompue");
  }
  if (matches) return svg.replace(qrAtEnd, `${plaqueQrPath(url)}${matches[1]}`);
  // Some pre-verification v8 plaques have no QR yet; add one in the same reserved area.
  if (svg.includes('fill="#111"') || svg.includes('x="938" y="504"')) {
    throw new Error("QR inconnu dans le SVG : migration interrompue");
  }
  return svg.replace(/<\/svg>$/, `<rect x="938" y="504" width="164" height="164" fill="#fff"/>\n${plaqueQrPath(url)}\n</svg>`);
}