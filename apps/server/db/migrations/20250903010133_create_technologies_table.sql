CREATE TABLE IF NOT EXISTS "bus_technologies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"bus_id" integer NOT NULL,
	"technology_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "technologies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"provider" text,
	"version" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_technologies" ADD CONSTRAINT "bus_technologies_bus_id_buses_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_technologies" ADD CONSTRAINT "bus_technologies_technology_id_technologies_id_fk" FOREIGN KEY ("technology_id") REFERENCES "public"."technologies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_technologies_technology_id_index" ON "bus_technologies" USING btree ("technology_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bus_technologies_bus_id_technology_id_index" ON "bus_technologies" USING btree ("bus_id","technology_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "technologies_provider_index" ON "technologies" USING btree ("provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "technologies_version_index" ON "technologies" USING btree ("version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "technologies_active_index" ON "technologies" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "technologies_deleted_at_index" ON "technologies" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "technologies_name_index" ON "technologies" USING btree ("name") WHERE "technologies"."deleted_at" is null;