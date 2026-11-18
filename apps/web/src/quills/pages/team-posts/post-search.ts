import { z } from "zod";
import type { ListPostsRequest } from "../../api/team/list-posts";
import type { ListStatusesResponse } from "../../api/team/list-statuses";
import type { CreatePostViewRequest } from "../../api/team/create-post-view";
import type { ListPostViewsResponse } from "../../api/team/list-post-views";
import type { RequestFacet } from "../../ui/inbox/request-filters";

/** The IDs of a comma-separated address value. */
export const splitIds = (value: string | undefined) =>
  value ? value.split(",").filter(Boolean) : [];

// The API takes at most 50 IDs in a list filter.
const ids = z
  .string()
  .max(2000)
  .refine((value) => splitIds(value).length <= 50)
  .optional()
  .catch(undefined);

/** The sorts of the filter menu, in menu order. "votes" is Top. */
export const SORTS = [
  "newest",
  "oldest",
  "votes",
  "trending",
  "stale",
  "rice",
] as const;

/** The inbox filters in the address. The post view keeps them, so Back and J/K use the same list. */
export const postSearch = z.object({
  status: z
    .enum(["active", "complete", "closed", "all", "deleted"])
    .optional()
    .catch(undefined),
  /** Comma-separated board IDs. */
  board: ids,
  /** Comma-separated status IDs, as the filter menu or the sidebar picks them. They replace the status tab. */
  statusId: ids,
  /** Comma-separated tag IDs. */
  tags: ids,
  q: z.string().max(200).optional().catch(undefined),
  sort: z.enum(SORTS).optional().catch(undefined),
  /** Opens the New request modal, as the sidebar's New request button does. */
  new: z.boolean().optional().catch(undefined),
});
export type PostSearch = z.infer<typeof postSearch>;
export type PostTab = NonNullable<PostSearch["status"]>;

/** A search, a filter or a tab other than Active narrows the request list. */
export const isFiltered = ({ q, board, statusId, tags, status }: PostSearch) =>
  Boolean(q || board || statusId || tags || (status && status !== "active"));

/** The search patch that clears every filter and returns to the Active tab. */
export const noFilters = {
  q: undefined,
  board: undefined,
  statusId: undefined,
  tags: undefined,
  status: undefined,
} satisfies Partial<PostSearch>;

type Status = ListStatusesResponse["statuses"][number];

const titles = {
  active: "team-posts.title",
  complete: "team-posts.complete",
  closed: "team-posts.closed",
  all: "team.nav.allRequests",
  deleted: "team-posts.deleted",
} as const;

/** The title of a request list: the name of the one chosen status, else the name of the tab. */
export function requestListTitle(
  search: PostSearch,
  statuses: readonly Status[],
  t: (key: string) => string,
) {
  const [only, ...others] = splitIds(search.statusId);
  return (
    (others.length
      ? undefined
      : statuses.find((status) => status.id === only)?.name) ??
    t(titles[search.status ?? "active"])
  );
}

/** The checked statuses of the filter menu: the chosen ones, else those of the tab. */
export function checkedStatuses(
  search: PostSearch,
  statuses: readonly Status[],
) {
  if (search.statusId) return splitIds(search.statusId);
  const tab = search.status ?? "active";
  return statuses
    .filter(
      (status) => tab === "all" || tab === "deleted" || status.category === tab,
    )
    .map((status) => status.id);
}

/**
 * The list filters that the request view keeps. It drops the New request flag, and the Deleted
 * filter, because a deleted request does not open.
 */
export function detailSearch(raw: Record<string, unknown>) {
  const { new: _new, ...search } = postSearch.parse(raw);
  return search.status === "deleted"
    ? { ...search, status: undefined }
    : search;
}

/**
 * The address change when a filter menu facet has `ids` checked out of `total` options.
 * Every board and every status is the same as no filter. The Deleted tab stays on.
 */
export function facetPatch(
  search: PostSearch,
  key: RequestFacet,
  ids: readonly string[],
  total: number,
): Partial<PostSearch> {
  const value = ids.length ? ids.join(",") : undefined;
  const deleted = search.status === "deleted" ? "deleted" : undefined;
  if (key === "status")
    return ids.length === total
      ? { status: deleted ?? "all", statusId: undefined }
      : { status: deleted, statusId: value };
  if (key === "board")
    return { board: ids.length === total ? undefined : value };
  return { tags: value };
}

/** The address change of the Clear item: every filter and the sort go; the search stays. */
export const clearedFilters: Partial<PostSearch> = {
  status: undefined,
  statusId: undefined,
  board: undefined,
  tags: undefined,
  sort: undefined,
};

type ViewFilters = ListPostViewsResponse["views"][number]["filters"];

/** The saved view filters of a request list. */
export function viewFilters(
  search: PostSearch,
  statuses: readonly Status[],
): CreatePostViewRequest["json"]["filters"] {
  const tab = search.status ?? "active";
  const status =
    search.statusId || (tab !== "all" && tab !== "deleted")
      ? checkedStatuses(search, statuses)
      : [];
  const board = splitIds(search.board);
  const tags = splitIds(search.tags);
  return {
    ...(status.length ? { status } : {}),
    ...(board.length ? { board } : {}),
    ...(tags.length ? { tags } : {}),
    ...(tab === "deleted" ? { showDeleted: true as const } : {}),
    ...(search.sort ? { sort: search.sort } : {}),
  };
}

/** The address of a saved view. A filter that the request list does not have is left out. */
export function viewSearch(filters: ViewFilters): Partial<PostSearch> {
  const join = (list?: string[]) => (list?.length ? list.join(",") : undefined);
  const parsed = postSearch.parse({
    statusId: join(filters.status),
    board: join(filters.board),
    tags: join(filters.tags),
    sort: filters.sort,
  });
  return {
    ...clearedFilters,
    ...parsed,
    status: filters.showDeleted
      ? "deleted"
      : filters.status?.length
        ? undefined
        : "all",
  };
}

/** The board, tag and search filters of the list query. */
export const postFilterQuery = (search: PostSearch) => ({
  ...(search.board ? { boardIds: search.board } : {}),
  ...(search.tags ? { tagIds: search.tags } : {}),
  ...(search.q ? { search: search.q } : {}),
});

/**
 * The listQuillsPosts input of the inbox. Status IDs filter those statuses. A status tab is a status category, so the
 * request waits for the statuses. `none` is true when the tab has no status: the list is
 * then empty, because an empty statusIds filter matches every post. "deleted" lists the posts
 * of every status that were deleted in the last 30 days, which a teammate can restore.
 */
export function postListInput(
  workspaceId: string,
  search: PostSearch,
  statuses: readonly Status[] | undefined,
) {
  const tab = search.status ?? "active";
  const ids = search.statusId
    ? splitIds(search.statusId)
    : tab === "all" || tab === "deleted"
      ? []
      : (statuses ?? [])
          .filter((status) => status.category === tab)
          .map((status) => status.id);
  const none =
    Boolean(statuses) && ids.length === 0 && tab !== "all" && tab !== "deleted";
  const input: ListPostsRequest = {
    param: { workspaceId: statuses && !none ? workspaceId : "" },
    query: {
      sort: search.sort ?? "newest",
      limit: "50",
      ...(ids.length ? { statusIds: ids.join(",") } : {}),
      ...(tab === "deleted" ? { showDeleted: "true" as const } : {}),
      ...postFilterQuery(search),
    },
  };
  return { input, none };
}
