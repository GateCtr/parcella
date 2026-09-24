import { createHash, randomBytes } from "node:crypto";
import { Router, type IRouter, type Request } from "express";
import { and, eq, lt, sql } from "drizzle-orm";
import { db, loginAttemptsTable, sessionsTable, usersTable } from "@workspace/db";
import {
  CreateUserBody,
  CreateUserResponse,
  GetCurrentUserResponse,
  ListUsersResponse,
  LoginBody,
  LoginResponse,
  LogoutResponse,
  RotateUserCodeParams,
  RotateUserCodeResponse,
  UpdateUserBody,
  UpdateUserParams,
  UpdateUserResponse,
} from "@workspace/api-zod";
import { hashAccessCode, hashSessionToken, normalizeEmail, verifyAccessCode, generateAccessCode } from "../lib/user-auth";
import { requireRole, sessionCookieValue } from "../middlewares/session";

const router: IRouter = Router();
const COOKIE_NAME = "registre_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const LOGIN_WINDOW_MINUTES = 15;
const LOGIN_MAX_ATTEMPTS = 10;
const SOURCE_LOGIN_MAX_ATTEMPTS = 60;

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

function rateLimitHash(scope: "email" | "source", value: string): string {
  return createHash("sha256").update(`${scope}\0${value}`).digest("hex");
}

function reliableSourceAddress(req: Request): string | undefined {
  // A forwarded client address is trusted only when the deployment explicitly configures
  // the number of trusted proxy hops. Otherwise all requests may share a proxy address.
  if (process.env.TRUST_PROXY_HOPS === undefined) return undefined;
  return req.ip;
}

async function incrementRateLimit(
  scope: "email" | "source",
  subjectHash: string,
): Promise<number> {
  const [row] = await db.insert(loginAttemptsTable).values({
    scope,
    subjectHash,
    attempts: 1,
    windowStarted: new Date(),
  }).onConflictDoUpdate({
    target: [loginAttemptsTable.scope, loginAttemptsTable.subjectHash],
    set: {
      attempts: sql<number>`CASE WHEN ${loginAttemptsTable.windowStarted} <= now() - (${LOGIN_WINDOW_MINUTES} * interval '1 minute') THEN 1 ELSE ${loginAttemptsTable.attempts} + 1 END`,
      windowStarted: sql<Date>`CASE WHEN ${loginAttemptsTable.windowStarted} <= now() - (${LOGIN_WINDOW_MINUTES} * interval '1 minute') THEN now() ELSE ${loginAttemptsTable.windowStarted} END`,
    },
  }).returning({ attempts: loginAttemptsTable.attempts });
  return row.attempts;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/api",
    maxAge: SESSION_DURATION_MS,
  };
}

router.get("/auth/me", (req, res): void => {
  if (!req.currentUser) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }
  res.json(GetCurrentUserResponse.parse(req.currentUser));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }
  const email = normalizeEmail(parsed.data.email);
  const sourceAddress = reliableSourceAddress(req);
  await db.delete(loginAttemptsTable)
    .where(lt(loginAttemptsTable.windowStarted, new Date(Date.now() - 24 * 60 * 60 * 1000)));
  const emailAttempts = await incrementRateLimit("email", rateLimitHash("email", email));
  const sourceAttempts = sourceAddress
    ? await incrementRateLimit("source", rateLimitHash("source", sourceAddress))
    : 0;
  const limited = emailAttempts > LOGIN_MAX_ATTEMPTS ||
    (sourceAddress !== undefined && sourceAttempts > SOURCE_LOGIN_MAX_ATTEMPTS);
  if (limited) {
    res.status(429).json({ error: "Trop de tentatives. Réessayez plus tard." });
    return;
  }

  const result = await db.transaction(async (tx) => {
    const [user] = await tx.select().from(usersTable)
      .where(eq(usersTable.email, email)).limit(1).for("update");
    const verified = user
      ? verifyAccessCode(parsed.data.code, user.codeSalt, user.codeHash)
      : verifyAccessCode(parsed.data.code, "registre-dummy-salt", "0".repeat(128));
    if (!user || !user.active || !verified) return undefined;

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await tx.insert(sessionsTable).values({
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
    });
    return { user, token };
  });
  if (!result) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }

  res.cookie(COOKIE_NAME, result.token, cookieOptions());
  res.json(LoginResponse.parse({
    id: result.user.id,
    email: result.user.email,
    role: result.user.role,
  }));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = sessionCookieValue(req);
  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.tokenHash, hashSessionToken(token)));
  }
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json(LogoutResponse.parse({ success: true }));
});

