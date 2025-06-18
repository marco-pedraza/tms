CREATE TABLE IF NOT EXISTS "bus_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"default_bus_diagram_model_id" integer NOT NULL,
	"manufacturer" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	"seating_capacity" integer NOT NULL,
	"num_floors" integer DEFAULT 1 NOT NULL,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"engine_type" text,
	"distribution_type" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_seats" (
	"id" serial PRIMARY KEY NOT NULL,
	"seat_diagram_id" integer NOT NULL,
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
 ALTER TABLE "bus_models" ADD CONSTRAINT "bus_models_default_bus_diagram_model_id_bus_diagram_models_id_fk" FOREIGN KEY ("default_bus_diagram_model_id") REFERENCES "public"."bus_diagram_models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_seats" ADD CONSTRAINT "bus_seats_seat_diagram_id_seat_diagrams_id_fk" FOREIGN KEY ("seat_diagram_id") REFERENCES "public"."seat_diagrams"("id") ON DELETE CASCADE ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_models_default_bus_diagram_model_id_index" ON "bus_models" USING btree ("default_bus_diagram_model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_models_manufacturer_index" ON "bus_models" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_models_model_index" ON "bus_models" USING btree ("model");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_seats_seat_diagram_id_index" ON "bus_seats" USING btree ("seat_diagram_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_seats_space_type_index" ON "bus_seats" USING btree ("space_type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bus_seats_seat_diagram_id_seat_number_unique" ON "bus_seats" USING btree ("seat_diagram_id","seat_number") WHERE "bus_seats"."space_type" = 'seat';
