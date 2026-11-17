import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ListBoardsResponse } from "../../api/team/list-boards";
import type { ListStatusesResponse } from "../../api/team/list-statuses";
import { useCreatePost } from "../../hooks/team/use-create-post";
import { useListTags } from "../../hooks/team/use-list-tags";
import { useTeamRuntime } from "../runtime";
import { IconButton } from "../../ui/inbox/icon-button";
import {
  Dialog,
  DialogClose,
  DialogPopup,
  DialogTitle,
} from "../../ui/upstream";
import { AuthorPicker, type RequestAuthor } from "./author-picker";
import { NewRequestForm } from "./new-request-form";
import { SourceSelect } from "./source-select";
import type { Source } from "./sources";

export interface NewRequestDialogProps {
  workspaceId: string;
  boards: ListBoardsResponse["items"];
  statuses: ListStatusesResponse["statuses"];
  /** The board of the list filter. */
  boardId?: string;
  /** The first status, such as the column of a roadmap. Without it, the default status. */
  defaultStatusId?: string;
  onClose: () => void;
  /** Opens the new request. */
  onCreated: (postId: string) => void;
}

/** The New request modal of the Requests page (`new=true`) and of the roadmap columns. */
export function NewRequestDialog(props: NewRequestDialogProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [author, setAuthor] = useState<RequestAuthor | null>(null);
  const [source, setSource] = useState<Source>("other");
  // ponytail: the first 100 tags (the API maximum); page them when a workspace has more.
  const tags = useListTags(
    { param: { workspaceId: props.workspaceId }, query: { limit: "100" } },
    team.viewer,
  );
  const create = useCreatePost(team.viewer);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogPopup
        showCloseButton={false}
        className="overflow-hidden sm:max-w-2xl"
      >
        <DialogTitle className="sr-only">
          {t("team-posts.newRequest")}
        </DialogTitle>
        <NewRequestForm
          boards={props.boards}
          statuses={props.statuses}
          tags={tags.data?.tags ?? []}
          boardId={props.boardId}
          defaultStatusId={props.defaultStatusId}
          author={
            <>
              <AuthorPicker
                workspaceId={props.workspaceId}
                value={author}
                onChange={setAuthor}
              />
              {author ? (
                <SourceSelect value={source} onChange={setSource} />
              ) : null}
            </>
          }
          onSubmit={async ({ statusId, ...values }) => {
            const post = await create.mutateAsync({
              param: { workspaceId: props.workspaceId },
              json: {
                ...values,
                // A status that a teammate deleted while the dialog was open gets the default.
                ...(props.statuses.some((status) => status.id === statusId)
                  ? { statusId }
                  : {}),
                ...(author
                  ? { authorPrincipalId: author.principalId, source }
                  : {}),
              },
            });
            props.onCreated(post.id);
          }}
        />
        <DialogClose
          render={
            <IconButton
              label={t("team-posts.close")}
              className="absolute end-3 top-3 rounded-full before:rounded-full"
            />
          }
        >
          <X aria-hidden="true" />
        </DialogClose>
      </DialogPopup>
    </Dialog>
  );
}
