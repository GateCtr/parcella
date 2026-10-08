import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

/**
 * Centralised Express error handler.
 *
 * Without this, any thrown error or `next(err)` in a route falls through to
 * Express's default handler, which returns an opaque HTML 500 and logs nothing
 * structured — making production failures (e.g. a database connection error on
 * a simple GET /api/auth/me) impossible to diagnose from the Vercel logs.
 *
 * Here we log the full error server-side (never leaked to the client) and
 * return a clean JSON 500. The optional `code` of PostgreSQL/driver errors is
 * surfaced in the logs to speed up diagnosis (e.g. 42P01 = undefined table →
 * migrations not applied; ECONNREFUSED/28P01 = bad DATABASE_URL/credentials).
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const details: Record<string, unknown> = {
    method: req.method,
    url: req.url?.split("?")[0],
  };
  if (err instanceof Error) {
    details.message = err.message;
    details.name = err.name;
  }
  if (typeof err === "object" && err !== null && "code" in err) {
    details.code = (err as { code: unknown }).code;
  }
  logger.error({ err, ...details }, "Unhandled API error");

  if (res.headersSent) return;
  res.status(500).json({ error: "Erreur interne du serveur" });
}
