import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import type { ListBoardsResponse } from "../../../api/team/list-boards";
import { shortDate } from "../../../core/short-date";
import { MarkdownContent } from "../../../ui/markdown-content";
import { PersonAvatar } from "../../../ui/person-avatar";
import { PostChips } from "./post-chips";
import { PostVotes } from "./post-votes";

export interface PostBodyProps {
  workspaceId: string;
  post: GetPostResponse;
  boards: ListBoardsResponse["items"];
}

/** The author line with the votes, the rendered text and the chip row of a request, under its title. */
export function PostBody({ workspaceId, post, boards }: PostBodyProps) {
  const { t, i18n } = useTranslation("quills");
  const author = post.authorName ?? t("team-post.anonymous");
  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <PersonAvatar colored name={author} className="size-6" />
        <span className="font-medium text-foreground">{author}</span>
        <time dateTime={post.createdAt}>
          {shortDate(post.createdAt, i18n.language)}
        </time>
        <PostVotes workspaceId={workspaceId} post={post} />
      </div>
      <MarkdownContent customer content={post.content} />
      <PostChips workspaceId={workspaceId} post={post} boards={boards} />
    </div>
  );
}
