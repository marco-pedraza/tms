ALTER TABLE "transporters" DROP CONSTRAINT "transporters_code_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "transporters_name_index";--> statement-breakpoint
ALTER TABLE "transporters" ALTER COLUMN "code" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "transporters" ADD COLUMN "legal_name" text;--> statement-breakpoint
ALTER TABLE "transporters" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "transporters" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transporters_deleted_at_index" ON "transporters" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transporters_active_index" ON "transporters" USING btree ("active") WHERE "transporters"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "transporters_code_index" ON "transporters" USING btree ("code") WHERE "transporters"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "transporters_name_index" ON "transporters" USING btree ("name") WHERE "transporters"."deleted_at" is null;