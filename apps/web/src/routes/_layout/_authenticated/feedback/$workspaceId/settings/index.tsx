import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/feedback/$workspaceId/settings/account", params });
  },
});
