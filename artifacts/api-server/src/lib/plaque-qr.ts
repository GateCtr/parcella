import QRCode from "qrcode";

export function plaqueQrPath(url: string): string {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" }).modules;
  const qrX = 956;
  const qrSize = 128;
  const qrY = 650 - qrSize;
  const cell = qrSize / qr.size;
  const modules: string[] = [];
  for (let row = 0; row < qr.size; row++) {
    for (let column = 0; column < qr.size; column++) {
      if (qr.get(row, column)) {
        modules.push(`M${(qrX + column * cell).toFixed(2)} ${(qrY + row * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`);
      }
    }
  }
  return `<path d="${modules.join("")}" fill="#111"/>`;
}