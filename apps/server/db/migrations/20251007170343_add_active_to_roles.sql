DROP INDEX IF EXISTS "roles_code_index";--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN IF EXISTS "code";