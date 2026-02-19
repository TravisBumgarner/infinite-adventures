CREATE TABLE "quick_note_history" (
	"id" text PRIMARY KEY NOT NULL,
	"quick_note_id" text NOT NULL,
	"content" text NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quick_note_history" ADD CONSTRAINT "quick_note_history_quick_note_id_quick_notes_id_fk" FOREIGN KEY ("quick_note_id") REFERENCES "public"."quick_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quick_note_history_quick_note_id_idx" ON "quick_note_history" USING btree ("quick_note_id");