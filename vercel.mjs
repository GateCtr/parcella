const configuredApi = process.env.API_SERVER_ORIGIN?.trim();
let apiOrigin;
if (configuredApi) {
  const parsed = new URL(configuredApi);
  if (
    parsed.protocol !== "https:" ||
    parsed.username || parsed.password ||
    parsed.pathname !== "/" || parsed.search || parsed.hash ||
    parsed.origin !== configuredApi.replace(/\/$/, "")
  ) {
    throw new Error("API_SERVER_ORIGIN must be an HTTPS origin without a path.");
  }
  apiOrigin = parsed.origin;
}

const target = apiOrigin ? `${apiOrigin}/api` : "/api/index";
export const config = {
  framework: "vite",
  buildCommand: "pnpm run build:vercel",
  outputDirectory: "artifacts/registre-parcellaire/dist/public",
  rewrites: [
    { source: "/api", destination: target },
    { source: "/api/:path*", destination: apiOrigin ? `${apiOrigin}/api/:path*` : target },
    { source: "/:path*", destination: "/index.html" },
  ],
  headers: [
    {
      source: "/api/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store" }],
    },
  ],
};