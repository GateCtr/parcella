CREATE TYPE "public"."statut_fiche" AS ENUM('brouillon', 'soumise', 'validee', 'rejetee');--> statement-breakpoint
CREATE TYPE "public"."statut_plaque" AS ENUM('non_generee', 'generee', 'a_reimprimer', 'imprimee');--> statement-breakpoint
CREATE TABLE "journal_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"utilisateur_id" text NOT NULL,
	"action" text NOT NULL,
	"fiche_id" uuid,
	"donnees_avant" jsonb,
	"donnees_apres" jsonb,
	"horodatage" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fiche_no" text NOT NULL,
	"date_prospection" date NOT NULL,
	"commune" text NOT NULL,
	"quartier" text NOT NULL,
	"localite" text,
	"avenue" text NOT NULL,
	"parcelle_no" text NOT NULL,
	"plaque_no" text,
	"proprietaire_nom" text NOT NULL,
	"telephone" text NOT NULL,
	"type_occupation" text NOT NULL,
	"superficie" integer,
	"usage_parcelle" text NOT NULL,
	"plaque_existante" text,
	"statut_paiement" text,
	"recu_no" text,
	"sensibilisation" text,
	"hygiene" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dechets" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"facade" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"drainage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"activites" text[] DEFAULT '{}' NOT NULL,
	"remarques" text,
	"avis" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"agent_id" text NOT NULL,
	"agent_matricule" text,
	"chef_rue_nom" text,
	"chef_rue_avenue" text,
	"statut_fiche" "statut_fiche" DEFAULT 'soumise' NOT NULL,
	"statut_plaque" "statut_plaque" DEFAULT 'non_generee' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fiches_fiche_no_unique" UNIQUE("fiche_no")
);
--> statement-breakpoint
CREATE TABLE "plaques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fiche_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"svg" text NOT NULL,
	"genere_le" timestamp with time zone DEFAULT now() NOT NULL,
	"imprime_le" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rubrique_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"adressage" boolean DEFAULT true NOT NULL,
	"hygiene" boolean DEFAULT true NOT NULL,
	"dechets" boolean DEFAULT true NOT NULL,
	"facade" boolean DEFAULT true NOT NULL,
	"drainage" boolean DEFAULT true NOT NULL,
	"activites" boolean DEFAULT true NOT NULL,
	"remarques" boolean DEFAULT true NOT NULL,
	"avis" boolean DEFAULT true NOT NULL,
	CONSTRAINT "rubrique_settings_singleton_id" CHECK ("rubrique_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "auth_login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" text NOT NULL,
	"subject_hash" text NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"window_started" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"code_salt" text NOT NULL,
	"code_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "journal_audit" ADD CONSTRAINT "journal_audit_fiche_id_fiches_id_fk" FOREIGN KEY ("fiche_id") REFERENCES "public"."fiches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plaques" ADD CONSTRAINT "plaques_fiche_id_fiches_id_fk" FOREIGN KEY ("fiche_id") REFERENCES "public"."fiches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fiches_adresse_unique" ON "fiches" USING btree ("commune","quartier","avenue","parcelle_no");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_login_attempts_scope_subject_unique" ON "auth_login_attempts" USING btree ("scope","subject_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_single_admin_principal" ON "users" USING btree ("role") WHERE "users"."role" = 'admin_principal';