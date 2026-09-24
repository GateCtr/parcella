import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { boolean, check, integer, pgTable } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const rubriqueSettingsTable = pgTable(
  "rubrique_settings",
  {
    id: integer("id").primaryKey().default(1),
    adressage: boolean("adressage").notNull().default(true),
    hygiene: boolean("hygiene").notNull().default(true),
    dechets: boolean("dechets").notNull().default(true),
    facade: boolean("facade").notNull().default(true),
    drainage: boolean("drainage").notNull().default(true),
    activites: boolean("activites").notNull().default(true),
    remarques: boolean("remarques").notNull().default(true),
    avis: boolean("avis").notNull().default(true),
  },
  (table) => [check("rubrique_settings_singleton_id", sql`${table.id} = 1`)],
);

export const insertRubriqueSettingsSchema = createInsertSchema(rubriqueSettingsTable);
export type InsertRubriqueSettings = z.infer<typeof insertRubriqueSettingsSchema>;
export type RubriqueSettings = typeof rubriqueSettingsTable.$inferSelect;