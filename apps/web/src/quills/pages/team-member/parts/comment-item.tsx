import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { plainText } from "../../../core/plain-text";
import { shortDate } from "../../../core/short-date";
import { useRowLink } from "../../../ui/inbox/use-row-link";

export interface CommentItemProps {
  comment: {
    content: string;
    postTitle: string;
    reactionCount: number;
    createdAt: string;
  };
  href: string;
  onOpen: () => void;
}

/** One comment of a member: the reactions, the text as one plain line, the post and the date. */
export function CommentItem({ comment, href, onOpen }: CommentItemProps) {
  const { t, i18n } = useTranslation("quills");
  const link = useRowLink(onOpen);
  return (
    <a
      {...link}
      href={href}
      className="flex items-center gap-4 rounded-lg px-2 py-3 outline-none hover:bg-accent focus-visible:bg-foreground/6"
    >
      <span
        aria-label={t("team-members.reactions", {
          count: comment.reactionCount,
        })}
        className="flex h-9 min-w-16 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border text-sm tabular-nums"
      >
        <Heart aria-hidden="true" className="size-4" />
        {comment.reactionCount}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{plainText(comment.content)}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {comment.postTitle}
        </span>
      </span>
      <time
        dateTime={comment.createdAt}
        className="shrink-0 text-sm text-muted-foreground"
      >
        {shortDate(comment.createdAt, i18n.language)}
      </time>
    </a>
  );
}
