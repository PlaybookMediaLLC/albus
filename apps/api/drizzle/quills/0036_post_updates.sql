CREATE TABLE "quills"."post_updates" (
	"workspace_id" text DEFAULT nullif(current_setting('quills.workspace_id', true), '') NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"principal_id" uuid,
	"body" text NOT NULL,
	"channels" jsonb NOT NULL,
	"segment_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"release_confirmed" boolean NOT NULL,
	"counts" jsonb NOT NULL,
	"recipient_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_updates_workspace_id_id_pk" PRIMARY KEY("workspace_id","id"),
	CONSTRAINT "post_updates_body_length_check" CHECK (char_length("quills"."post_updates"."body") BETWEEN 1 AND 5000)
);
--> statement-breakpoint
ALTER TABLE "quills"."post_updates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quills"."post_updates" ADD CONSTRAINT "post_updates_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quills"."post_updates" ADD CONSTRAINT "post_updates_workspace_id_post_id_posts_workspace_id_id_fk" FOREIGN KEY ("workspace_id","post_id") REFERENCES "quills"."posts"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quills"."post_updates" ADD CONSTRAINT "post_updates_workspace_id_principal_id_principal_workspace_id_id_fk" FOREIGN KEY ("workspace_id","principal_id") REFERENCES "quills"."principal"("workspace_id","id") ON DELETE SET NULL ("principal_id") ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "post_updates_idempotency_unique" ON "quills"."post_updates" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "post_updates_post_idx" ON "quills"."post_updates" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "post_updates_principal_idx" ON "quills"."post_updates" USING btree ("principal_id");--> statement-breakpoint
CREATE POLICY "workspace_isolation" ON "quills"."post_updates" AS PERMISSIVE FOR ALL TO public USING ("quills"."post_updates"."workspace_id" = nullif(current_setting('quills.workspace_id', true), '')) WITH CHECK ("quills"."post_updates"."workspace_id" = nullif(current_setting('quills.workspace_id', true), ''));
--> statement-breakpoint
ALTER TABLE "quills"."post_updates" FORCE ROW LEVEL SECURITY;

--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
