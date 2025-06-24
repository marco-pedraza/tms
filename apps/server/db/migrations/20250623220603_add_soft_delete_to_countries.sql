ALTER TABLE "countries" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "countries_deleted_at_index" ON "countries" USING btree ("deleted_at");