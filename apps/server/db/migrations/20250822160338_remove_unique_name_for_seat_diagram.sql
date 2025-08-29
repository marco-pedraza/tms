DROP INDEX IF EXISTS "seat_diagrams_name_unique_active";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seat_diagrams_name_idx" ON "seat_diagrams" USING btree ("name");