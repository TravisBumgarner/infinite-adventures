DROP INDEX IF EXISTS "canvas_items_search_vector_idx";--> statement-breakpoint
ALTER TABLE "canvas_items" drop column "search_vector";--> statement-breakpoint
ALTER TABLE "canvas_items" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("summary", ''))) STORED;--> statement-breakpoint
CREATE INDEX "canvas_items_search_vector_idx" ON "canvas_items" USING gin ("search_vector");