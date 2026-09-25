import {
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const statutFicheEnum = pgEnum("statut_fiche", [
  "brouillon",
  "soumise",
  "validee",
  "rejetee",
]);
export const statutPlaqueEnum = pgEnum("statut_plaque", [
  "non_generee",
  "generee",
  "a_reimprimer",
  "imprimee",
]);

export const fichesTable = pgTable(
  "fiches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ficheNo: text("fiche_no").notNull().unique(),
    dateProspection: date("date_prospection", { mode: "string" }).notNull(),
    commune: text("commune").notNull(),
    quartier: text("quartier").notNull(),
    localite: text("localite"),
    avenue: text("avenue").notNull(),
    parcelleNo: text("parcelle_no").notNull(),
    plaqueNo: text("plaque_no"),
    proprietaireNom: text("proprietaire_nom").notNull(),
    telephone: text("telephone").notNull(),
    typeOccupation: text("type_occupation").notNull(),
    superficie: integer("superficie"),
    usageParcelle: text("usage_parcelle").notNull(),
    plaqueExistante: text("plaque_existante"),
    statutPaiement: text("statut_paiement"),
    recuNo: text("recu_no"),
    sensibilisation: text("sensibilisation"),
    hygiene: jsonb("hygiene").notNull().default({}),
    dechets: jsonb("dechets").notNull().default({}),
    facade: jsonb("facade").notNull().default({}),
    drainage: jsonb("drainage").notNull().default({}),
    activites: text("activites").array().notNull().default([]),
    remarques: text("remarques"),
    avis: jsonb("avis").notNull().default({}),
    agentId: text("agent_id").notNull(),
    agentMatricule: text("agent_matricule"),
    chefRueNom: text("chef_rue_nom"),
    chefRueAvenue: text("chef_rue_avenue"),
    statutFiche: statutFicheEnum("statut_fiche").notNull().default("soumise"),
    statutPlaque: statutPlaqueEnum("statut_plaque").notNull().default("non_generee"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("fiches_adresse_unique").on(
      table.commune,
      table.quartier,
      table.avenue,
      table.parcelleNo,
    ),
  ],
);

export const plaquesTable = pgTable("plaques", {
  id: uuid("id").primaryKey().defaultRandom(),
  ficheId: uuid("fiche_id").notNull().references(() => fichesTable.id),
  version: integer("version").notNull().default(1),
  publicTokenHash: text("public_token_hash").unique(),
  publicTokenEncrypted: text("public_token_encrypted"),
  svg: text("svg").notNull(),
  genereLe: timestamp("genere_le", { withTimezone: true }).notNull().defaultNow(),
  imprimeLe: timestamp("imprime_le", { withTimezone: true }),
});

export const auditTable = pgTable("journal_audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  utilisateurId: text("utilisateur_id").notNull(),
  action: text("action").notNull(),
  ficheId: uuid("fiche_id").references(() => fichesTable.id),
  donneesAvant: jsonb("donnees_avant"),
  donneesApres: jsonb("donnees_apres"),
  horodatage: timestamp("horodatage", { withTimezone: true }).notNull().defaultNow(),
});