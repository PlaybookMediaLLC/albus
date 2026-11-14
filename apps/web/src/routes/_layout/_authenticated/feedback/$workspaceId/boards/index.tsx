import { createFileRoute, redirect } from "@tanstack/react-router";
// The board settings moved into the settings area. Old links keep working.
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/boards/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/feedback/$workspaceId/settings/boards", params });
  },
});
