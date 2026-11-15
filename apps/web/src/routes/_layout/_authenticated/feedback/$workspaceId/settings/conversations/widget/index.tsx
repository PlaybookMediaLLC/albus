import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsConversationsWidgetPage } from "@/quills/pages/settings-conversations-widget/settings-conversations-widget-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/conversations/widget/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsConversationsWidgetPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
