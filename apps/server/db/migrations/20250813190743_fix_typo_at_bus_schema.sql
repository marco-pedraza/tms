ALTER TABLE "buses" RENAME COLUMN "available_for_turism_only" TO "available_for_tourism_only";--> statement-breakpoint
ALTER TABLE "bus_lines" ALTER COLUMN "price_per_km_multiplier" SET DATA TYPE real;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_lines_active_index" ON "bus_lines" USING btree ("active");