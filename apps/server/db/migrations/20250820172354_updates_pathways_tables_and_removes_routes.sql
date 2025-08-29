CREATE TABLE IF NOT EXISTS "pathway_option_tolls" (
	"id" serial PRIMARY KEY NOT NULL,
	"pathway_option_id" integer NOT NULL,
	"node_id" integer NOT NULL,
	"sequence" integer NOT NULL,
	"pass_time_min" integer NOT NULL,
	"distance" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pathway_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"pathway_id" integer NOT NULL,
	"name" text,
	"description" text,
	"distance_km" real,
	"typical_time_min" integer,
	"avg_speed_kmh" real,
	"is_default" boolean,
	"is_pass_through" boolean,
	"pass_through_time_min" integer,
	"sequence" integer,
	"active" boolean,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "route_segments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "routes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "route_segments" CASCADE;--> statement-breakpoint
DROP TABLE "routes" CASCADE;--> statement-breakpoint
ALTER TABLE "pathways" DROP CONSTRAINT "pathways_name_unique";--> statement-breakpoint
ALTER TABLE "pathways" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pathways" ALTER COLUMN "updated_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "origin_node_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "destination_node_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "origin_city_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "destination_city_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "is_sellable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "is_empty_trip" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pathways" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pathway_option_tolls" ADD CONSTRAINT "pathway_option_tolls_pathway_option_id_pathway_options_id_fk" FOREIGN KEY ("pathway_option_id") REFERENCES "public"."pathway_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pathway_option_tolls" ADD CONSTRAINT "pathway_option_tolls_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pathway_options" ADD CONSTRAINT "pathway_options_pathway_id_pathways_id_fk" FOREIGN KEY ("pathway_id") REFERENCES "public"."pathways"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pathway_option_tolls_pathway_option_id_sequence_index" ON "pathway_option_tolls" USING btree ("pathway_option_id","sequence") WHERE "pathway_option_tolls"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathway_option_tolls_node_id_index" ON "pathway_option_tolls" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathway_option_tolls_pathway_option_id_index" ON "pathway_option_tolls" USING btree ("pathway_option_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathway_option_tolls_sequence_index" ON "pathway_option_tolls" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathway_option_tolls_deleted_at_index" ON "pathway_option_tolls" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathway_options_pathway_id_index" ON "pathway_options" USING btree ("pathway_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathway_options_sequence_index" ON "pathway_options" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathway_options_deleted_at_index" ON "pathway_options" USING btree ("deleted_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pathways" ADD CONSTRAINT "pathways_origin_node_id_nodes_id_fk" FOREIGN KEY ("origin_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pathways" ADD CONSTRAINT "pathways_destination_node_id_nodes_id_fk" FOREIGN KEY ("destination_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pathways" ADD CONSTRAINT "pathways_origin_city_id_cities_id_fk" FOREIGN KEY ("origin_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pathways" ADD CONSTRAINT "pathways_destination_city_id_cities_id_fk" FOREIGN KEY ("destination_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathways_origin_node_id_index" ON "pathways" USING btree ("origin_node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathways_destination_node_id_index" ON "pathways" USING btree ("destination_node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathways_origin_city_id_index" ON "pathways" USING btree ("origin_city_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathways_destination_city_id_index" ON "pathways" USING btree ("destination_city_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathways_active_index" ON "pathways" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pathways_deleted_at_index" ON "pathways" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pathways_name_index" ON "pathways" USING btree ("name") WHERE "pathways"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pathways_code_index" ON "pathways" USING btree ("code") WHERE "pathways"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "pathways" DROP COLUMN IF EXISTS "distance";--> statement-breakpoint
ALTER TABLE "pathways" DROP COLUMN IF EXISTS "typical_time";--> statement-breakpoint
ALTER TABLE "pathways" DROP COLUMN IF EXISTS "meta";--> statement-breakpoint
ALTER TABLE "pathways" DROP COLUMN IF EXISTS "toll_road";