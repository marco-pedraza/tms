ALTER TABLE "event_types" ALTER COLUMN "base_time" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "nodes" ALTER COLUMN "population_id" DROP NOT NULL;