import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await build({
  entryPoints: [path.join(root, "src/lib/plaque-svg.ts")],
  platform: "node",
  format: "cjs",
  bundle: true,
  write: false,
  loader: { ".png": "dataurl" },
});
const source = result.outputFiles[0].text;
const module = { exports: {} };
new Function("require", "module", "exports", source)(createRequire(import.meta.url), module, module.exports);
const { plaqueSvg } = module.exports;
const example = plaqueSvg(
  { parcelleNo: "14", avenue: "Tshela", localite: "Foire Agricole", quartier: "Mama Yemo", commune: "Mont-Ngafula" },
  "EXEMPLE",
  "EXEMPLE FICTIF",
);
const sample = example.replace(
  /<\/svg>$/,
  '<text x="600" y="752" text-anchor="middle" fill="#b91c1c" font-family="Arial,sans-serif" font-size="23" font-weight="bold">EXEMPLE FICTIF — AUCUNE FICHE ENREGISTRÉE</text>\n</svg>',
);
await writeFile(path.join(root, "../registre-parcellaire/public/plaque-modele.svg"), sample);