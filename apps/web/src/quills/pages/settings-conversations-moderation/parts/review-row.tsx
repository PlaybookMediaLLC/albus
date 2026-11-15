import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { plainText } from "../../../core/plain-text";
import { useApproveComment } from "../../../hooks/team/use-approve-comment";
import { useApprovePost } from "../../../hooks/team/use-approve-post";
import { useRejectComment } from "../../../hooks/team/use-reject-comment";
import { useRejectPost } from "../../../hooks/team/use-reject-post";
import { teamHref } from "../../../team/team-href";
import { useTeamRuntime } from "../../../team/runtime";
import {
  Button,
  ConfirmDialog,
  SettingsRow,
  toast,
} from "../../../ui/upstream";

export interface ReviewRowProps {
  workspaceId: string;
  kind: "post" | "comment";
  id: string;
  /** The post of the item: the post itself, or the post of a comment. */
  postId: string;
  title: string;
  content: string;
  /** The board and the author, as one muted line. */
  detail: string;
}

/** A post or a comment that waits for review, with Approve and Reject. */
export function ReviewRow(props: ReviewRowProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const approvePost = useApprovePost(team.viewer);
  const rejectPost = useRejectPost(team.viewer);
  const approveComment = useApproveComment(team.viewer);
  const rejectComment = useRejectComment(team.viewer);
  const [rejecting, setRejecting] = useState(false);
  const [pending, setPending] = useState(false);
  const post = props.kind === "post";
  const run = async (approve: boolean) => {
    const { workspaceId, id } = props;
    setPending(true);
    try {
      if (post && approve)
        await approvePost.mutateAsync({ param: { workspaceId, postId: id } });
      else if (post)
        await rejectPost.mutateAsync({
          param: { workspaceId, postId: id },
          json: { reason: "" },
        });
      else if (approve)
        await approveComment.mutateAsync({
          param: { workspaceId, commentId: id },
        });
      else
        await rejectComment.mutateAsync({
          param: { workspaceId, commentId: id },
          json: { reason: "" },
        });
      setRejecting(false);
    } catch {
      toast.error(t("settings-conversations.moderation.reviewFailed"));
    } finally {
      setPending(false);
    }
  };
  return (
    <SettingsRow
      stack
      title={
        <Link
          to={teamHref(props.workspaceId, `/posts/${props.postId}`)}
          className="hover:underline"
        >
          {props.title}
        </Link>
      }
      description={
        <>
          <span className="line-clamp-2 text-foreground">
            {plainText(props.content)}
          </span>
          <span>{props.detail}</span>
        </>
      }
    >
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => setRejecting(true)}
      >
        {t("settings-conversations.moderation.reject")}
      </Button>
      <Button size="sm" loading={pending} onClick={() => void run(true)}>
        {t("settings-conversations.moderation.approve")}
      </Button>
      <ConfirmDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title={t(
          post
            ? "settings-conversations.moderation.rejectPost"
            : "settings-conversations.moderation.rejectComment",
        )}
        description={t("settings-conversations.moderation.rejectText")}
        confirmLabel={t("settings-conversations.moderation.reject")}
        pending={pending}
        onConfirm={() => void run(false)}
      />
    </SettingsRow>
  );
}
