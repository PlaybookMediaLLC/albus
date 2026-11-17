import { useTranslation } from "react-i18next";
import type { Viewer } from "../../../core/types";
import { useCreatePortalPost } from "../../../hooks/feedback/use-create-portal-post";
import { useConfirmFeedbackCard } from "../../../hooks/support/use-confirm-feedback-card";
import { Button } from "../../../ui/upstream";

export interface FeedbackCardActionProps {
  workspaceId: string;
  conversationId: string;
  messageId: string;
  card: { title: string; body: string; status: "proposed" | "confirmed" };
  viewer: Viewer;
}

/** The request the assistant proposed in a reply: the customer posts it once. */
export function FeedbackCardAction(props: FeedbackCardActionProps) {
  const { t } = useTranslation("quills");
  const create = useCreatePortalPost(props.viewer);
  const confirm = useConfirmFeedbackCard(props.viewer);
  const pending = create.isPending || confirm.isPending;
  const submit = async () => {
    // The message ID keys the post, so a retry after a failed confirm posts it once.
    const post = await create.mutateAsync({
      param: { workspace: props.workspaceId },
      json: {
        title: props.card.title,
        content: props.card.body || props.card.title,
        idempotencyKey: `card:${props.messageId}`,
      },
    });
    await confirm.mutateAsync({
      param: {
        workspace: props.workspaceId,
        conversationId: props.conversationId,
        messageId: props.messageId,
      },
      json: { postId: post.id },
    });
  };
  return (
    <div className="mt-2 grid gap-1 rounded-md border p-3">
      <p className="font-medium">{props.card.title}</p>
      {props.card.body ? <p className="text-sm">{props.card.body}</p> : null}
      {props.card.status === "confirmed" ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("conversation.requestSubmitted")}
        </p>
      ) : (
        <Button
          type="button"
          size="sm"
          className="justify-self-start"
          loading={pending}
          onClick={() => void submit().catch(() => {})}
        >
          {t("conversation.submitRequest")}
        </Button>
      )}
      {create.error || confirm.error ? (
        <p role="alert" className="text-sm text-destructive">
          {t("conversation.requestFailed")}
        </p>
      ) : null}
    </div>
  );
}
