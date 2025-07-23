CREATE TABLE IF NOT EXISTS "label_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"label_id" integer NOT NULL,
	"node_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "labels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "label_nodes" ADD CONSTRAINT "label_nodes_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "label_nodes" ADD CONSTRAINT "label_nodes_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "label_nodes_label_id_node_id_index" ON "label_nodes" USING btree ("label_id","node_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "label_nodes_node_id_index" ON "label_nodes" USING btree ("node_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "labels_name_index" ON "labels" USING btree ("name") WHERE "labels"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "labels_active_index" ON "labels" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "labels_description_index" ON "labels" USING btree ("description");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "labels_deleted_at_index" ON "labels" USING btree ("deleted_at");