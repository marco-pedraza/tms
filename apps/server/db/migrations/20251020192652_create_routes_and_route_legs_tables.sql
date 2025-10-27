CREATE TABLE IF NOT EXISTS "routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"service_type_id" integer NOT NULL,
	"busline_id" integer NOT NULL,
	"origin_node_id" integer NOT NULL,
	"destination_node_id" integer NOT NULL,
	"origin_city_id" integer NOT NULL,
	"destination_city_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "route_legs" (
	"id" serial PRIMARY KEY NOT NULL,
	"position" integer NOT NULL,
	"route_id" integer NOT NULL,
	"origin_node_id" integer NOT NULL,
	"destination_node_id" integer NOT NULL,
	"pathway_id" integer NOT NULL,
	"pathway_option_id" integer NOT NULL,
	"is_derived" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_busline_id_bus_lines_id_fk" FOREIGN KEY ("busline_id") REFERENCES "public"."bus_lines"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_origin_node_id_nodes_id_fk" FOREIGN KEY ("origin_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_destination_node_id_nodes_id_fk" FOREIGN KEY ("destination_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "route_legs" ADD CONSTRAINT "route_legs_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "route_legs" ADD CONSTRAINT "route_legs_origin_node_id_nodes_id_fk" FOREIGN KEY ("origin_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "route_legs" ADD CONSTRAINT "route_legs_destination_node_id_nodes_id_fk" FOREIGN KEY ("destination_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "route_legs" ADD CONSTRAINT "route_legs_pathway_id_pathways_id_fk" FOREIGN KEY ("pathway_id") REFERENCES "public"."pathways"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "route_legs" ADD CONSTRAINT "route_legs_pathway_option_id_pathway_options_id_fk" FOREIGN KEY ("pathway_option_id") REFERENCES "public"."pathway_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "routes_code_index" ON "routes" USING btree ("code") WHERE "routes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_name_index" ON "routes" USING btree ("name") WHERE "routes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_service_type_id_index" ON "routes" USING btree ("service_type_id") WHERE "routes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_busline_id_index" ON "routes" USING btree ("busline_id") WHERE "routes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_origin_node_id_index" ON "routes" USING btree ("origin_node_id") WHERE "routes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_destination_node_id_index" ON "routes" USING btree ("destination_node_id") WHERE "routes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_origin_city_id_index" ON "routes" USING btree ("origin_city_id") WHERE "routes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_destination_city_id_index" ON "routes" USING btree ("destination_city_id") WHERE "routes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "routes_active_index" ON "routes" USING btree ("active") WHERE "routes"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "route_legs_route_id_position_index" ON "route_legs" USING btree ("route_id","position") WHERE "route_legs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_legs_route_id_index" ON "route_legs" USING btree ("route_id") WHERE "route_legs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_legs_origin_node_id_index" ON "route_legs" USING btree ("origin_node_id") WHERE "route_legs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_legs_destination_node_id_index" ON "route_legs" USING btree ("destination_node_id") WHERE "route_legs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_legs_pathway_id_index" ON "route_legs" USING btree ("pathway_id") WHERE "route_legs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_legs_pathway_option_id_index" ON "route_legs" USING btree ("pathway_option_id") WHERE "route_legs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_legs_is_derived_index" ON "route_legs" USING btree ("is_derived") WHERE "route_legs"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_legs_active_index" ON "route_legs" USING btree ("active") WHERE "route_legs"."deleted_at" is null;