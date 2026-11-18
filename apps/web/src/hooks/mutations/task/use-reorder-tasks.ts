import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import reorderTasks from "@/fetchers/task/reorder-tasks";
import { invalidateMyWork } from "@/lib/invalidate-my-work";
import { toast } from "@/lib/toast";

/** Moves cards in one request; the server applies every position atomically. */
export function useReorderTasks() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: reorderTasks,
    onError: () => toast.error(t("tasks:board.reorderFailed")),
    onSettled: (_result, _error, variables) => {
      if (variables.tasks.some((task) => task.status !== undefined)) {
        invalidateMyWork(queryClient);
        void queryClient.invalidateQueries({ queryKey: ["projects"] });
      }
      void queryClient.invalidateQueries({
        queryKey: ["tasks", variables.projectId],
      });
      for (const task of variables.tasks)
        void queryClient.invalidateQueries({ queryKey: ["task", task.id] });
    },
  });
}
