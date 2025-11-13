DROP INDEX IF EXISTS "departments_code_index";--> statement-breakpoint
DROP INDEX IF EXISTS "departments_name_index";--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "departments_deleted_at_index" ON "departments" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "departments_code_index" ON "departments" USING btree ("code") WHERE "departments"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "departments_name_index" ON "departments" USING btree ("name") WHERE "departments"."deleted_at" is null;