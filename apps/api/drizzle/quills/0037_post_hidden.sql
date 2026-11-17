ALTER TABLE "quills"."posts" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
