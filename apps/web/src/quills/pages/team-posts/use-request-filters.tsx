import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../core/types";
import { useCreatePostView } from "../../hooks/team/use-create-post-view";
import { useTeamRuntime } from "../../team/runtime";
import { NameDialog } from "../../ui/name-dialog";
import { toast } from "../../ui/upstream";
import {
  RequestFilterMenu,
  type RequestFilterMenuProps,
} from "./parts/request-filter-menu";
import { viewFilters } from "./post-search";

/** The filter menu items of a request list, and the Save as view dialog that the menu opens. */
export function useRequestFilters(
  input: Omit<RequestFilterMenuProps, "onSaveView">,
) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [saving, setSaving] = useState(false);
  const create = useCreatePostView(team.viewer);
  const filters = (
    <RequestFilterMenu
      {...input}
      onSaveView={team.permissions.create ? () => setSaving(true) : undefined}
    />
  );
  const dialog = (
    <NameDialog
      open={saving}
      onOpenChange={setSaving}
      title={t("team-posts.saveViewTitle")}
      description={t("team-posts.saveViewText")}
      label={t("team-posts.viewName")}
      maxLength={80}
      submitKey="team-posts.saveViewSubmit"
      onSubmit={async (name): Promise<PortalProblem | void> => {
        try {
          await create.mutateAsync({
            param: { workspaceId: input.workspaceId },
            json: { name, filters: viewFilters(input.search, input.statuses) },
          });
          setSaving(false);
          toast.success(t("team-posts.viewSaved", { name }));
        } catch (error) {
          return error as PortalProblem;
        }
      }}
    />
  );
  return { filters, dialog };
}
