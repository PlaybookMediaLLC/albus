import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsConversationsEmailPage } from "@/quills/pages/settings-conversations-email/settings-conversations-email-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/conversations/email/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsConversationsEmailPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
