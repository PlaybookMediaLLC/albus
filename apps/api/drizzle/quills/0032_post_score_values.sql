ALTER TABLE "quills"."posts" ADD COLUMN "score_values" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
