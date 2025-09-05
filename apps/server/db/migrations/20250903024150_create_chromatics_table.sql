CREATE TABLE IF NOT EXISTS "chromatics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "buses" ADD COLUMN "chromatic_id" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chromatics_deleted_at_index" ON "chromatics" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "chromatics_name_index" ON "chromatics" USING btree ("name") WHERE "chromatics"."deleted_at" is null;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "buses" ADD CONSTRAINT "buses_chromatic_id_chromatics_id_fk" FOREIGN KEY ("chromatic_id") REFERENCES "public"."chromatics"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "buses_chromatic_id_index" ON "buses" USING btree ("chromatic_id");