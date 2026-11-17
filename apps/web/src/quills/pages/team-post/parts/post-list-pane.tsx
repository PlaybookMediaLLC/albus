import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ListBoardsResponse } from "../../../api/team/list-boards";
import type { ListStatusesResponse } from "../../../api/team/list-statuses";
import type { PortalProblem } from "../../../core/types";
import type { useListPosts } from "../../../hooks/team/use-list-posts";
import { ListPane } from "../../../ui/inbox/list-pane";
import { PostStatusIcon } from "../../../ui/inbox/post-status-icon";
import { RequestRow } from "../../../ui/inbox/request-row";
import { teamHref } from "../../../team/team-href";
import { Button } from "../../../ui/upstream";
import {
  postRow,
  rowContext,
  statusIcon,
  type ListedPost,
} from "../../team-posts/post-list";
import {
  type PostSearch,
  requestListTitle,
} from "../../team-posts/post-search";
import { useRequestFilters } from "../../team-posts/use-request-filters";
import { useRequestQuery } from "../../team-posts/use-request-query";

export interface PostListPaneProps {
  workspaceId: string;
  /** The posts of the request list, in its order. */
  posts: readonly ListedPost[];
  statuses: ListStatusesResponse["statuses"];
  boards: ListBoardsResponse["items"];
  /** The list filters of the address, which the filter menu and the search change. */
  search: PostSearch;
  onSearch: (patch: Partial<PostSearch>) => void;
  activeId: string;
  /** The address of a post, with the list filters. */
  href: (postId: string) => string;
  onOpen: (postId: string) => void;
  loading: boolean;
  /** A list failure. It shows in this pane; the open request stays. */
  problem?: PortalProblem | null;
  onRetry?: () => void;
  /** The posts query, for Load more. */
  more?: Pick<
    ReturnType<typeof useListPosts>,
    "hasNextPage" | "isFetchingNextPage" | "fetchNextPage"
  >;
}

/** The list pane beside an open request: filters, search, compact request cards and Load more. */
export function PostListPane({
  search,
  onSearch,
  ...props
}: PostListPaneProps) {
  const { t } = useTranslation("quills");
  const [query, setQuery] = useRequestQuery(search.q, (q) => onSearch({ q }));
  const context = rowContext(props.statuses, props.boards, t);
  const menu = useRequestFilters({
    workspaceId: props.workspaceId,
    search,
    statuses: props.statuses,
    boards: props.boards,
    onSearch,
  });
  return (
    <>
      {menu.dialog}
      <ListPane
        title={requestListTitle(search, props.statuses, t)}
        headingLevel={2}
        filters={menu.filters}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            render={<Link to={teamHref(props.workspaceId, "/triage")} />}
          >
            <Zap aria-hidden="true" />
            {t("team-posts.triage")}
          </Button>
        }
        search={{
          label: t("team-posts.search"),
          value: query,
          onChange: setQuery,
        }}
        loading={props.loading}
        problem={props.problem}
        onRetry={props.onRetry}
        empty={!props.posts.length}
      >
        <ul className="grid grid-cols-1 gap-0.5">
          {props.posts.map((post) => (
            <li key={post.id}>
              <RequestRow
                {...postRow(post, context)}
                icon={<PostStatusIcon {...statusIcon(post, props.statuses)} />}
                compact
                href={props.href(post.id)}
                onOpen={() => props.onOpen(post.id)}
                selected={post.id === props.activeId}
              />
            </li>
          ))}
        </ul>
        {props.more?.hasNextPage ? (
          <div className="p-2">
            <Button
              variant="outline"
              className="w-full"
              loading={props.more.isFetchingNextPage}
              onClick={() => void props.more?.fetchNextPage()}
            >
              {t("team-posts.loadMore")}
            </Button>
          </div>
        ) : null}
      </ListPane>
    </>
  );
}
