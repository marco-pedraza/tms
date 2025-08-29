DROP INDEX IF EXISTS "seat_diagrams_name_index";--> statement-breakpoint
DROP INDEX IF EXISTS "seat_diagrams_bus_diagram_model_id_index";--> statement-breakpoint
ALTER TABLE "seat_diagrams" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "seat_diagrams_name_unique_active" ON "seat_diagrams" USING btree ("name") WHERE "seat_diagrams"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seat_diagrams_deleted_at_idx" ON "seat_diagrams" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seat_diagrams_name_idx" ON "seat_diagrams" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seat_diagrams_bus_diagram_model_id_idx" ON "seat_diagrams" USING btree ("bus_diagram_model_id");