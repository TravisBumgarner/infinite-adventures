ALTER TABLE "canvas_items" ADD COLUMN "summary" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;