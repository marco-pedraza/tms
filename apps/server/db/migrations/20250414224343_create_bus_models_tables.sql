CREATE TABLE "bus_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"default_seat_layout_model_id" integer NOT NULL,
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
CREATE TABLE "bus_seats" (
	"id" serial PRIMARY KEY NOT NULL,
	"seat_diagram_id" integer NOT NULL,
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
ALTER TABLE "bus_seats" ADD CONSTRAINT "bus_seats_seat_diagram_id_seat_diagrams_id_fk" FOREIGN KEY ("seat_diagram_id") REFERENCES "public"."seat_diagrams"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bus_models" ADD CONSTRAINT "bus_models_default_seat_layout_model_id_seat_layout_models_id_fk" FOREIGN KEY ("default_seat_layout_model_id") REFERENCES "public"."seat_layout_models"("id") ON DELETE no action ON UPDATE no action;