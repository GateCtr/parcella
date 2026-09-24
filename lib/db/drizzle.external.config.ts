import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.EXTERNAL_DATABASE_URL) {
  throw new Error(
    "EXTERNAL_DATABASE_URL is required to apply migrations to the external PostgreSQL database",
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.EXTERNAL_DATABASE_URL,
  },
});