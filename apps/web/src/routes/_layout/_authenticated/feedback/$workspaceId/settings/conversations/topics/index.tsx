import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsConversationsTopicsPage } from "@/quills/pages/settings-conversations-topics/settings-conversations-topics-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/conversations/topics/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsConversationsTopicsPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
