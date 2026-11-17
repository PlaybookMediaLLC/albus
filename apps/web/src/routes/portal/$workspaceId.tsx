import { createFileRoute } from "@tanstack/react-router";
import { evaluateMyPortalAccessQuery } from "@/quills/api/portal/evaluate-my-portal-access";
import { getPublicPortalConfigQuery } from "@/quills/api/portal/get-public-portal-config";
import { linkPortalWidgetProfile } from "@/quills/api/portal/link-portal-widget-profile";
import type { Viewer } from "@/quills/core/types";
import { PortalRoute } from "@/quills/portal/layout";
import { ensureQuillsI18n } from "@/quills/i18n/load";

/** Accounts and workspaces whose widget profile link ran in this page load. */
const linkedWidget = new Set<string>();

export const Route = createFileRoute("/portal/$workspaceId")({
  beforeLoad: async ({ context, params }) => {
    await ensureQuillsI18n();
    const viewer: Viewer = context.user?.id
      ? { kind: "user", id: context.user.id }
      : { kind: "anonymous" };
    const input = { param: { workspace: params.workspaceId } };
    const configQuery = getPublicPortalConfigQuery(input, viewer);
    const accessQuery = evaluateMyPortalAccessQuery(input, viewer);
    // Once per page load: a signed-in account whose verified email matches a widget profile gets
    // its widget history (issue #129). A failure leaves the profiles apart until the next load.
    const link = `${context.user?.id}:${params.workspaceId}`;
    if (viewer.kind === "user" && !linkedWidget.has(link)) {
      linkedWidget.add(link);
      await linkPortalWidgetProfile(input).catch(() => undefined);
    }
    await Promise.all([
      context.queryClient.prefetchQuery(configQuery),
      context.queryClient.prefetchQuery(accessQuery),
    ]);
    return {
      quillsPortal: {
        workspaceId: params.workspaceId,
        viewer,
        portalAvailable: Boolean(
          context.queryClient.getQueryData(configQuery.queryKey),
        ),
        accessGranted:
          context.queryClient.getQueryData(accessQuery.queryKey)?.granted ===
          true,
      },
    };
  },
  component: PortalRoute,
});
