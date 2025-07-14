ALTER TABLE "installation_types" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "installation_types" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "installation_types_code_index" ON "installation_types" USING btree ("code") WHERE "installation_types"."deleted_at" is null;