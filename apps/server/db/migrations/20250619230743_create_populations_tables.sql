CREATE TABLE IF NOT EXISTS "population_cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"population_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "populations" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "population_cities" ADD CONSTRAINT "population_cities_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "population_cities" ADD CONSTRAINT "population_cities_population_id_populations_id_fk" FOREIGN KEY ("population_id") REFERENCES "public"."populations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "population_cities_city_id_population_id_index" ON "population_cities" USING btree ("city_id","population_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "populations_code_active_unique" ON "populations" USING btree ("code") WHERE "populations"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "populations_name_index" ON "populations" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "populations_deleted_at_index" ON "populations" USING btree ("deleted_at");