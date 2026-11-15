import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsFeedbackPage } from "@/quills/pages/settings-feedback/settings-feedback-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/feedback/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsFeedbackPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
