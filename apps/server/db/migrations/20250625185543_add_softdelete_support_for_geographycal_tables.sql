ALTER TABLE "cities" DROP CONSTRAINT "cities_slug_unique";--> statement-breakpoint
ALTER TABLE "countries" DROP CONSTRAINT "countries_name_unique";--> statement-breakpoint
ALTER TABLE "countries" DROP CONSTRAINT "countries_code_unique";--> statement-breakpoint
ALTER TABLE "states" DROP CONSTRAINT "states_name_unique";--> statement-breakpoint
ALTER TABLE "states" DROP CONSTRAINT "states_code_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "cities_name_index";--> statement-breakpoint
ALTER TABLE "cities" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "states" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cities_deleted_at_index" ON "cities" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cities_slug_index" ON "cities" USING btree ("slug") WHERE "cities"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "countries_name_index" ON "countries" USING btree ("name") WHERE "countries"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "countries_code_index" ON "countries" USING btree ("code") WHERE "countries"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "states_deleted_at_index" ON "states" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "states_name_index" ON "states" USING btree ("name") WHERE "states"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "states_code_index" ON "states" USING btree ("code") WHERE "states"."deleted_at" is null;