import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../artifacts/api-server/src/app";
import { seedAdminIfMissing } from "../artifacts/api-server/src/lib/bootstrap";
import { logger } from "../artifacts/api-server/src/lib/logger";

let bootstrapPromise: Promise<void> | undefined;

function ensureBootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = seedAdminIfMissing().catch((err: unknown) => {
      bootstrapPromise = undefined;
      logger.error({ err }, "API bootstrap failed");
      throw err;
    });
  }

  return bootstrapPromise;
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

  app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}