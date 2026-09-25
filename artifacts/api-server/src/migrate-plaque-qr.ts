import { and, eq, isNull } from "drizzle-orm";
import { auditTable, db, plaquesTable } from "@workspace/db";
import { decrypt, encrypt } from "./lib/crypto";
import { replacePlaqueQr } from "./lib/plaque-qr-migration";
import { configuredVerificationOrigin, newVerificationCode, verificationHash, verificationUrl } from "./lib/public-verification";

async function checkPublicVerification(origin: string) {
  // A successful SPA shell alone is not enough: the public API must also be reachable.
  for (const [path, expected] of [["/verification", 200], ["/api/healthz", 200]] as const) {
    const response = await fetch(new URL(path, origin), {
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: { Accept: path === "/verification" ? "text/html" : "application/json" },
    });
    if (response.status !== expected || new URL(response.url).origin !== origin) {
      throw new Error(`${path} n'est pas disponible publiquement sur l'origine configurée`);
    }
    const content = await response.text();
    if (path === "/verification" && !content.includes("<html")) throw new Error("/verification ne sert pas une page HTML");
    if (path === "/api/healthz" && !content.includes('"status":"ok"')) throw new Error("API publique indisponible");
  }
}

export async function main(args: string[]) {
  const apply = args.includes("--apply");
  if (args.some((arg) => arg !== "--apply")) throw new Error("Usage : pnpm --filter @workspace/api-server run qr:migrate [--apply]");
  const origin = configuredVerificationOrigin();
  await checkPublicVerification(origin);

  const rows = await db.select().from(plaquesTable);
  const updates: { row: typeof plaquesTable.$inferSelect; svg: string; newToken: string | null }[] = [];
  for (const row of rows) {
    if (Boolean(row.publicTokenEncrypted) !== Boolean(row.publicTokenHash)) throw new Error(`Code incomplet pour la plaque ${row.id} : arrêt`);
    const newToken = row.publicTokenEncrypted ? null : newVerificationCode();
    const token = newToken ?? decrypt(row.publicTokenEncrypted!);
    if (row.publicTokenHash && verificationHash(token) !== row.publicTokenHash) throw new Error(`Code invalide pour la plaque ${row.id} : arrêt`);
    const svg = replacePlaqueQr(row.svg, verificationUrl(token));
    if (svg !== row.svg || newToken) {
      if (row.imprimeLe) throw new Error(`Plaque ${row.id} déjà imprimée : un SVG en base ne peut pas corriger un QR physique`);
      updates.push({ row, svg, newToken });
    }
  }

  // Do not print codes, URLs with fragments, or SVGs in command output.
  process.stdout.write(`${updates.length} plaque(s) à actualiser sur ${rows.length}, dont ${updates.filter(({ newToken }) => newToken).length} sans code existant. Mode : ${apply ? "application" : "simulation"}.\n`);
  if (!apply || updates.length === 0) return;
  await db.transaction(async (tx) => {
    for (const { row, svg, newToken } of updates) {
      const [updated] = await tx.update(plaquesTable).set({
        svg,
        ...(newToken ? { publicTokenHash: verificationHash(newToken), publicTokenEncrypted: encrypt(newToken) } : {}),
      }).where(and(
        eq(plaquesTable.id, row.id),
        eq(plaquesTable.svg, row.svg),
        isNull(plaquesTable.imprimeLe),
        row.publicTokenHash ? eq(plaquesTable.publicTokenHash, row.publicTokenHash) : isNull(plaquesTable.publicTokenHash),
      )).returning({ id: plaquesTable.id });
      if (!updated) throw new Error(`Plaque ${row.id} modifiée entre la lecture et l'écriture : annulation`);
      await tx.insert(auditTable).values({
        utilisateurId: "system:qr-origin-migration",
        ficheId: row.ficheId,
        action: "ACTUALISATION_DOMAINE_QR",
        donneesAvant: { plaqueId: row.id, version: row.version },
        donneesApres: { plaqueId: row.id, version: row.version, origine: origin },
      });
    }
  });
  process.stdout.write(`${updates.length} plaque(s) actualisée(s) sans changer leur identifiant, version ni code.\n`);
}