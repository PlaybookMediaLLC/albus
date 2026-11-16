import type { ListBoardsResponse } from "../../../api/team/list-boards";
import type { ListStatusesResponse } from "../../../api/team/list-statuses";
import { useListPostViews } from "../../../hooks/team/use-list-post-views";
import { useListTags } from "../../../hooks/team/use-list-tags";
import { useTeamRuntime } from "../../../team/runtime";
import { BoardDot } from "../../../ui/inbox/board-dot";
import { PostStatusIcon } from "../../../ui/inbox/post-status-icon";
import { RequestFilters } from "../../../ui/inbox/request-filters";
import { statusIcon } from "../post-list";
import {
  checkedStatuses,
  clearedFilters,
  facetPatch,
  type PostSearch,
  splitIds,
  viewSearch,
} from "../post-search";

export interface RequestFilterMenuProps {
  workspaceId: string;
  search: PostSearch;
  statuses: ListStatusesResponse["statuses"];
  boards: ListBoardsResponse["items"];
  onSearch: (patch: Partial<PostSearch>) => void;
  /** Offers the deleted requests, which only the requests list can show. */
  withDeleted?: boolean;
  /** Opens the Save as view dialog. */
  onSaveView?: () => void;
}

/**
 * The items of the request filter menu. The menu renders them only while it is open, so the
 * tags and the saved views load when a teammate opens it.
 */
export function RequestFilterMenu(props: RequestFilterMenuProps) {
  const team = useTeamRuntime();
  const param = { workspaceId: props.workspaceId };
  // ponytail: the first 100 tags and views (the API maximum); page them when a workspace has more.
  const tags = useListTags({ param, query: { limit: "100" } }, team.viewer);
  const views = useListPostViews(
    { param, query: { offset: "0", limit: "100" } },
    team.viewer,
  );
  const { search, statuses, boards, onSearch } = props;
  const ordered = [...statuses].sort((a, b) => a.position - b.position);
  const totals = {
    board: boards.length,
    status: statuses.length,
    tags: tags.data?.tags.length ?? 0,
  };
  return (
    <RequestFilters
      boards={boards.map((board) => ({
        id: board.id,
        label: board.name,
        icon: <BoardDot boardId={board.id} />,
      }))}
      statuses={ordered.map((status) => ({
        id: status.id,
        label: status.name,
        icon: (
          <PostStatusIcon {...statusIcon({ statusId: status.id }, ordered)} />
        ),
      }))}
      tags={(tags.data?.tags ?? []).map((tag) => ({
        id: tag.id,
        label: tag.name,
      }))}
      checked={{
        // No board filter is every board, as no status filter is every status of the tab.
        board: search.board
          ? splitIds(search.board)
          : boards.map((board) => board.id),
        status: checkedStatuses(search, statuses),
        tags: splitIds(search.tags),
      }}
      sort={search.sort ?? "newest"}
      onFacet={(key, ids) =>
        onSearch(facetPatch(search, key, ids, totals[key]))
      }
      onSort={(sort) =>
        onSearch({
          sort: sort === "newest" ? undefined : (sort as PostSearch["sort"]),
        })
      }
      deleted={props.withDeleted ? search.status === "deleted" : undefined}
      onDeleted={(on) => onSearch({ status: on ? "deleted" : undefined })}
      views={views.data?.views}
      onView={(id) => {
        const view = views.data?.views.find((item) => item.id === id);
        if (view) onSearch(viewSearch(view.filters));
      }}
      onSaveView={props.onSaveView}
      onClear={() => onSearch(clearedFilters)}
    />
  );
}
