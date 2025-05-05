CREATE TABLE "buses" (
	"id" serial PRIMARY KEY NOT NULL,
	"registration_number" text NOT NULL,
	"model_id" integer NOT NULL,
	"seat_diagram_id" integer NOT NULL,
	"type_code" integer,
	"brand_code" text,
	"model_code" text,
	"max_capacity" integer,
	"purchase_date" date,
	"economic_number" text,
	"license_plate_type" text,
	"circulation_card" text,
	"year" integer,
	"sct_permit" text,
	"vehicle_id" text,
	"gross_vehicle_weight" numeric,
	"engine_number" text,
	"serial_number" text,
	"chassis_number" text,
	"sap_key" text,
	"base_code" text,
	"erp_client_number" text,
	"cost_center" text,
	"fuel_efficiency" numeric,
	"alternate_company" text,
	"service_type" text,
	"commercial_tourism" boolean DEFAULT false,
	"available" boolean DEFAULT true,
	"tourism" boolean DEFAULT false,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"last_maintenance_date" date,
	"next_maintenance_date" date,
	"gps_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "buses_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "bus_id" integer;--> statement-breakpoint
ALTER TABLE "buses" ADD CONSTRAINT "buses_model_id_bus_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."bus_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buses" ADD CONSTRAINT "buses_seat_diagram_id_seat_diagrams_id_fk" FOREIGN KEY ("seat_diagram_id") REFERENCES "public"."seat_diagrams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_bus_id_buses_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."buses"("id") ON DELETE no action ON UPDATE no action;