CREATE TABLE IF NOT EXISTS "seat_layout_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"max_capacity" integer NOT NULL,
	"num_floors" integer DEFAULT 1 NOT NULL,
	"seats_per_floor" jsonb NOT NULL,
	"bathroom_rows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_seats" integer NOT NULL,
	"is_factory_default" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);