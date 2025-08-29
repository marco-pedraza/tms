DROP INDEX IF EXISTS "seat_diagrams_deleted_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "seat_diagrams_name_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "seat_diagrams_bus_diagram_model_id_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seat_diagrams_deleted_at_index" ON "seat_diagrams" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seat_diagrams_name_index" ON "seat_diagrams" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seat_diagrams_bus_diagram_model_id_index" ON "seat_diagrams" USING btree ("bus_diagram_model_id");