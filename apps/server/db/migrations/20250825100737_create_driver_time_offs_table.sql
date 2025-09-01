CREATE TABLE IF NOT EXISTS "driver_time_offs" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"type" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "driver_time_offs" ADD CONSTRAINT "driver_time_offs_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_time_offs_start_date_index" ON "driver_time_offs" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_time_offs_end_date_index" ON "driver_time_offs" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_time_offs_type_index" ON "driver_time_offs" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_time_offs_deleted_at_index" ON "driver_time_offs" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_time_offs_driver_id_start_date_end_date_index" ON "driver_time_offs" USING btree ("driver_id","start_date","end_date");