CREATE TABLE "quills"."changelog_translations" (
	"workspace_id" text DEFAULT nullif(current_setting('quills.workspace_id', true), '') NOT NULL,
	"changelog_entry_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "changelog_translations_pk" PRIMARY KEY("workspace_id","changelog_entry_id","locale"),
	CONSTRAINT "changelog_translations_locale_check" CHECK ("quills"."changelog_translations"."locale" ~ '^[a-z]{2,3}(-[a-z]{2,4})?$'),
	CONSTRAINT "changelog_translations_title_check" CHECK (char_length("quills"."changelog_translations"."title") BETWEEN 1 AND 200),
	CONSTRAINT "changelog_translations_content_check" CHECK (char_length("quills"."changelog_translations"."content") BETWEEN 1 AND 100000)
);
--> statement-breakpoint
ALTER TABLE "quills"."changelog_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quills"."changelog_translations" ADD CONSTRAINT "changelog_translations_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quills"."changelog_translations" ADD CONSTRAINT "changelog_translations_entry_fk" FOREIGN KEY ("workspace_id","changelog_entry_id") REFERENCES "quills"."changelog_entries"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "workspace_isolation" ON "quills"."changelog_translations" AS PERMISSIVE FOR ALL TO public USING ("quills"."changelog_translations"."workspace_id" = nullif(current_setting('quills.workspace_id', true), '')) WITH CHECK ("quills"."changelog_translations"."workspace_id" = nullif(current_setting('quills.workspace_id', true), ''));
--> statement-breakpoint
ALTER TABLE "quills"."changelog_translations" FORCE ROW LEVEL SECURITY;

--> statement-breakpoint
-- A workspace import inserts tables in any order and defers foreign keys until commit
-- (transfer/import-archive.ts), as 0005, 0025 and 0026 set up for the other tables.
DO $$ DECLARE fk record; BEGIN
 FOR fk IN SELECT c.conname, t.relname FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relnamespace = 'quills'::regnamespace AND c.contype = 'f' AND c.conparentid = 0
  AND t.relname = 'changelog_translations' LOOP
  EXECUTE format('ALTER TABLE quills.%I ALTER CONSTRAINT %I DEFERRABLE INITIALLY IMMEDIATE', fk.relname, fk.conname);
 END LOOP;
END $$;

--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
