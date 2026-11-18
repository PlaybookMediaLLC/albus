CREATE TABLE "quills"."ai_knowledge_questions" (
	"workspace_id" text DEFAULT nullif(current_setting('quills.workspace_id', true), '') NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"suggestion_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"question" text NOT NULL,
	"suggested_answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answer" text,
	"skipped" boolean DEFAULT false NOT NULL,
	"answered_by_id" uuid,
	"answered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_knowledge_questions_workspace_id_id_pk" PRIMARY KEY("workspace_id","id"),
	CONSTRAINT "ai_knowledge_questions_text_check" CHECK ("quills"."ai_knowledge_questions"."position" BETWEEN 0 AND 2 AND char_length("quills"."ai_knowledge_questions"."question") BETWEEN 1 AND 300 AND ("quills"."ai_knowledge_questions"."answer" IS NULL OR char_length("quills"."ai_knowledge_questions"."answer") BETWEEN 1 AND 1000) AND NOT ("quills"."ai_knowledge_questions"."skipped" AND "quills"."ai_knowledge_questions"."answer" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_questions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quills"."ai_knowledge_sources" (
	"workspace_id" text DEFAULT nullif(current_setting('quills.workspace_id', true), '') NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"suggestion_id" uuid,
	"outcome" text NOT NULL,
	"gap" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_knowledge_sources_workspace_id_id_pk" PRIMARY KEY("workspace_id","id")
);
--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quills"."ai_knowledge_suggestions" (
	"workspace_id" text DEFAULT nullif(current_setting('quills.workspace_id', true), '') NOT NULL,
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'awaiting_answer' NOT NULL,
	"gap" boolean DEFAULT false NOT NULL,
	"topic" text NOT NULL,
	"topic_fingerprint" text NOT NULL,
	"candidate_title" text NOT NULL,
	"candidate_content" text NOT NULL,
	"title" text,
	"content" text,
	"embedding" vector(1536),
	"embedding_model" text,
	"evidence_count" integer DEFAULT 1 NOT NULL,
	"question_count" integer DEFAULT 0 NOT NULL,
	"step_index" integer DEFAULT 0 NOT NULL,
	"approved_snippet_id" uuid,
	"decided_by_id" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_knowledge_suggestions_workspace_id_id_pk" PRIMARY KEY("workspace_id","id"),
	CONSTRAINT "ai_knowledge_suggestions_text_check" CHECK (char_length("quills"."ai_knowledge_suggestions"."topic") BETWEEN 1 AND 200 AND char_length("quills"."ai_knowledge_suggestions"."candidate_title") BETWEEN 1 AND 120 AND char_length("quills"."ai_knowledge_suggestions"."candidate_content") BETWEEN 1 AND 2000 AND ("quills"."ai_knowledge_suggestions"."title" IS NULL OR char_length("quills"."ai_knowledge_suggestions"."title") BETWEEN 1 AND 120) AND ("quills"."ai_knowledge_suggestions"."content" IS NULL OR char_length("quills"."ai_knowledge_suggestions"."content") BETWEEN 1 AND 2000)),
	CONSTRAINT "ai_knowledge_suggestions_steps_check" CHECK ("quills"."ai_knowledge_suggestions"."question_count" BETWEEN 0 AND 3 AND "quills"."ai_knowledge_suggestions"."step_index" BETWEEN 0 AND "quills"."ai_knowledge_suggestions"."question_count" AND "quills"."ai_knowledge_suggestions"."evidence_count" >= 1)
);
--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_suggestions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_questions" ADD CONSTRAINT "ai_knowledge_questions_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_questions" ADD CONSTRAINT "ai_knowledge_questions_workspace_id_suggestion_id_ai_knowledge_suggestions_workspace_id_id_fk" FOREIGN KEY ("workspace_id","suggestion_id") REFERENCES "quills"."ai_knowledge_suggestions"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_questions" ADD CONSTRAINT "ai_knowledge_questions_workspace_id_answered_by_id_principal_workspace_id_id_fk" FOREIGN KEY ("workspace_id","answered_by_id") REFERENCES "quills"."principal"("workspace_id","id") ON DELETE SET NULL ("answered_by_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_sources" ADD CONSTRAINT "ai_knowledge_sources_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_sources" ADD CONSTRAINT "ai_knowledge_sources_workspace_id_conversation_id_conversations_workspace_id_id_fk" FOREIGN KEY ("workspace_id","conversation_id") REFERENCES "quills"."conversations"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_sources" ADD CONSTRAINT "ai_knowledge_sources_workspace_id_suggestion_id_ai_knowledge_suggestions_workspace_id_id_fk" FOREIGN KEY ("workspace_id","suggestion_id") REFERENCES "quills"."ai_knowledge_suggestions"("workspace_id","id") ON DELETE SET NULL ("suggestion_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_suggestions" ADD CONSTRAINT "ai_knowledge_suggestions_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_suggestions" ADD CONSTRAINT "ai_knowledge_suggestions_workspace_id_approved_snippet_id_assistant_snippets_workspace_id_id_fk" FOREIGN KEY ("workspace_id","approved_snippet_id") REFERENCES "quills"."assistant_snippets"("workspace_id","id") ON DELETE SET NULL ("approved_snippet_id") ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_suggestions" ADD CONSTRAINT "ai_knowledge_suggestions_workspace_id_decided_by_id_principal_workspace_id_id_fk" FOREIGN KEY ("workspace_id","decided_by_id") REFERENCES "quills"."principal"("workspace_id","id") ON DELETE SET NULL ("decided_by_id") ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_knowledge_questions_position_unique" ON "quills"."ai_knowledge_questions" USING btree ("workspace_id","suggestion_id","position");--> statement-breakpoint
CREATE INDEX "ai_knowledge_questions_answered_by_idx" ON "quills"."ai_knowledge_questions" USING btree ("answered_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_knowledge_sources_conversation_unique" ON "quills"."ai_knowledge_sources" USING btree ("workspace_id","conversation_id");--> statement-breakpoint
CREATE INDEX "ai_knowledge_sources_suggestion_idx" ON "quills"."ai_knowledge_sources" USING btree ("suggestion_id");--> statement-breakpoint
CREATE INDEX "ai_knowledge_suggestions_list_idx" ON "quills"."ai_knowledge_suggestions" USING btree ("workspace_id","status","gap","evidence_count");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_knowledge_suggestions_open_topic_unique" ON "quills"."ai_knowledge_suggestions" USING btree ("workspace_id","topic_fingerprint") WHERE "quills"."ai_knowledge_suggestions"."status" IN ('awaiting_answer', 'drafting', 'draft_ready');--> statement-breakpoint
CREATE INDEX "ai_knowledge_suggestions_snippet_idx" ON "quills"."ai_knowledge_suggestions" USING btree ("approved_snippet_id");--> statement-breakpoint
CREATE INDEX "ai_knowledge_suggestions_decided_by_idx" ON "quills"."ai_knowledge_suggestions" USING btree ("decided_by_id");--> statement-breakpoint
CREATE POLICY "workspace_isolation" ON "quills"."ai_knowledge_questions" AS PERMISSIVE FOR ALL TO public USING ("quills"."ai_knowledge_questions"."workspace_id" = nullif(current_setting('quills.workspace_id', true), '')) WITH CHECK ("quills"."ai_knowledge_questions"."workspace_id" = nullif(current_setting('quills.workspace_id', true), ''));--> statement-breakpoint
CREATE POLICY "workspace_isolation" ON "quills"."ai_knowledge_sources" AS PERMISSIVE FOR ALL TO public USING ("quills"."ai_knowledge_sources"."workspace_id" = nullif(current_setting('quills.workspace_id', true), '')) WITH CHECK ("quills"."ai_knowledge_sources"."workspace_id" = nullif(current_setting('quills.workspace_id', true), ''));--> statement-breakpoint
CREATE POLICY "workspace_isolation" ON "quills"."ai_knowledge_suggestions" AS PERMISSIVE FOR ALL TO public USING ("quills"."ai_knowledge_suggestions"."workspace_id" = nullif(current_setting('quills.workspace_id', true), '')) WITH CHECK ("quills"."ai_knowledge_suggestions"."workspace_id" = nullif(current_setting('quills.workspace_id', true), ''));
--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_questions" FORCE ROW LEVEL SECURITY;

--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_sources" FORCE ROW LEVEL SECURITY;

--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_suggestions" FORCE ROW LEVEL SECURITY;

--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
