import { build } from "esbuild";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await build({
  entryPoints: [path.join(root, "src/migrate-plaque-qr.ts")],
  platform: "node",
  format: "cjs",
  bundle: true,
  write: false,
});
const module = { exports: {} };
new Function("require", "module", "exports", result.outputFiles[0].text)(
  createRequire(import.meta.url), module, module.exports,
);
await module.exports.main(process.argv.slice(2));