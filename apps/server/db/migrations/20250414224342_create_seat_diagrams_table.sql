CREATE TABLE IF NOT EXISTS "seat_diagrams" (
	"id" serial PRIMARY KEY NOT NULL,
	"seat_layout_model_id" integer NOT NULL,
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
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seat_diagrams" ADD CONSTRAINT "seat_diagrams_seat_layout_model_id_seat_layout_models_id_fk" FOREIGN KEY ("seat_layout_model_id") REFERENCES "public"."seat_layout_models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "seat_diagrams_name_index" ON "seat_diagrams" USING btree ("name");
