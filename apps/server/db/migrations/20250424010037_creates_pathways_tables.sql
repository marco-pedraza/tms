CREATE TABLE IF NOT EXISTS "pathways" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"distance" real NOT NULL,
	"typical_time" integer NOT NULL,
	"meta" jsonb NOT NULL,
	"toll_road" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pathways_name_unique" UNIQUE("name")
);
