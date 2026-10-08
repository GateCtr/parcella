import type { IncomingMessage, ServerResponse } from "node:http";

// The runtime implementation is the bundled Vercel handler produced by the
// api-server build (build.mjs --vercel). It is a plain .js re-export without a
// matching .d.ts, so we annotate the imported value explicitly to avoid an
// implicit-any error under the strict TypeScript settings Vercel applies when
// typechecking this function entry.
type VercelNodeHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => void | Promise<void>;

// @ts-expect-error — untyped .js bundle produced at build time; typed below.
import apiHandler from "../artifacts/api-server/api/index.js";

const handler: VercelNodeHandler = apiHandler;

export default handler;
