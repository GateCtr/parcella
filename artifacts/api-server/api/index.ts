import type { IncomingMessage, RequestListener, ServerResponse } from "node:http";
import app from "../src/app.js";
import { seedAdminIfMissing } from "../src/lib/bootstrap.js";
import { logger } from "../src/lib/logger.js";

let bootstrapPromise: Promise<void> | undefined;

function ensureBootstrap(): Promise<void> {
  const promise = bootstrapPromise ?? seedAdminIfMissing().catch((err: unknown) => {
    bootstrapPromise = undefined;
    logger.error({ err }, "API bootstrap failed");
    throw err;
  });
  bootstrapPromise = promise;
  return promise;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    await ensureBootstrap();
  } catch {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Service temporarily unavailable" }));
    return;
  }

  // Express apps implement Node's request listener contract at runtime.
  const listener = app as unknown as RequestListener;
  listener(req, res);
}