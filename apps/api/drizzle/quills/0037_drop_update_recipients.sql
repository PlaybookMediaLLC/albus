ALTER TABLE "quills"."post_updates" DROP COLUMN "recipient_ids";
--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
