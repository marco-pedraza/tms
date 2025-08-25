DROP INDEX IF EXISTS "bus_diagram_models_name_unique_active";--> statement-breakpoint
DROP INDEX IF EXISTS "bus_diagram_models_deleted_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "bus_diagram_models_name_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_diagram_models_deleted_at_index" ON "bus_diagram_models" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bus_diagram_models_name_index" ON "bus_diagram_models" USING btree ("name") WHERE "bus_diagram_models"."deleted_at" is null;