ALTER TABLE "users" RENAME COLUMN "is_active" TO "active";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_deleted_at_index" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_index" ON "users" USING btree ("email") WHERE "users"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_index" ON "users" USING btree ("username") WHERE "users"."deleted_at" is null;