CREATE TABLE IF NOT EXISTS "rolling_plan_version_activation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" integer NOT NULL,
	"rolling_plan_id" integer NOT NULL,
	"activated_at" timestamp NOT NULL,
	"deactivated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rolling_plan_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"rolling_plan_id" integer NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"notes" text,
	"activated_at" timestamp,
	"deactivated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rolling_plan_version_activation_logs" ADD CONSTRAINT "rolling_plan_version_activation_logs_version_id_rolling_plan_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."rolling_plan_versions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rolling_plan_version_activation_logs" ADD CONSTRAINT "rolling_plan_version_activation_logs_rolling_plan_id_rolling_plans_id_fk" FOREIGN KEY ("rolling_plan_id") REFERENCES "public"."rolling_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rolling_plan_versions" ADD CONSTRAINT "rolling_plan_versions_rolling_plan_id_rolling_plans_id_fk" FOREIGN KEY ("rolling_plan_id") REFERENCES "public"."rolling_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plan_version_activation_logs_version_id_index" ON "rolling_plan_version_activation_logs" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plan_version_activation_logs_rolling_plan_id_index" ON "rolling_plan_version_activation_logs" USING btree ("rolling_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plan_version_activation_logs_activated_at_index" ON "rolling_plan_version_activation_logs" USING btree ("activated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plan_version_activation_logs_deactivated_at_index" ON "rolling_plan_version_activation_logs" USING btree ("deactivated_at") WHERE "rolling_plan_version_activation_logs"."deactivated_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plan_version_activation_logs_version_id_activated_at_index" ON "rolling_plan_version_activation_logs" USING btree ("version_id","activated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plan_versions_rolling_plan_id_index" ON "rolling_plan_versions" USING btree ("rolling_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plan_versions_state_index" ON "rolling_plan_versions" USING btree ("state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plan_versions_deleted_at_index" ON "rolling_plan_versions" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plan_versions_rolling_plan_id_state_index" ON "rolling_plan_versions" USING btree ("rolling_plan_id","state") WHERE "rolling_plan_versions"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plan_versions_activated_at_index" ON "rolling_plan_versions" USING btree ("activated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rolling_plan_versions_rolling_plan_id_activated_at_index" ON "rolling_plan_versions" USING btree ("rolling_plan_id","activated_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rolling_plan_versions_rolling_plan_id_name_index" ON "rolling_plan_versions" USING btree ("rolling_plan_id","name") WHERE "rolling_plan_versions"."deleted_at" is null;