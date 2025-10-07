ALTER TABLE "installation_schemas" ADD COLUMN "system_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "installation_types" ADD COLUMN "system_locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installation_schemas_system_locked_index" ON "installation_schemas" USING btree ("system_locked");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installation_types_system_locked_index" ON "installation_types" USING btree ("system_locked");