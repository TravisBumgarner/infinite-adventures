CREATE TABLE "canvases" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" text DEFAULT now()::text NOT NULL,
	"updated_at" text DEFAULT now()::text NOT NULL
);
--> statement-breakpoint
INSERT INTO "canvases" ("id", "name") VALUES ('default', 'Default');
--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "canvas_id" text;
--> statement-breakpoint
UPDATE "notes" SET "canvas_id" = 'default' WHERE "canvas_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "canvas_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "public"."canvases"("id") ON DELETE no action ON UPDATE no action;
