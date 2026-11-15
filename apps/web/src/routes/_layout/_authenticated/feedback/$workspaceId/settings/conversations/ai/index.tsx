import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsConversationsAiPage } from "@/quills/pages/settings-conversations-ai/settings-conversations-ai-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/conversations/ai/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsConversationsAiPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
