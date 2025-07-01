CREATE TABLE IF NOT EXISTS "installations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"radius" real NOT NULL,
	"city_id" integer NOT NULL,
	"population_id" integer NOT NULL,
	"installation_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodes" ADD CONSTRAINT "nodes_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodes" ADD CONSTRAINT "nodes_population_id_populations_id_fk" FOREIGN KEY ("population_id") REFERENCES "public"."populations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodes" ADD CONSTRAINT "nodes_installation_id_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."installations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installations_name_index" ON "installations" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installations_deleted_at_index" ON "installations" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nodes_name_index" ON "nodes" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nodes_city_id_index" ON "nodes" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nodes_population_id_index" ON "nodes" USING btree ("population_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nodes_deleted_at_index" ON "nodes" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nodes_installation_id_index" ON "nodes" USING btree ("installation_id") WHERE "nodes"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nodes_code_index" ON "nodes" USING btree ("code") WHERE "nodes"."deleted_at" is null;