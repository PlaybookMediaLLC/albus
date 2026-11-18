DROP INDEX "notification_userId_idx";--> statement-breakpoint
DROP INDEX "task_projectId_idx";--> statement-breakpoint
CREATE INDEX "notification_user_created_idx" ON "notification" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "task_project_position_idx" ON "task" USING btree ("project_id","position","id");