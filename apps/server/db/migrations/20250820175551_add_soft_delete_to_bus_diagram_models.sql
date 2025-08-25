DROP INDEX IF EXISTS "bus_diagram_models_name_index";--> statement-breakpoint
ALTER TABLE "bus_diagram_models" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bus_diagram_models_name_unique_active" ON "bus_diagram_models" USING btree ("name") WHERE "bus_diagram_models"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_diagram_models_deleted_at_idx" ON "bus_diagram_models" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_diagram_models_name_idx" ON "bus_diagram_models" USING btree ("name");