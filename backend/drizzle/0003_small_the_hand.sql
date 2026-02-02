CREATE TABLE "canvas_users" (
	"canvas_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "canvas_users_canvas_id_user_id_pk" PRIMARY KEY("canvas_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "canvas_users" ADD CONSTRAINT "canvas_users_canvas_id_canvases_id_fk" FOREIGN KEY ("canvas_id") REFERENCES "public"."canvases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canvas_users" ADD CONSTRAINT "canvas_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DELETE FROM "notes" WHERE "canvas_id" = '00000000-0000-4000-8000-000000000000';--> statement-breakpoint
DELETE FROM "canvases" WHERE "id" = '00000000-0000-4000-8000-000000000000';
