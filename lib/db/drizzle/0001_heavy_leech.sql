ALTER TABLE "plaques" ADD COLUMN "public_token_hash" text;--> statement-breakpoint
ALTER TABLE "plaques" ADD COLUMN "public_token_encrypted" text;--> statement-breakpoint
ALTER TABLE "plaques" ADD CONSTRAINT "plaques_public_token_hash_unique" UNIQUE("public_token_hash");