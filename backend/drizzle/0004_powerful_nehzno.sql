CREATE TABLE "canvas_item_links" (
	"source_item_id" text NOT NULL,
	"target_item_id" text NOT NULL,
	"snippet" text,
	"created_at" text DEFAULT now()::text NOT NULL,
	CONSTRAINT "canvas_item_links_source_item_id_target_item_id_pk" PRIMARY KEY("source_item_id","target_item_id")
);
--> statement-breakpoint
CREATE TABLE "canvas_items" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"canvas_x" double precision DEFAULT 0 NOT NULL,
	"canvas_y" double precision DEFAULT 0 NOT NULL,
	"canvas_id" text NOT NULL,
	"user_id" text,
	"content_id" text NOT NULL,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce("title", ''))) STORED
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" text PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"content_id" text NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"is_selected" boolean DEFAULT false NOT NULL,
	"created_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" text PRIMARY KEY NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "things" (
	"id" text PRIMARY KEY NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "canvas_item_links" ADD CONSTRAINT "canvas_item_links_source_item_id_canvas_items_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."canvas_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_item_links" ADD CONSTRAINT "canvas_item_links_target_item_id_canvas_items_id_fk" FOREIGN KEY ("target_item_id") REFERENCES "public"."canvas_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_items" ADD CONSTRAINT "canvas_items_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "public"."canvases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_items" ADD CONSTRAINT "canvas_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "canvas_items_search_vector_idx" ON "canvas_items" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "canvas_items_canvas_id_idx" ON "canvas_items" USING btree ("canvas_id");--> statement-breakpoint
CREATE INDEX "canvas_items_user_id_idx" ON "canvas_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "canvas_items_content_id_idx" ON "canvas_items" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "photos_content_idx" ON "photos" USING btree ("content_type","content_id");