import { createFileRoute, Outlet } from "@tanstack/react-router";
import useGetProject from "@/hooks/queries/project/use-get-project";
import { useProjectWebSocket } from "@/hooks/use-project-websocket";
import { getProjectUnavailableReason } from "@/lib/project-unavailable-reason";

// Owns the project socket so switching views or opening a task keeps the
// connection, instead of reconnecting and reloading the board each time. The
// socket reconciles a cached board when it connects, so the views below read
// the board without refetching it on mount.
export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId",
)({
  component: ProjectRealtime,
});

function ProjectRealtime() {
  const { workspaceId, projectId } = Route.useParams();
  const { error } = useGetProject({ id: projectId, workspaceId });
  useProjectWebSocket(getProjectUnavailableReason(error) ? "" : projectId);
  return <Outlet />;
}
