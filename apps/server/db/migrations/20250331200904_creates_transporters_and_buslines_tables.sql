CREATE TABLE IF NOT EXISTS "bus_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"transporter_id" integer NOT NULL,
	"service_type_id" integer NOT NULL,
	"price_per_km_multiplier" real DEFAULT 1 NOT NULL,
	"description" text,
	"fleet_size" integer,
	"website" text,
	"email" text,
	"phone" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transporters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(10) NOT NULL,
	"description" text,
	"website" text,
	"email" text,
	"phone" text,
	"headquarter_city_id" integer,
	"logo_url" text,
	"contact_info" text,
	"license_number" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transporters_code_unique" UNIQUE("code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_lines" ADD CONSTRAINT "bus_lines_transporter_id_transporters_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."transporters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transporters" ADD CONSTRAINT "transporters_headquarter_city_id_cities_id_fk" FOREIGN KEY ("headquarter_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bus_lines" ADD CONSTRAINT "bus_lines_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_lines_transporter_id_index" ON "bus_lines" USING btree ("transporter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_lines_service_type_id_index" ON "bus_lines" USING btree ("service_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_lines_deleted_at_index" ON "bus_lines" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bus_lines_active_index" ON "bus_lines" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bus_lines_name_index" ON "bus_lines" USING btree ("name") WHERE "bus_lines"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bus_lines_code_index" ON "bus_lines" USING btree ("code") WHERE "bus_lines"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_types_deleted_at_index" ON "service_types" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "service_types_name_index" ON "service_types" USING btree ("name") WHERE "service_types"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "service_types_code_index" ON "service_types" USING btree ("code") WHERE "service_types"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transporters_name_index" ON "transporters" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transporters_headquarter_city_id_index" ON "transporters" USING btree ("headquarter_city_id");
