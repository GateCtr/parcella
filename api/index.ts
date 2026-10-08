// The runtime implementation is the bundled Vercel handler produced by the
// api-server build (build.mjs --vercel). It is a plain .js re-export without a
// matching .d.ts. Vercel typechecks this function entry from the repo root,
// where @types/node is not resolvable, so we must NOT import "node:http" here.
// We type the handler structurally with a minimal request-listener shape to
// avoid both the implicit-any error (TS7016) and a missing-node-types error
// (TS2307), without depending on any ambient type definitions.
type NodeRequestListener = (req: unknown, res: unknown) => void | Promise<void>;

// @ts-expect-error — untyped .js bundle produced at build time; typed below.
import apiHandler from "../artifacts/api-server/api/index.js";

const handler: NodeRequestListener = apiHandler;

export default handler;
