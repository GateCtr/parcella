import { createHash, randomBytes } from "node:crypto";

export const newVerificationCode = () => randomBytes(32).toString("base64url");
export const verificationHash = (code: string) =>
  createHash("sha256").update(code).digest("hex");

export function verificationUrl(code: string): string {
  const configured = process.env.PUBLIC_VERIFICATION_ORIGIN;
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  const origin = configured ?? (domain ? `https://${domain}` : undefined);
  if (!origin) throw new Error("Aucun domaine de vérification publique configuré");
  const parsed = new URL(origin);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("Le domaine de vérification publique doit être une origine HTTPS");
  }
  const url = new URL("/verification", parsed);
  // A fragment is never sent in HTTP requests or Referer headers.
  url.hash = `code=${code}`;
  return url.toString();
}