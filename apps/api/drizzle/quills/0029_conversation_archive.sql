ALTER TABLE "quills"."conversations" ADD COLUMN "archived_at" timestamp with time zone;
--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
