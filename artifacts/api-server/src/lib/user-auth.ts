import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const SCRYPT_BYTES = 64;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateAccessCode(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAccessCode(code: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(code, salt, SCRYPT_BYTES).toString("hex");
  return { salt, hash };
}

export function verifyAccessCode(code: string, salt: string, hash: string): boolean {
  const actual = scryptSync(code, salt, SCRYPT_BYTES);
  const expected = Buffer.from(hash, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}