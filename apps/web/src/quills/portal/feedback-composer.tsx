import type { ComponentProps } from "react";
import { toFieldValues } from "../core/composer-fields";
import { useFeedbackAttachments } from "../core/use-feedback-attachments";
import { useCreatePortalPost } from "../hooks/feedback/use-create-portal-post";
import { AttachmentPicker } from "../ui/attachment-picker";
import { PostComposer } from "../ui/post/post-composer";
import { ImproveDraft } from "./improve-draft";
import { usePortalRuntime } from "./runtime";
import { usePortalSignInHref } from "./use-portal-sign-in-href";

export interface FeedbackComposerProps extends Omit<
  ComponentProps<typeof PostComposer>,
  "workspaceName" | "attachments" | "onSubmit"
> {
  workspaceId: string;
  /** For a signed-out viewer: the portal page to return to after sign-in, by the portal's mode. */
  signInReturn?: { path: string; search?: Record<string, string | undefined> };
}

/** The inline composer that uploads chosen files, then creates the post. */
export function FeedbackComposer({
  workspaceId,
  signInReturn,
  ...props
}: FeedbackComposerProps) {
  const portal = usePortalRuntime();
  const signIn = usePortalSignInHref(workspaceId);
  const create = useCreatePortalPost(portal.viewer);
  const files = useFeedbackAttachments(workspaceId, portal.viewer);
  return (
    <PostComposer
      {...props}
      {...(signInReturn &&
        portal.viewer.kind !== "user" && {
          signInHref:
            signIn(signInReturn.path, signInReturn.search) ?? undefined,
        })}
      workspaceName={portal.config.name}
      draftKey={`quills-feedback-draft:${workspaceId}:${portal.viewer.kind === "user" ? portal.viewer.id : "visitor"}`}
      attachments={(submitting) => (
        <AttachmentPicker
          attachments={files.attachments}
          files={files.files}
          disabled={submitting}
          onFilesChange={files.setFiles}
          onRemove={files.remove}
          onRemoveFile={files.removeFile}
        />
      )}
      // AI help shows only when the instance has an AI provider.
      assist={
        portal.config.features.ai
          ? (draft, apply) => (
              <ImproveDraft
                workspaceId={workspaceId}
                viewer={portal.viewer}
                boards={props.boards}
                draft={draft}
                onApply={apply}
                onPreviewTitle={props.onTitleChange}
              />
            )
          : undefined
      }
      onSubmit={async (values) => {
        // A failed upload throws, so PortalForm offers a retry.
        const attachmentIds = await files.upload();
        const { customFields: raw, ...post } = values;
        const customFields = toFieldValues(
          props.boards.find((board) => board.id === values.boardId)?.fields ??
            [],
          raw,
        );
        try {
          await create.mutateAsync({
            param: { workspace: workspaceId },
            json: {
              ...post,
              ...(Object.keys(customFields).length && { customFields }),
              idempotencyKey: files.idempotencyKey,
              attachmentIds,
            },
          });
          files.reset();
        } catch (problem) {
          return problem as never;
        }
      }}
    />
  );
}
