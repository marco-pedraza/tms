CREATE TABLE IF NOT EXISTS "installation_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "installations" ADD COLUMN "installation_type_id" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installation_types_deleted_at_index" ON "installation_types" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "installation_types_name_index" ON "installation_types" USING btree ("name") WHERE "installation_types"."deleted_at" is null;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "installations" ADD CONSTRAINT "installations_installation_type_id_installation_types_id_fk" FOREIGN KEY ("installation_type_id") REFERENCES "public"."installation_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
