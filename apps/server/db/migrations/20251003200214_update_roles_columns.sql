DROP INDEX IF EXISTS "roles_name_index";--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roles_code_index" ON "roles" USING btree ("code") WHERE "roles"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roles_deleted_at_index" ON "roles" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_index" ON "roles" USING btree ("name") WHERE "roles"."deleted_at" is null;