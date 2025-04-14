CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_key" text NOT NULL,
	"full_name" text NOT NULL,
	"rfc" text NOT NULL,
	"curp" text NOT NULL,
	"imss" text,
	"civil_status" text,
	"dependents" integer,
	"address_street" text,
	"address_neighborhood" text,
	"address_city" text,
	"address_state" text,
	"postal_code" text,
	"phone_number" text NOT NULL,
	"email" text NOT NULL,
	"driver_type" text NOT NULL,
	"position" text,
	"office_code" text,
	"office_location" text,
	"hire_date" date,
	"status" text NOT NULL,
	"status_date" date NOT NULL,
	"federal_license" text,
	"federal_license_expiry" date,
	"state_license" text,
	"state_license_expiry" date,
	"credit_card" text,
	"credit_card_expiry" date,
	"company" text,
	"transporter_id" integer,
	"bus_line_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "drivers_driver_key_unique" UNIQUE("driver_key"),
	CONSTRAINT "drivers_rfc_unique" UNIQUE("rfc"),
	CONSTRAINT "drivers_curp_unique" UNIQUE("curp")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_transporter_id_transporters_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."transporters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_bus_line_id_bus_lines_id_fk" FOREIGN KEY ("bus_line_id") REFERENCES "public"."bus_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;