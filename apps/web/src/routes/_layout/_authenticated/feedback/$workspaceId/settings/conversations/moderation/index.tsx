import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsConversationsModerationPage } from "@/quills/pages/settings-conversations-moderation/settings-conversations-moderation-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/conversations/moderation/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsConversationsModerationPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
