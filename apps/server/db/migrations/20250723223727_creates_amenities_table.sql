CREATE TABLE IF NOT EXISTS "amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"amenity_type" text NOT NULL,
	"description" text,
	"icon_name" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "installation_amenities" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"installation_id" integer NOT NULL,
	"amenity_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "installation_amenities" ADD CONSTRAINT "installation_amenities_installation_id_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."installations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "installation_amenities" ADD CONSTRAINT "installation_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "amenities_category_index" ON "amenities" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "amenities_amenity_type_index" ON "amenities" USING btree ("amenity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "amenities_active_index" ON "amenities" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "amenities_deleted_at_index" ON "amenities" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "amenities_name_index" ON "amenities" USING btree ("name") WHERE "amenities"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installation_amenities_amenity_id_index" ON "installation_amenities" USING btree ("amenity_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "installation_amenities_installation_id_amenity_id_index" ON "installation_amenities" USING btree ("installation_id","amenity_id");