CREATE TABLE "note_history" (
	"id" text PRIMARY KEY NOT NULL,
	"note_id" text NOT NULL,
	"content" text NOT NULL,
	"snapshot_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "note_history" ADD CONSTRAINT "note_history_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "note_history_note_id_idx" ON "note_history" USING btree ("note_id");