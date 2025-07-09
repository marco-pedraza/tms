CREATE TABLE IF NOT EXISTS "installation_properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"installation_id" integer NOT NULL,
	"installation_schema_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "installation_schemas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"installation_type_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "installation_properties" ADD CONSTRAINT "installation_properties_installation_id_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."installations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "installation_properties" ADD CONSTRAINT "installation_properties_installation_schema_id_installation_schemas_id_fk" FOREIGN KEY ("installation_schema_id") REFERENCES "public"."installation_schemas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "installation_schemas" ADD CONSTRAINT "installation_schemas_installation_type_id_installation_types_id_fk" FOREIGN KEY ("installation_type_id") REFERENCES "public"."installation_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installation_properties_installation_id_index" ON "installation_properties" USING btree ("installation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installation_properties_installation_schema_id_index" ON "installation_properties" USING btree ("installation_schema_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installation_properties_deleted_at_index" ON "installation_properties" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "installation_properties_installation_schema_unique_index" ON "installation_properties" USING btree ("installation_id","installation_schema_id") WHERE "installation_properties"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installation_schemas_installation_type_id_index" ON "installation_schemas" USING btree ("installation_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installation_schemas_deleted_at_index" ON "installation_schemas" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "installation_schemas_name_installation_type_id_index" ON "installation_schemas" USING btree ("name","installation_type_id") WHERE "installation_schemas"."deleted_at" is null;