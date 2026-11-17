import { Link } from "@tanstack/react-router";
import { Link2, Plus, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetLinkedPostsForConversation } from "../../../hooks/team/use-get-linked-posts-for-conversation";
import { useUnlinkPostFromConversation } from "../../../hooks/team/use-unlink-post-from-conversation";
import { useTeamRuntime } from "../../../team/runtime";
import { teamHref } from "../../../team/team-href";
import { IconButton } from "../../../ui/inbox/icon-button";
import { PropertyRow } from "../../../ui/inbox/property-row";
import { Button } from "../../../ui/upstream";
import { ActionProblem } from "./action-problem";
import { LinkRequestPalette } from "./link-request-palette";
import { NewRequestDialog } from "./new-request-dialog";

export interface LinkedRequestsProps {
  workspaceId: string;
  conversationId: string;
  customerName: string;
  subject: string | null;
}

const link = "min-w-0 truncate text-primary underline-offset-4 hover:underline";

/**
 * The requests tracked from this conversation. A teammate tracks it as a new request, adds the
 * customer's vote to an existing one, or unlinks one: the post and the vote stay.
 */
export function LinkedRequests(props: LinkedRequestsProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  // Tracking records the visitor's request or vote, which needs create and update (#73).
  const canTrack = team.permissions.create && team.permissions.update;
  const { workspaceId, conversationId } = props;
  const posts = useGetLinkedPostsForConversation(
    { param: { workspaceId, conversationId } },
    team.viewer,
  );
  const unlink = useUnlinkPostFromConversation(team.viewer);
  const [open, setOpen] = useState<"new" | "link" | null>(null);
  const [notice, setNotice] = useState("");
  const items = posts.data?.items ?? [];
  return (
    <PropertyRow label={t("team-conversations.links.posts")}>
      <div className="grid w-full gap-1">
        {items.length ? (
          <ul className="grid gap-0.5">
            {items.map((post) => (
              <li key={post.postId} className="flex min-h-7 items-center gap-1">
                <Link
                  to={teamHref(workspaceId, `/posts/${post.postId}`)}
                  className={link}
                >
                  {post.title}
                </Link>
                {team.permissions.update ? (
                  <IconButton
                    size="icon-xs"
                    className="ms-auto"
                    label={t("team-conversations.links.unlink", {
                      title: post.title,
                    })}
                    disabled={unlink.isPending}
                    onClick={() =>
                      unlink.mutate(
                        {
                          param: {
                            workspaceId,
                            conversationId,
                            postId: post.postId,
                          },
                        },
                        {
                          onSuccess: () =>
                            setNotice(
                              t("team-conversations.links.unlinked", {
                                title: post.title,
                              }),
                            ),
                        },
                      )
                    }
                  >
                    <X aria-hidden="true" />
                  </IconButton>
                ) : null}
              </li>
            ))}
          </ul>
        ) : canTrack ? null : (
          <span className="text-muted-foreground">
            {t("team-conversations.links.none")}
          </span>
        )}
        {canTrack ? (
          <div className="-ms-2 flex flex-wrap gap-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setNotice("");
                setOpen("new");
              }}
            >
              <Plus aria-hidden="true" />
              {t("team-conversations.links.newRequest")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setNotice("");
                setOpen("link");
              }}
            >
              <Link2 aria-hidden="true" />
              {t("team-conversations.links.linkRequest")}
            </Button>
          </div>
        ) : null}
        <p role="status" className="text-xs text-muted-foreground">
          {notice}
        </p>
        <ActionProblem problem={unlink.error ?? null} />
      </div>
      {open === "new" ? (
        <NewRequestDialog
          workspaceId={workspaceId}
          conversationId={conversationId}
          customerName={props.customerName}
          subject={props.subject}
          onClose={() => setOpen(null)}
          onCreated={(title) => {
            setOpen(null);
            setNotice(t("team-conversations.links.created", { title }));
          }}
        />
      ) : null}
      {open === "link" ? (
        <LinkRequestPalette
          workspaceId={workspaceId}
          conversationId={conversationId}
          customerName={props.customerName}
          linkedIds={items.map((post) => post.postId)}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </PropertyRow>
  );
}