router.get("/users", requireRole("admin_principal"), async (_req, res): Promise<void> => {
  const rows = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(ListUsersResponse.parse(rows.map(({ id, email, role, active, createdAt }) => ({
    id, email, role, active, createdAt,
  }))));
});

router.post("/users", requireRole("admin_principal"), async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.role === "admin_principal") {
    res.status(403).json({ error: "L’administrateur principal unique est créé au démarrage." });
    return;
  }
  const email = normalizeEmail(parsed.data.email);
  const [existing] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(409).json({ error: "Cette adresse est déjà utilisée" });
    return;
  }
  const accessCode = generateAccessCode();
  const credentials = hashAccessCode(accessCode);
  try {
    const [created] = await db.insert(usersTable).values({
      email,
      role: parsed.data.role,
      codeSalt: credentials.salt,
      codeHash: credentials.hash,
    }).returning();
    const result = CreateUserResponse.parse({
      user: {
        id: created.id,
        email: created.email,
        role: created.role,
        active: created.active,
        createdAt: created.createdAt,
      },
      accessCode,
    });
    res.status(201).json(result);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      res.status(409).json({ error: "Cette adresse est déjà utilisée" });
      return;
    }
    throw error;
  }
});

router.patch("/users/:id", requireRole("admin_principal"), async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  const body = UpdateUserBody.safeParse(req.body);
  if (!params.success || !body.success || (!body.data.role && body.data.active === undefined)) {
    res.status(400).json({ error: "Données invalides" });
    return;
  }
  const [current] = await db.select().from(usersTable)
    .where(eq(usersTable.id, params.data.id)).limit(1);
  if (!current) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  if (body.data.role === "admin_principal" && current.role !== "admin_principal") {
    res.status(403).json({ error: "Un administrateur principal existe déjà; promotion interdite." });
    return;
  }
  const removingPrincipal = current.role === "admin_principal" &&
    (body.data.role !== undefined && body.data.role !== "admin_principal" || body.data.active === false);
  if (removingPrincipal) {
    const [otherActivePrincipal] = await db.select({ id: usersTable.id }).from(usersTable)
      .where(and(
        eq(usersTable.role, "admin_principal"),
        eq(usersTable.active, true),
      ))
      .limit(1);
    if (otherActivePrincipal?.id === current.id) {
      res.status(409).json({ error: "Le seul administrateur principal actif ne peut pas être désactivé ou rétrogradé." });
      return;
    }
  }
  const updated = await db.transaction(async (tx) => {
    const [user] = await tx.update(usersTable).set(body.data)
      .where(eq(usersTable.id, params.data.id)).returning();
    if (user && body.data.active === false) {
      await tx.delete(sessionsTable).where(eq(sessionsTable.userId, user.id));
    }
    return user;
  });
  if (!updated) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  res.json(UpdateUserResponse.parse({
    id: updated.id,
    email: updated.email,
    role: updated.role,
    active: updated.active,
    createdAt: updated.createdAt,
  }));
});

router.post("/users/:id/rotate-code", requireRole("admin_principal"), async (req, res): Promise<void> => {
  const params = RotateUserCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Identifiant invalide" });
    return;
  }
  const accessCode = generateAccessCode();
  const credentials = hashAccessCode(accessCode);
  const updated = await db.transaction(async (tx) => {
    const [user] = await tx.update(usersTable).set({
      codeSalt: credentials.salt,
      codeHash: credentials.hash,
    }).where(eq(usersTable.id, params.data.id)).returning({ id: usersTable.id });
    if (user) {
      await tx.delete(sessionsTable).where(eq(sessionsTable.userId, user.id));
    }
    return user;
  });
  if (!updated) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  res.json(RotateUserCodeResponse.parse({ accessCode }));
});

export default router;