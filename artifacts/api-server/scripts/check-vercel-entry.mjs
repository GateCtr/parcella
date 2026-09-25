// Check the generated function with production logging (no development workers).
process.env.NODE_ENV = "production";

const { default: handler } = await import("../api/index.js");
if (typeof handler !== "function") {
  throw new Error("Vercel API entry must export a request handler.");
}