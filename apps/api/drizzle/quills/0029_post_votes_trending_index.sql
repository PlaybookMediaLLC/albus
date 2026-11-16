-- Adds post_votes_workspace_post_created_idx for the post list's Trending sort. Startup builds it
-- CONCURRENTLY after the migrations (CONCURRENT_INDEX_SPECS in schema-ops.ts), so this migration has
-- no DDL and changes no rows. Until the build ends, Trending reads every vote of each listed post.
-- An interrupted build finishes on the next startup (completion.test.ts).
-- Rollback: restore the verified backup; the previous application rejects this migration ledger.
SELECT quills_migrations.capture_schema_manifest();
