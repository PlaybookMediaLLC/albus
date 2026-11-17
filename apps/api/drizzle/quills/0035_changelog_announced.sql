ALTER TABLE "quills"."changelog_reads" ADD COLUMN "announced_at" timestamp with time zone;
--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
