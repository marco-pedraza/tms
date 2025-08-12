ALTER TABLE "buses" DROP CONSTRAINT IF EXISTS "buses_registration_number_unique";--> statement-breakpoint
ALTER TABLE "buses" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "buses_deleted_at_index" ON "buses" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "buses_registration_number_index" ON "buses" USING btree ("registration_number") WHERE "buses"."deleted_at" is null;