import { z } from "zod";
import type { ListPostsRequest } from "../../api/team/list-posts";
import type { ListStatusesResponse } from "../../api/team/list-statuses";
import type { RequestFilterKey } from "../../ui/inbox/request-filters";

/** The inbox filters in the address. The post view keeps them, so Back and J/K use the same list. */
export const postSearch = z.object({
  status: z
    .enum(["active", "complete", "closed", "all", "deleted"])
    .optional()
    .catch(undefined),
  board: z.string().max(100).optional().catch(undefined),
  /** One status, as the sidebar opens it. It replaces the status tab. */
  statusId: z.string().max(100).optional().catch(undefined),
  q: z.string().max(200).optional().catch(undefined),
  sort: z.enum(["newest", "votes", "rice"]).optional().catch(undefined),
  /** Opens the New request modal, as the sidebar's New request button does. */
  new: z.boolean().optional().catch(undefined),
});
export type PostSearch = z.infer<typeof postSearch>;
export type PostTab = NonNullable<PostSearch["status"]>;

type Status = ListStatusesResponse["statuses"][number];

const titles = {
  active: "team-posts.title",
  complete: "team-posts.complete",
  closed: "team-posts.closed",
  all: "team.nav.allRequests",
  deleted: "team-posts.deleted",
} as const;

/** The title of a request list: the name of the chosen status, else the name of the tab. */
export function requestListTitle(
  search: PostSearch,
  statuses: readonly Status[],
  t: (key: string) => string,
) {
  return (
    statuses.find((status) => status.id === search.statusId)?.name ??
    t(titles[search.status ?? "active"])
  );
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

/** The address change of a filter menu choice. A status group replaces a sidebar status. */
export function filterPatch(
  key: RequestFilterKey,
  value: string,
): Partial<PostSearch> {
  // An empty or unknown value becomes undefined, which removes the key.
  const parsed = postSearch.shape[key].parse(value || undefined);
  return key === "status"
    ? { status: parsed as PostTab | undefined, statusId: undefined }
    : ({ [key]: parsed } as Partial<PostSearch>);
}

/** The board and search filters, which the list and the tab counts share. */
export const postFilterQuery = (search: PostSearch) => ({
  ...(search.board ? { boardIds: search.board } : {}),
  ...(search.q ? { search: search.q } : {}),
});

/**
 * The listQuillsPosts input of the inbox. A status ID filters one status. A status tab is a status category, so the
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
    ? [search.statusId]
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
