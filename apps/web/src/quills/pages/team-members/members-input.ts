/** The page size of the Members list (settings spec A1). */
export const MEMBER_PAGE = 50;

/** The `listQuillsUsers` input of one page of the Members list. An empty search is left out. */
export const membersInput = (
  workspaceId: string,
  search: string,
  offset: number,
) => ({
  param: { workspaceId },
  query: {
    ...(search && { search }),
    offset: String(offset),
    limit: String(MEMBER_PAGE),
  },
});
