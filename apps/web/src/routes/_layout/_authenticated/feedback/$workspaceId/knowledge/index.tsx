import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TeamKnowledgePage } from "@/quills/pages/team-knowledge/team-knowledge-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/knowledge/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <TeamKnowledgePage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
