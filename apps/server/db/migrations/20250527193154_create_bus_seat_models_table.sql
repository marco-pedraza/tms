CREATE TABLE IF NOT EXISTS "bus_seat_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"bus_diagram_model_id" integer NOT NULL,
	"seat_number" text NOT NULL,
	"floor_number" integer DEFAULT 1 NOT NULL,
	"seat_type" text NOT NULL,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reclinement_angle" integer,
	"position" jsonb NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_seat_models" ADD CONSTRAINT "bus_seat_models_bus_diagram_model_id_bus_diagram_models_id_fk" FOREIGN KEY ("bus_diagram_model_id") REFERENCES "public"."bus_diagram_models"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_seat_models_bus_diagram_model_id_index" ON "bus_seat_models" USING btree ("bus_diagram_model_id");
--> statement-breakpoint
ALTER TABLE "bus_seat_models" ADD CONSTRAINT "bus_seat_models_bus_diagram_model_id_seat_number_unique" UNIQUE("bus_diagram_model_id","seat_number");