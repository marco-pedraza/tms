CREATE TABLE IF NOT EXISTS "rolling_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"busline_id" integer NOT NULL,
	"service_type_id" integer NOT NULL,
	"bus_model_id" integer NOT NULL,
	"base_node_id" integer NOT NULL,
	"operation_type" text NOT NULL,
	"cycle_duration_days" integer,
	"operation_days" jsonb,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rolling_plans" ADD CONSTRAINT "rolling_plans_busline_id_bus_lines_id_fk" FOREIGN KEY ("busline_id") REFERENCES "public"."bus_lines"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rolling_plans" ADD CONSTRAINT "rolling_plans_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rolling_plans" ADD CONSTRAINT "rolling_plans_bus_model_id_bus_models_id_fk" FOREIGN KEY ("bus_model_id") REFERENCES "public"."bus_models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rolling_plans" ADD CONSTRAINT "rolling_plans_base_node_id_nodes_id_fk" FOREIGN KEY ("base_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plans_busline_id_index" ON "rolling_plans" USING btree ("busline_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plans_service_type_id_index" ON "rolling_plans" USING btree ("service_type_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plans_bus_model_id_index" ON "rolling_plans" USING btree ("bus_model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plans_base_node_id_index" ON "rolling_plans" USING btree ("base_node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plans_active_index" ON "rolling_plans" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plans_deleted_at_index" ON "rolling_plans" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rolling_plans_busline_id_name_index" ON "rolling_plans" USING btree ("busline_id","name") WHERE "rolling_plans"."deleted_at" is null;