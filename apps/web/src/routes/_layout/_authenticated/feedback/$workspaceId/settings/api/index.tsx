import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsApiPage } from "@/quills/pages/settings-api/settings-api-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/api/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsApiPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
