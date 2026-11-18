ALTER TABLE "quills"."ai_usage_log" ADD COLUMN "cost_usd" numeric(12, 6);
--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
