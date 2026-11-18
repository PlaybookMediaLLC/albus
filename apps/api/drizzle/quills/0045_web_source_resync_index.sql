CREATE INDEX "assistant_web_sources_resync_idx" ON "quills"."assistant_web_sources" USING btree ("fetched_at") WHERE "quills"."assistant_web_sources"."enabled";
--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
