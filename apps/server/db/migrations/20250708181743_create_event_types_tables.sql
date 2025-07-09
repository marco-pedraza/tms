CREATE TABLE IF NOT EXISTS "event_type_installation_types" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"event_type_id" bigint NOT NULL,
	"installation_type_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_types" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"base_time" integer NOT NULL,
	"needs_cost" boolean DEFAULT false NOT NULL,
	"needs_quantity" boolean DEFAULT false NOT NULL,
	"integration" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "node_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"node_id" integer NOT NULL,
	"event_type_id" bigint NOT NULL,
	"custom_time" integer,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_type_installation_types" ADD CONSTRAINT "event_type_installation_types_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_type_installation_types" ADD CONSTRAINT "event_type_installation_types_installation_type_id_installation_types_id_fk" FOREIGN KEY ("installation_type_id") REFERENCES "public"."installation_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_events" ADD CONSTRAINT "node_events_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node_events" ADD CONSTRAINT "node_events_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_type_installation_types_event_type_id_index" ON "event_type_installation_types" USING btree ("event_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_type_installation_types_installation_type_id_index" ON "event_type_installation_types" USING btree ("installation_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_type_installation_types_event_type_id_installation_type_id_index" ON "event_type_installation_types" USING btree ("event_type_id","installation_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_types_name_index" ON "event_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_types_active_index" ON "event_types" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_types_deleted_at_index" ON "event_types" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_types_code_index" ON "event_types" USING btree ("code") WHERE "event_types"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "node_events_node_id_index" ON "node_events" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "node_events_event_type_id_index" ON "node_events" USING btree ("event_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "node_events_active_index" ON "node_events" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "node_events_deleted_at_index" ON "node_events" USING btree ("deleted_at");