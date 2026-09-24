import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { hashAccessCode, normalizeEmail } from "./user-auth";

export async function seedAdminIfMissing(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(9473621)`);
    const principals = await tx.select({
      id: usersTable.id,
      active: usersTable.active,
    }).from(usersTable).where(eq(usersTable.role, "admin_principal"));

    if (principals.length === 1 && principals[0].active) return;
    if (principals.length > 0) {
      throw new Error(
        "Admin bootstrap stopped: an admin_principal already exists but is inactive or duplicated. Restore the existing principal through an authorized database recovery; startup will not create a replacement.",
      );
    }

    const emailValue = process.env.ADMIN_BOOTSTRAP_EMAIL;
    const code = process.env.ADMIN_BOOTSTRAP_CODE;
    const email = emailValue ? normalizeEmail(emailValue) : "";
    const distinctChars = new Set(code ?? "").size;
    if (!emailValue || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !code || code.length < 20 || code.length > 256 || distinctChars < 12 || /\s/.test(code)) {
      throw new Error(
        "No admin_principal exists. Set ADMIN_BOOTSTRAP_EMAIL and a strong ADMIN_BOOTSTRAP_CODE (20 to 256 random characters with at least 12 distinct characters) before starting the API.",
      );
    }

    const [emailOwner] = await tx.select({ id: usersTable.id }).from(usersTable)
      .where(eq(usersTable.email, email)).limit(1);
    if (emailOwner) {
      throw new Error(
        "Unable to seed the initial admin_principal because ADMIN_BOOTSTRAP_EMAIL belongs to an existing account. Resolve that account before restarting.",
      );
    }
    const credentials = hashAccessCode(code);
    await tx.insert(usersTable).values({
      email,
      role: "admin_principal",
      codeSalt: credentials.salt,
      codeHash: credentials.hash,
    });
  });
}