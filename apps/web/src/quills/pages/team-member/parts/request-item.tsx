import { ArrowUp, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRowLink } from "../../../ui/inbox/use-row-link";

export interface RequestItemProps {
  post: { title: string; voteCount: number; commentCount: number };
  boardName?: string;
  status?: { name: string; color: string };
  href: string;
  onOpen: () => void;
}

/** One request of a member: the vote pill, the title, the board and status, the comment count. */
export function RequestItem({
  post,
  boardName,
  status,
  href,
  onOpen,
}: RequestItemProps) {
  const { t } = useTranslation("quills");
  const link = useRowLink(onOpen);
  return (
    <a
      {...link}
      href={href}
      className="flex items-center gap-4 rounded-lg px-2 py-3 outline-none hover:bg-accent focus-visible:bg-foreground/6"
    >
      <span
        aria-label={t("team-members.votes", { count: post.voteCount })}
        className="flex h-9 min-w-16 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border text-sm tabular-nums"
      >
        <ArrowUp aria-hidden="true" className="size-4" />
        {post.voteCount}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{post.title}</span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          {boardName ? <span className="truncate">{boardName}</span> : null}
          {status ? (
            <span className="flex shrink-0 items-center gap-1.5">
              <svg
                viewBox="0 0 8 8"
                aria-hidden="true"
                color={status.color}
                className="size-2"
              >
                <circle cx="4" cy="4" r="4" fill="currentColor" />
              </svg>
              {status.name}
            </span>
          ) : null}
        </span>
      </span>
      <span
        aria-label={t("team-members.comments", { count: post.commentCount })}
        className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground tabular-nums"
      >
        <MessageSquare aria-hidden="true" className="size-4" />
        {post.commentCount}
      </span>
    </a>
  );
}
