CREATE TABLE IF NOT EXISTS "seat_diagram_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"seat_diagram_id" integer NOT NULL,
	"name" text NOT NULL,
	"row_numbers" integer[] NOT NULL,
	"price_multiplier" numeric DEFAULT '1.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bus_diagram_model_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"bus_diagram_model_id" integer NOT NULL,
	"name" text NOT NULL,
	"row_numbers" integer[] NOT NULL,
	"price_multiplier" numeric DEFAULT '1.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seat_diagram_zones" ADD CONSTRAINT "seat_diagram_zones_seat_diagram_id_seat_diagrams_id_fk" FOREIGN KEY ("seat_diagram_id") REFERENCES "public"."seat_diagrams"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_diagram_model_zones" ADD CONSTRAINT "bus_diagram_model_zones_bus_diagram_model_id_bus_diagram_models_id_fk" FOREIGN KEY ("bus_diagram_model_id") REFERENCES "public"."bus_diagram_models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seat_diagram_zones_name_index" ON "seat_diagram_zones" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seat_diagram_zones_seat_diagram_id_index" ON "seat_diagram_zones" USING btree ("seat_diagram_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_diagram_model_zones_name_index" ON "bus_diagram_model_zones" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_diagram_model_zones_bus_diagram_model_id_index" ON "bus_diagram_model_zones" USING btree ("bus_diagram_model_id");
