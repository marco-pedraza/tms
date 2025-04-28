CREATE TABLE IF NOT EXISTS "pathway_service_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"pathway_id" integer NOT NULL,
	"pathway_service_id" integer NOT NULL,
	"associated_cost" real,
	"sequence" integer NOT NULL,
	"distance_from_origin" real NOT NULL,
	"mandatory" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pathway_service_assignments_pathway_id_pathway_service_id_unique" UNIQUE("pathway_id","pathway_service_id"),
	CONSTRAINT "pathway_service_assignments_pathway_id_sequence_unique" UNIQUE("pathway_id","sequence")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pathway_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"service_type" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"category" text NOT NULL,
	"provider" text NOT NULL,
	"provider_schedule_hours" jsonb NOT NULL,
	"duration" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pathway_services_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pathways" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"distance" real NOT NULL,
	"typical_time" integer NOT NULL,
	"meta" jsonb NOT NULL,
	"toll_road" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pathways_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pathway_service_assignments" ADD CONSTRAINT "pathway_service_assignments_pathway_id_pathways_id_fk" FOREIGN KEY ("pathway_id") REFERENCES "public"."pathways"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pathway_service_assignments" ADD CONSTRAINT "pathway_service_assignments_pathway_service_id_pathway_services_id_fk" FOREIGN KEY ("pathway_service_id") REFERENCES "public"."pathway_services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "pathway_service_assignments" DROP CONSTRAINT "pathway_service_assignments_pathway_id_pathways_id_fk";
--> statement-breakpoint
ALTER TABLE "pathway_service_assignments" DROP CONSTRAINT "pathway_service_assignments_pathway_service_id_pathway_services_id_fk";
--> statement-breakpoint
ALTER TABLE "pathway_service_assignments" ALTER COLUMN "mandatory" SET DEFAULT true;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pathway_service_assignments" ADD CONSTRAINT "pathway_service_assignments_pathway_id_pathways_id_fk" FOREIGN KEY ("pathway_id") REFERENCES "public"."pathways"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pathway_service_assignments" ADD CONSTRAINT "pathway_service_assignments_pathway_service_id_pathway_services_id_fk" FOREIGN KEY ("pathway_service_id") REFERENCES "public"."pathway_services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
