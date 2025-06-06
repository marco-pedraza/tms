CREATE TABLE IF NOT EXISTS "bus_seat_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"bus_diagram_model_id" integer NOT NULL,
	"space_type" text DEFAULT 'seat' NOT NULL,
	"seat_number" text,
	"floor_number" integer DEFAULT 1 NOT NULL,
	"seat_type" text,
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
CREATE INDEX IF NOT EXISTS "bus_seat_models_space_type_index" ON "bus_seat_models" USING btree ("space_type");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bus_seat_models_bus_diagram_model_id_seat_number_index" ON "bus_seat_models" USING btree ("bus_diagram_model_id","seat_number") WHERE "bus_seat_models"."space_type" = 'seat';
--> statement-breakpoint
ALTER TABLE "bus_seat_models" ADD CONSTRAINT "bus_seat_models_bus_diagram_model_id_seat_number_unique" UNIQUE("bus_diagram_model_id","seat_number");