ALTER TABLE "buses" ALTER COLUMN "purchase_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buses" ALTER COLUMN "economic_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buses" ALTER COLUMN "license_plate_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buses" ALTER COLUMN "gross_vehicle_weight" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buses" ALTER COLUMN "serial_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buses" ALTER COLUMN "chassis_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "buses" ADD COLUMN "license_plate_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "buses" ADD COLUMN "available_for_turism_only" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "buses" ADD COLUMN "transporter_id" integer;--> statement-breakpoint
ALTER TABLE "buses" ADD COLUMN "alternate_transporter_id" integer;--> statement-breakpoint
ALTER TABLE "buses" ADD COLUMN "bus_line_id" integer;--> statement-breakpoint
ALTER TABLE "buses" ADD COLUMN "base_id" integer;--> statement-breakpoint
ALTER TABLE "buses" ADD COLUMN "expiration_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "buses" ADD COLUMN "current_kilometer" numeric;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "buses" ADD CONSTRAINT "buses_transporter_id_transporters_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."transporters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "buses" ADD CONSTRAINT "buses_alternate_transporter_id_transporters_id_fk" FOREIGN KEY ("alternate_transporter_id") REFERENCES "public"."transporters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "buses" ADD CONSTRAINT "buses_bus_line_id_bus_lines_id_fk" FOREIGN KEY ("bus_line_id") REFERENCES "public"."bus_lines"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "buses" ADD CONSTRAINT "buses_base_id_nodes_id_fk" FOREIGN KEY ("base_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "buses_bus_line_id_index" ON "buses" USING btree ("bus_line_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "buses_base_id_index" ON "buses" USING btree ("base_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "buses_license_plate_number_index" ON "buses" USING btree ("license_plate_number") WHERE "buses"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "type_code";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "brand_code";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "model_code";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "max_capacity";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "year";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "sap_key";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "base_code";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "cost_center";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "fuel_efficiency";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "alternate_company";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "service_type";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "commercial_tourism";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "available";--> statement-breakpoint
ALTER TABLE "buses" DROP COLUMN IF EXISTS "tourism";