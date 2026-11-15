import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsPrivacyPage } from "@/quills/pages/settings-privacy/settings-privacy-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/privacy/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsPrivacyPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
