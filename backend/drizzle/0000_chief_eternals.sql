CREATE TABLE "canvas_item_links" (
	"source_item_id" uuid NOT NULL,
	"target_item_id" uuid NOT NULL,
	"snippet" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "canvas_item_links_source_item_id_target_item_id_pk" PRIMARY KEY("source_item_id","target_item_id")
);
--> statement-breakpoint
CREATE TABLE "canvas_item_tags" (
	"canvas_item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "canvas_item_tags_canvas_item_id_tag_id_pk" PRIMARY KEY("canvas_item_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "canvas_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"canvas_x" double precision DEFAULT 0 NOT NULL,
	"canvas_y" double precision DEFAULT 0 NOT NULL,
	"canvas_id" uuid NOT NULL,
	"user_id" uuid,
	"content_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("summary", ''))) STORED
);
--> statement-breakpoint
CREATE TABLE "canvas_users" (
	"canvas_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "canvas_users_canvas_id_user_id_pk" PRIMARY KEY("canvas_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "canvases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"content" text NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"canvas_item_id" uuid NOT NULL,
	"title" text,
	"content" text DEFAULT '' NOT NULL,
	"plain_content" text DEFAULT '' NOT NULL,
	"is_important" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"content_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"is_main_photo" boolean DEFAULT false NOT NULL,
	"is_important" boolean DEFAULT false NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"aspect_ratio" double precision,
	"blurhash" text,
	"crop_x" double precision,
	"crop_y" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quick_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"canvas_id" uuid NOT NULL,
	"title" text,
	"content" text DEFAULT '' NOT NULL,
	"is_important" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"canvas_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "things" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"auth_id" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "canvas_item_links" ADD CONSTRAINT "canvas_item_links_source_item_id_canvas_items_id_fk" FOREIGN KEY ("source_item_id") REFERENCES "public"."canvas_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_item_links" ADD CONSTRAINT "canvas_item_links_target_item_id_canvas_items_id_fk" FOREIGN KEY ("target_item_id") REFERENCES "public"."canvas_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_item_tags" ADD CONSTRAINT "canvas_item_tags_canvas_item_id_canvas_items_id_fk" FOREIGN KEY ("canvas_item_id") REFERENCES "public"."canvas_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_item_tags" ADD CONSTRAINT "canvas_item_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_items" ADD CONSTRAINT "canvas_items_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "public"."canvases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_items" ADD CONSTRAINT "canvas_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_users" ADD CONSTRAINT "canvas_users_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "public"."canvases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_users" ADD CONSTRAINT "canvas_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_canvas_item_id_canvas_items_id_fk" FOREIGN KEY ("canvas_item_id") REFERENCES "public"."canvas_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_notes" ADD CONSTRAINT "quick_notes_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "public"."canvases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "public"."canvases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "canvas_items_search_vector_idx" ON "canvas_items" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "canvas_items_canvas_id_idx" ON "canvas_items" USING btree ("canvas_id");--> statement-breakpoint
CREATE INDEX "canvas_items_user_id_idx" ON "canvas_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "canvas_items_content_id_idx" ON "canvas_items" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "content_history_source_id_idx" ON "content_history" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "notes_canvas_item_id_idx" ON "notes" USING btree ("canvas_item_id");--> statement-breakpoint
CREATE INDEX "photos_content_idx" ON "photos" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "quick_notes_canvas_id_idx" ON "quick_notes" USING btree ("canvas_id");--> statement-breakpoint
CREATE INDEX "tags_canvas_id_idx" ON "tags" USING btree ("canvas_id");