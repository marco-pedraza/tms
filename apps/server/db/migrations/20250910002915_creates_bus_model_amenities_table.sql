CREATE TABLE IF NOT EXISTS "bus_model_amenities" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"bus_model_id" integer NOT NULL,
	"amenity_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_model_amenities" ADD CONSTRAINT "bus_model_amenities_bus_model_id_bus_models_id_fk" FOREIGN KEY ("bus_model_id") REFERENCES "public"."bus_models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_model_amenities" ADD CONSTRAINT "bus_model_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_model_amenities_amenity_id_index" ON "bus_model_amenities" USING btree ("amenity_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bus_model_amenities_bus_model_id_amenity_id_index" ON "bus_model_amenities" USING btree ("bus_model_id","amenity_id");--> statement-breakpoint
ALTER TABLE "bus_models" DROP COLUMN IF EXISTS "amenities";