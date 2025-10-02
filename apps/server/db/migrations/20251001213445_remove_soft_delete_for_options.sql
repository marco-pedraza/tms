DROP INDEX IF EXISTS "pathway_option_tolls_deleted_at_index";--> statement-breakpoint
DROP INDEX IF EXISTS "pathway_option_tolls_pathway_option_id_sequence_index";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pathway_options_pathway_id_is_default_unique" ON "pathway_options" USING btree ("pathway_id") WHERE is_default = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pathway_option_tolls_pathway_option_id_sequence_index" ON "pathway_option_tolls" USING btree ("pathway_option_id","sequence");--> statement-breakpoint
ALTER TABLE "pathway_option_tolls" DROP COLUMN IF EXISTS "deleted_at";