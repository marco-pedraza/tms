DROP INDEX IF EXISTS "node_events_active_index";--> statement-breakpoint
DROP INDEX IF EXISTS "node_events_deleted_at_index";--> statement-breakpoint
ALTER TABLE "node_events" DROP COLUMN IF EXISTS "notes";--> statement-breakpoint
ALTER TABLE "node_events" DROP COLUMN IF EXISTS "active";--> statement-breakpoint
ALTER TABLE "node_events" DROP COLUMN IF EXISTS "deleted_at";