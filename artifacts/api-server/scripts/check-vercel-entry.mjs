// Check the generated function with production logging (no development workers).
process.env.NODE_ENV = "production";

const required = ["DATABASE_URL", "SESSION_SECRET"];
const missing = required.filter((key) => !Object.hasOwn(process.env, key));
if (missing.length > 0) {
  throw new Error(
    `Missing Vercel API environment variables: ${missing.join(", ")}. ` +
      "Set them in the API project's Environment Variables for this deployment environment.",
  );
}

const { default: handler } = await import("../api/index.js");
if (typeof handler !== "function") {
  throw new Error("Vercel API entry must export a request handler.");
}