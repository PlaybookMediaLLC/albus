import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TeamRoadmapPage } from "@/quills/pages/team-roadmap/team-roadmap-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/roadmap/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <TeamRoadmapPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
