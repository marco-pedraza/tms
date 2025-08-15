ALTER TABLE "bus_lines" ALTER COLUMN "price_per_km_multiplier" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "bus_models" ADD COLUMN "trunk_capacity" integer;--> statement-breakpoint
ALTER TABLE "bus_models" ADD COLUMN "fuel_efficiency" integer;--> statement-breakpoint
ALTER TABLE "bus_models" ADD COLUMN "max_capacity" integer;--> statement-breakpoint
ALTER TABLE "bus_models" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_lines_active_index" ON "bus_lines" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_models_deleted_at_index" ON "bus_models" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bus_models_manufacturer_model_year_index" ON "bus_models" USING btree ("manufacturer","model","year") WHERE "bus_models"."deleted_at" is null;