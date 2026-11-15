import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { createElement, type ReactNode } from "react";
import type { ListUserAttributesResponse } from "../../api/team/list-user-attributes";
import type { ListUserCommentsResponse } from "../../api/team/list-user-comments";
import { getUserFixture } from "../../api/team/get-user.fixture";
import { TeamRuntimeProvider, type TeamPermissions } from "../../team/runtime";
import { mockApi } from "../../test/mock-api";
import {
  inboxBoards,
  inboxPosts,
  inboxStatuses,
} from "../team-posts/inbox.fixture";

// One customer with a request, two comments and a trait, for the member page tests.
const created = "2026-01-01T00:00:00.000Z";
export const member = getUserFixture.ok({
  principalId: "principalId_test_1",
  name: "Ada Lovelace",
  externalId: "ext_ada",
  attributes: [{ key: "plan", value: "Pro" }],
  joinedAt: created,
  postCount: 1,
  commentCount: 2,
  voteCount: 3,
});
export const memberAttributes = {
  attributes: [
    {
      id: "attribute_plan",
      key: "plan",
      label: "Plan",
      description: null,
      type: "string",
      currencyCode: null,
      externalKey: null,
      createdAt: created,
      updatedAt: created,
    },
  ],
} satisfies ListUserAttributesResponse;
export const memberComments = {
  items: [
    {
      id: "comment_1",
      postId: "post_export",
      postTitle: "Export to CSV",
      content: "**Please** add this",
      reactionCount: 4,
      createdAt: created,
    },
  ],
  nextCursor: null,
  hasMore: false,
} satisfies ListUserCommentsResponse;

/** The replies of a loaded member page, in request order. */
export function replyMember(api = mockApi()) {
  api.reply(member);
  api.reply(inboxPosts);
  api.reply(inboxStatuses);
  api.reply(inboxBoards);
  api.reply(memberAttributes);
  return api;
}

/** A part inside the teammate runtime and a router, for `renderComponent` in part tests. */
export function inTeam(
  node: ReactNode,
  permissions: Partial<TeamPermissions> = {},
) {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({
      initialEntries: ["/feedback/workspace_test_1"],
    }),
  });
  const value = {
    workspaceId: "workspace_test_1",
    viewer: { kind: "user" as const, id: "user_test_1" },
    permissions: {
      read: true,
      create: true,
      update: true,
      delete: true,
      manageSettings: true,
      ...permissions,
    },
  };
  // React types require children in props; createElement passes them as the third argument.
  type Props<P> = P & { children: ReactNode };
  return createElement(
    RouterContextProvider,
    { router } as Props<{ router: typeof router }>,
    createElement(
      TeamRuntimeProvider,
      { value } as Props<{ value: typeof value }>,
      node,
    ),
  );
}
