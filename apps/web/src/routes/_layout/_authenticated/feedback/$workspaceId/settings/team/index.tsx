import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsTeamPage } from "@/quills/pages/settings-team/settings-team-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/team/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsTeamPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
