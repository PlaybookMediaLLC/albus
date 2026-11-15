import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsChangelogPage } from "@/quills/pages/settings-changelog/settings-changelog-page";
const searchSchema = z.object({});
export const Route = createFileRoute(
  "/_layout/_authenticated/feedback/$workspaceId/settings/changelog/",
)({ validateSearch: searchSchema, component: RouteComponent });
function RouteComponent() {
  const params = Route.useParams();
  return (
    <SettingsChangelogPage
      workspaceId={"workspaceId" in params ? String(params.workspaceId) : ""}
      params={params}
      search={Route.useSearch()}
    />
  );
}
