ALTER TABLE "quills"."ai_knowledge_sources" ALTER COLUMN "conversation_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_sources" ADD COLUMN "document_id" uuid;--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_sources" ADD CONSTRAINT "ai_knowledge_sources_workspace_id_document_id_assistant_documents_workspace_id_id_fk" FOREIGN KEY ("workspace_id","document_id") REFERENCES "quills"."assistant_documents"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_knowledge_sources_document_idx" ON "quills"."ai_knowledge_sources" USING btree ("document_id");--> statement-breakpoint
ALTER TABLE "quills"."ai_knowledge_sources" ADD CONSTRAINT "ai_knowledge_sources_origin_check" CHECK (num_nonnulls("quills"."ai_knowledge_sources"."conversation_id", "quills"."ai_knowledge_sources"."document_id") = 1);
--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
