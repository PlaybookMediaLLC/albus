import {
  getBoardCacheVersion,
  markBoardCacheChanged,
} from "@/lib/board-cache-version";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateMyWork } from "@/lib/invalidate-my-work";
import updateTask from "@/fetchers/task/update-task";
import { updateBoardTaskCache } from "@/lib/update-board-task-cache";
import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: Task) => updateTask(task.id, task),
    onMutate: (task: Task) => {
      const board = queryClient.getQueryData<ProjectWithTasks>([
        "tasks",
        task.projectId,
      ]);
      const previous = board
        ? [
            ...board.columns.flatMap((column) => column.tasks),
            ...board.plannedTasks,
            ...board.archivedTasks,
          ].find((cached) => cached.id === task.id)
        : undefined;
      markBoardCacheChanged(queryClient, task.projectId, task.id);
      return {
        version: getBoardCacheVersion(queryClient, task.projectId, task.id),
        previousStatus: previous?.status,
      };
    },
    onSuccess: (updated, variables, context) => {
      invalidateMyWork(queryClient);
      queryClient.invalidateQueries({
        queryKey: ["task", variables.id],
      });
      // A status change can move parents' subtask counts and relations, so it
      // reloads the board; other edits patch the card with the saved task.
      if (
        context?.previousStatus === undefined ||
        updated.status !== context.previousStatus
      ) {
        queryClient.invalidateQueries({
          queryKey: ["tasks", variables.projectId],
        });
      } else {
        updateBoardTaskCache(
          queryClient,
          variables.projectId,
          variables.id,
          {
            title: updated.title,
            ...(updated.descriptionDeferred
              ? {}
              : { description: updated.description }),
            status: updated.status,
            priority: updated.priority,
            startDate: updated.startDate,
            dueDate: updated.dueDate,
            position: updated.position,
            userId: updated.userId,
            assigneeId: updated.userId,
          },
          context.version,
        );
      }
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      });
      queryClient.invalidateQueries({
        queryKey: ["activities", variables.id],
      });
    },
  });
}
