CREATE TABLE IF NOT EXISTS "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_key" text NOT NULL,
	"payroll_key" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"hire_date" date,
	"status" text NOT NULL,
	"status_date" date NOT NULL,
	"license" text NOT NULL,
	"license_expiry" date NOT NULL,
	"transporter_id" integer NOT NULL,
	"bus_line_id" integer NOT NULL,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relationship" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drivers" ADD CONSTRAINT "drivers_transporter_id_transporters_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."transporters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drivers" ADD CONSTRAINT "drivers_bus_line_id_bus_lines_id_fk" FOREIGN KEY ("bus_line_id") REFERENCES "public"."bus_lines"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drivers_first_name_index" ON "drivers" USING btree ("first_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drivers_last_name_index" ON "drivers" USING btree ("last_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drivers_email_index" ON "drivers" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drivers_phone_index" ON "drivers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drivers_transporter_id_index" ON "drivers" USING btree ("transporter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drivers_bus_line_id_index" ON "drivers" USING btree ("bus_line_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drivers_status_index" ON "drivers" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drivers_deleted_at_index" ON "drivers" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "drivers_driver_key_index" ON "drivers" USING btree ("driver_key") WHERE "drivers"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "drivers_payroll_key_index" ON "drivers" USING btree ("payroll_key") WHERE "drivers"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_index" ON "refresh_tokens" USING btree ("user_id");
