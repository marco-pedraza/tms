CREATE TABLE IF NOT EXISTS "driver_medical_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" integer NOT NULL,
	"check_date" date NOT NULL,
	"next_check_date" date NOT NULL,
	"days_until_next_check" integer NOT NULL,
	"source" text NOT NULL,
	"result" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "driver_medical_checks" ADD CONSTRAINT "driver_medical_checks_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_medical_checks_deleted_at_index" ON "driver_medical_checks" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_medical_checks_check_date_index" ON "driver_medical_checks" USING btree ("check_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_medical_checks_source_index" ON "driver_medical_checks" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_medical_checks_result_index" ON "driver_medical_checks" USING btree ("result");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_medical_checks_driver_id_check_date_index" ON "driver_medical_checks" USING btree ("driver_id","check_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "driver_medical_checks_driver_id_next_check_date_index" ON "driver_medical_checks" USING btree ("driver_id","next_check_date");