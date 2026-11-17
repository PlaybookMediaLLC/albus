ALTER TABLE "quills"."post_tasks" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "quills"."post_tasks" ADD CONSTRAINT "post_tasks_source_check" CHECK ("quills"."post_tasks"."source" IN ('manual', 'rule', 'import'));
--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
