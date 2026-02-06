-- Add session_date column to sessions table
ALTER TABLE "sessions" ADD COLUMN "session_date" text NOT NULL DEFAULT (now()::date)::text;
