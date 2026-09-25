import type { NextFunction, Request, Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { hashSessionToken } from "../lib/user-auth";
import { configuredVerificationOrigin } from "../lib/public-verification";

export type SessionUser = Pick<typeof usersTable.$inferSelect, "id" | "email" | "role">;

declare global {
  namespace Express {
    interface Request {
      currentUser?: SessionUser;
    }
  }
}

export function sessionCookieValue(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const cookie = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith("registre_session="));
  return cookie?.slice("registre_session=".length);
}

export function protectUnsafeRequests(req: Request, res: Response, next: NextFunction): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const origin = req.get("origin");
  const host = req.get("host");
  if (!origin || !host) {
    res.status(403).json({ error: "Origine de requête invalide" });
    return;
  }

  try {
    const parsed = new URL(origin);
    const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const expectedProtocol = forwardedProtocol || (req.secure ? "https" : "http");
    const sameOrigin = parsed.host.toLowerCase() === host.toLowerCase() &&
      parsed.protocol === `${expectedProtocol}:`;
    // On a separate Vercel deployment, the frontend proxies /api to this host.
    // The browser's Origin is the frontend, but its session cookie stays first-party.
    const publicOrigin = process.env.PUBLIC_VERIFICATION_ORIGIN
      ? configuredVerificationOrigin()
      : undefined;
    const trustedFrontend = expectedProtocol === "https" && parsed.origin === publicOrigin;
    if (!sameOrigin && !trustedFrontend) {
      res.status(403).json({ error: "Origine de requête invalide" });
      return;
    }
  } catch {
    res.status(403).json({ error: "Origine de requête invalide" });
    return;
  }
  next();
}

export async function loadCurrentUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = sessionCookieValue(req);
    if (!token) {
      next();
      return;
    }
    const [record] = await db.select({ session: sessionsTable, user: usersTable })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
      .where(and(
        eq(sessionsTable.tokenHash, hashSessionToken(token)),
        gt(sessionsTable.expiresAt, new Date()),
        eq(usersTable.active, true),
      ))
      .limit(1);
    if (record) {
      req.currentUser = {
        id: record.user.id,
        email: record.user.email,
        role: record.user.role,
      };
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.currentUser) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      res.status(401).json({ error: "Authentification requise" });
      return;
    }
    if (!roles.includes(req.currentUser.role)) {
      res.status(403).json({ error: "Accès interdit" });
      return;
    }
    next();
  };
}