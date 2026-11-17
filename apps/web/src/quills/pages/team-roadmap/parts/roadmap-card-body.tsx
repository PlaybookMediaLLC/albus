import { Link } from "@tanstack/react-router";
import { ArrowUp, Ellipsis, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { plainText } from "../../../core/plain-text";
import { teamHref } from "../../../team/team-href";
import { IconButton } from "../../../ui/inbox/icon-button";
import {
  cn,
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "../../../ui/upstream";
import type { RoadmapPost } from "../roadmap-moves";

export interface RoadmapCardBodyProps {
  workspaceId: string;
  post: RoadmapPost;
  /** The status of the column that shows the card. */
  statusId: string;
  /** The board name. */
  board: string | null;
  statuses: readonly { id: string; name: string }[];
  /** The drag activator: Space on the title link starts a keyboard drag. */
  activatorRef?: (element: HTMLElement | null) => void;
  /** The copy that follows the pointer during a drag: no link and no menu. */
  preview?: boolean;
  /** The drag instructions for screen readers, when the card can move. */
  describedBy?: string;
  /** Moves the card; `byMenu` is true for the Move to menu. Left out without the update permission. */
  onMove?: (post: RoadmapPost, statusId: string, byMenu?: boolean) => void;
  /** Opens the Create task or Link existing task dialog (RFC 0005). Left out without the update permission. */
  onTask?: (post: RoadmapPost, kind: "create" | "link") => void;
}

/**
 * The content of a roadmap card: the title link, the excerpt, the board, the counts and the
 * Move to menu. RoadmapCard memoizes it, so a drag over the board does not render it again.
 */
export function RoadmapCardBody({
  workspaceId,
  post,
  statusId,
  onMove,
  onTask,
  ...props
}: RoadmapCardBodyProps) {
  const { t } = useTranslation("quills");
  const title = plainText(post.title);
  const excerpt = plainText(post.content);
  const count = (key: string, value: number, icon: ReactNode) => (
    <span className="inline-flex shrink-0 items-center gap-1">
      {icon}
      <span aria-hidden="true">{value}</span>
      <span className="sr-only">{t(key, { count: value })}</span>
    </span>
  );
  return (
    <>
      <h3
        className={cn(
          "line-clamp-2 text-sm font-semibold leading-snug",
          onMove && !props.preview && "pe-6",
        )}
      >
        {props.preview ? (
          title
        ) : (
          <Link
            ref={props.activatorRef}
            to={teamHref(workspaceId, `/posts/${post.id}`)}
            aria-describedby={props.describedBy}
            className="outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {title}
          </Link>
        )}
      </h3>
      {excerpt ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {excerpt}
        </p>
      ) : null}
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {props.board ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full bg-current"
            />
            <span className="truncate">{props.board}</span>
          </span>
        ) : null}
        <span className="ms-auto flex items-center gap-3">
          {count(
            "inbox.votes",
            post.voteCount,
            <ArrowUp aria-hidden="true" className="size-3.5" />,
          )}
          {count(
            "inbox.comments",
            post.commentCount,
            <MessageCircle aria-hidden="true" className="size-3.5" />,
          )}
        </span>
      </div>
      {onMove && !props.preview ? (
        <Menu>
          <MenuTrigger
            render={
              <IconButton
                label={t("team-roadmap.move", { title })}
                className="absolute end-1.5 top-1.5 z-10 opacity-0 focus-visible:opacity-100 group-hover:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100"
              />
            }
          >
            <Ellipsis aria-hidden="true" />
          </MenuTrigger>
          <MenuPopup align="end">
            <MenuGroup>
              <MenuGroupLabel>{t("team-roadmap.moveTo")}</MenuGroupLabel>
              <MenuRadioGroup
                value={statusId}
                onValueChange={(value) => onMove(post, String(value), true)}
              >
                {props.statuses.map((status) => (
                  <MenuRadioItem key={status.id} value={status.id}>
                    {status.name}
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuGroup>
            {onTask ? (
              <>
                <MenuSeparator />
                <MenuItem onClick={() => onTask(post, "create")}>
                  {t("team-post.createTask")}
                </MenuItem>
                <MenuItem onClick={() => onTask(post, "link")}>
                  {t("team-post.linkTask")}
                </MenuItem>
              </>
            ) : null}
          </MenuPopup>
        </Menu>
      ) : null}
    </>
  );
}
