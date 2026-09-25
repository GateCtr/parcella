const configuredApi = process.env.API_SERVER_ORIGIN?.trim();
if (!configuredApi) {
  throw new Error("API_SERVER_ORIGIN must be set to the deployed API's HTTPS origin.");
}
const parsed = new URL(configuredApi);
if (
  parsed.protocol !== "https:" ||
  parsed.username || parsed.password ||
  parsed.pathname !== "/" || parsed.search || parsed.hash ||
  parsed.origin !== configuredApi.replace(/\/$/, "")
) {
  throw new Error("API_SERVER_ORIGIN must be an HTTPS origin without a path.");
}

export const config = {
  framework: "vite",
  buildCommand: "pnpm run build:vercel",
  outputDirectory: "dist/public",
  rewrites: [
    { source: "/api", destination: `${parsed.origin}/api` },
    { source: "/api/:path*", destination: `${parsed.origin}/api/:path*` },
    { source: "/:path*", destination: "/index.html" },
  ],
  headers: [
    {
      source: "/api/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store" }],
    },
  ],
};