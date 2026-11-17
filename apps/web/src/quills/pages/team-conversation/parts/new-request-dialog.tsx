import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../../core/types";
import { useCreatePostFromConversation } from "../../../hooks/team/use-create-post-from-conversation";
import { useListBoards } from "../../../hooks/team/use-list-boards";
import { useTeamRuntime } from "../../../team/runtime";
import { TeamStateView } from "../../../team/team-state-view";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "../../../ui/upstream";
import { CreatePostForm } from "./create-post-form";

export interface NewRequestDialogProps {
  workspaceId: string;
  conversationId: string;
  customerName: string;
  /** The first title of the request. */
  subject: string | null;
  onClose: () => void;
  onCreated: (title: string) => void;
}

/** Tracks the conversation as a new request by its customer, which is shared into the thread. */
export function NewRequestDialog(props: NewRequestDialogProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const boards = useListBoards(
    {
      param: { workspaceId: props.workspaceId },
      query: { counts: "false", offset: "0", limit: "100" },
    },
    team.viewer,
  );
  const create = useCreatePostFromConversation(team.viewer);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{t("team-conversations.links.newRequest")}</DialogTitle>
          <DialogDescription>
            {t("team-conversations.links.newRequestDescription", {
              name: props.customerName,
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <TeamStateView
            loading={boards.isLoading}
            problem={boards.error ?? null}
            onRetry={() => void boards.refetch()}
          >
            {boards.data ? (
              <CreatePostForm
                boards={boards.data.items}
                defaultTitle={props.subject ?? ""}
                onCancel={props.onClose}
                onSubmit={async (json): Promise<PortalProblem | void> => {
                  try {
                    await create.mutateAsync({
                      param: {
                        workspaceId: props.workspaceId,
                        conversationId: props.conversationId,
                      },
                      json,
                    });
                    props.onCreated(json.title);
                  } catch (error) {
                    return error as PortalProblem;
                  }
                }}
              />
            ) : null}
          </TeamStateView>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
