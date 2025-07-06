ALTER TABLE "installations" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "installations" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "installations" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "active" boolean DEFAULT true NOT NULL;