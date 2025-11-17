ALTER TABLE "drivers" ADD COLUMN "base_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drivers" ADD CONSTRAINT "drivers_base_id_nodes_id_fk" FOREIGN KEY ("base_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drivers_base_id_index" ON "drivers" USING btree ("base_id");