import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsBillingPage } from "@/quills/pages/settings-billing/settings-billing-page";
const searchSchema = z.object({ checkout: z.string().optional() });
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/billing/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsBillingPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
