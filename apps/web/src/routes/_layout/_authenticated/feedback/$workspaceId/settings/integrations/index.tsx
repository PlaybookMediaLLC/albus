import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsIntegrationsPage } from "@/quills/pages/settings-integrations/settings-integrations-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/integrations/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsIntegrationsPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
