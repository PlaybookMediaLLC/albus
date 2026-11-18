import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { useBulkOperations } from "./use-bulk-operations";

/**
 * Archives a column's tasks in one atomic request. The column is cleared
 * optimistically, so a failure refetches the boards to restore it.
 */
export function useArchiveColumnTasks() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { bulkArchive } = useBulkOperations();
  return (taskIds: string[]) =>
    void bulkArchive(taskIds).catch(() => {
      toast.error(t("tasks:bulk.archiveError"));
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    });
}
