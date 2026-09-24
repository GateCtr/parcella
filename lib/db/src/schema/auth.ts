import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  active: boolean("active").notNull().default(true),
  codeSalt: text("code_salt").notNull(),
  codeHash: text("code_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("users_single_admin_principal")
    .on(table.role)
    .where(sql`${table.role} = 'admin_principal'`),
]);

export const sessionsTable = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loginAttemptsTable = pgTable("auth_login_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  scope: text("scope").notNull(),
  subjectHash: text("subject_hash").notNull(),
  attempts: integer("attempts").notNull().default(1),
  windowStarted: timestamp("window_started", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("auth_login_attempts_scope_subject_unique").on(table.scope, table.subjectHash),
]);

export type User = typeof usersTable.$inferSelect;
export type Session = typeof sessionsTable.$inferSelect;