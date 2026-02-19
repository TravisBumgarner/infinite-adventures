CREATE TABLE "content_history" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"source_type" text NOT NULL,
	"content" text NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "content_history_source_id_idx" ON "content_history" USING btree ("source_id");
--> statement-breakpoint
INSERT INTO "content_history" ("id", "source_id", "source_type", "content", "snapshot_at")
SELECT "id", "note_id", 'note', "content", "snapshot_at" FROM "note_history";
--> statement-breakpoint
INSERT INTO "content_history" ("id", "source_id", "source_type", "content", "snapshot_at")
SELECT "id", "quick_note_id", 'quick_note', "content", "snapshot_at" FROM "quick_note_history";
--> statement-breakpoint
DROP TABLE "note_history";
--> statement-breakpoint
DROP TABLE "quick_note_history";
