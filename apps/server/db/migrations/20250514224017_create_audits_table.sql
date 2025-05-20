CREATE TABLE IF NOT EXISTS "audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"service" text NOT NULL,
	"endpoint" text,
	"details" json,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audits" ADD CONSTRAINT "audits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_user_id_index" ON "audits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_service_index" ON "audits" USING btree ("service");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_endpoint_index" ON "audits" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audits_ip_address_index" ON "audits" USING btree ("ip_address");
