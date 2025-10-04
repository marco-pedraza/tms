ALTER TABLE "permission_groups" DROP CONSTRAINT "permission_groups_name_unique";--> statement-breakpoint
ALTER TABLE "permission_groups" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "permission_groups" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "permission_groups_code_index" ON "permission_groups" USING btree ("code") WHERE "permission_groups"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "permission_groups_name_index" ON "permission_groups" USING btree ("name") WHERE "permission_groups"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "permission_groups_deleted_at_index" ON "permission_groups" USING btree ("deleted_at");