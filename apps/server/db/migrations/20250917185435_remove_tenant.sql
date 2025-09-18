ALTER TABLE "tenants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "tenants" CASCADE;--> statement-breakpoint
DROP INDEX IF EXISTS "departments_code_tenant_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "roles_name_tenant_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "users_tenant_id_index";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "departments_code_index" ON "departments" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_index" ON "roles" USING btree ("name");--> statement-breakpoint
ALTER TABLE "departments" DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN IF EXISTS "tenant_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "tenant_id";