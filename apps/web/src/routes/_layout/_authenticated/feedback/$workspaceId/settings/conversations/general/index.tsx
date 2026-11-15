import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsConversationsGeneralPage } from "@/quills/pages/settings-conversations-general/settings-conversations-general-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/conversations/general/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsConversationsGeneralPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
