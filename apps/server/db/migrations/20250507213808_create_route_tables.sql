CREATE TABLE IF NOT EXISTS "route_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_route_id" integer NOT NULL,
	"segment_route_id" integer NOT NULL,
	"sequence" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"origin_city_id" integer NOT NULL,
	"destination_city_id" integer NOT NULL,
	"origin_terminal_id" integer NOT NULL,
	"destination_terminal_id" integer NOT NULL,
	"pathway_id" integer,
	"distance" real NOT NULL,
	"base_time" integer NOT NULL,
	"is_compound" boolean DEFAULT false NOT NULL,
	"connection_count" integer DEFAULT 0 NOT NULL,
	"total_travel_time" integer NOT NULL,
	"total_distance" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "routes_pathway_id_unique" UNIQUE("pathway_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_parent_route_id_routes_id_fk" FOREIGN KEY ("parent_route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "route_segments" ADD CONSTRAINT "route_segments_segment_route_id_routes_id_fk" FOREIGN KEY ("segment_route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_origin_city_id_cities_id_fk" FOREIGN KEY ("origin_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_destination_city_id_cities_id_fk" FOREIGN KEY ("destination_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_origin_terminal_id_terminals_id_fk" FOREIGN KEY ("origin_terminal_id") REFERENCES "public"."terminals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_destination_terminal_id_terminals_id_fk" FOREIGN KEY ("destination_terminal_id") REFERENCES "public"."terminals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_pathway_id_pathways_id_fk" FOREIGN KEY ("pathway_id") REFERENCES "public"."pathways"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_name_index" ON "routes" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_origin_city_id_destination_city_id_index" ON "routes" USING btree ("origin_city_id","destination_city_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_origin_terminal_id_destination_terminal_id_index" ON "routes" USING btree ("origin_terminal_id","destination_terminal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_segments_parent_route_id_sequence_index" ON "route_segments" USING btree ("parent_route_id","sequence");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_segments_segment_route_id_index" ON "route_segments" USING btree ("segment_route_id");
