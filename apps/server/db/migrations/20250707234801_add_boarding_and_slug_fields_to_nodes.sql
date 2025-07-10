ALTER TABLE "nodes" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "allows_boarding" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "allows_alighting" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nodes_slug_index" ON "nodes" USING btree ("slug") WHERE "nodes"."deleted_at" is null;