CREATE TABLE IF NOT EXISTS "bus_crews" (
	"id" serial PRIMARY KEY NOT NULL,
	"bus_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_crews" ADD CONSTRAINT "bus_crews_bus_id_buses_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_crews" ADD CONSTRAINT "bus_crews_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_crews_bus_id_index" ON "bus_crews" USING btree ("bus_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_crews_driver_id_index" ON "bus_crews" USING btree ("driver_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bus_crews_bus_id_driver_id_index" ON "bus_crews" USING btree ("bus_id","driver_id") WHERE "bus_crews"."deleted_at" is null;