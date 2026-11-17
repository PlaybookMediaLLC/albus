import createComment from "../../activity/controllers/create-comment";
import createTask from "../../task/controllers/create-task";
import deleteTask from "../../task/controllers/delete-task";

// The only module through which Quills writes Kaneo records (RFC 0005, section 1.1). Each function calls
// Kaneo's own exported controller as the acting teammate, so Kaneo keeps its numbers, positions, events and
// notifications. The caller checks the teammate's permissions first (platform-reads#taskTarget); these
// controllers check no permission themselves. A changed controller signature fails the typecheck here.

/** Creates a Kaneo task as `userId` in the column `status` (a slug that taskTarget returned). */
export async function createKaneoTask(input: {
  userId: string;
  projectId: string;
  status: string;
  title: string;
  description: string;
  priority: string;
  assigneeId?: string;
  dueDate?: Date;
}) {
  const task = await createTask({
    projectId: input.projectId,
    currentUserId: input.userId,
    userId: input.assigneeId,
    title: input.title,
    status: input.status,
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate,
  });
  return { id: task.id, projectId: task.projectId };
}

/** Adds a comment to a Kaneo task as `userId`. */
export async function commentOnKaneoTask(
  taskId: string,
  userId: string,
  content: string,
) {
  await createComment(taskId, userId, content);
}

/**
 * Deletes a task that this request created as `userId`, when the request's own link write failed. Quills
 * never deletes other Kaneo work (RFC 0005, decision 3).
 */
export async function deleteKaneoTask(taskId: string, userId: string) {
  await deleteTask(taskId, userId);
}
