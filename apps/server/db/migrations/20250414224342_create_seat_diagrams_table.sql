CREATE TABLE IF NOT EXISTS "seat_diagrams" (
	"id" serial PRIMARY KEY NOT NULL,
	"diagram_number" integer NOT NULL,
	"name" text NOT NULL,
	"max_capacity" integer NOT NULL,
	"allows_adjacent_seat" boolean DEFAULT false NOT NULL,
	"observations" text,
	"num_floors" integer DEFAULT 1 NOT NULL,
	"seats_per_floor" jsonb NOT NULL,
	"bathroom_rows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_seats" integer NOT NULL,
	"is_factory_default" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seat_diagrams_diagram_number_unique" UNIQUE ("diagram_number")
);
