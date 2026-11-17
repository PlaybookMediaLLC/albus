import { usePortalViewer } from "../core/use-portal-viewer";
import { useDeclinePortalWidgetLink } from "../hooks/portal/use-decline-portal-widget-link";
import { useGetPortalWidgetLink } from "../hooks/portal/use-get-portal-widget-link";
import { useLinkPortalWidgetProfile } from "../hooks/portal/use-link-portal-widget-profile";
import { WidgetLinkPrompt } from "../ui/widget-link/widget-link-prompt";

export interface PortalWidgetLinkProps {
  workspaceId: string;
  workspaceName: string;
}

/**
 * For a signed-in person whose support widget asked to open the portal: the prompt to link that
 * widget activity, or refuse it. Render it for signed-in viewers only.
 */
export function PortalWidgetLink({
  workspaceId,
  workspaceName,
}: PortalWidgetLinkProps) {
  const viewer = usePortalViewer();
  const input = { param: { workspace: workspaceId } };
  const pending = useGetPortalWidgetLink(input, viewer);
  const link = useLinkPortalWidgetProfile(viewer);
  const decline = useDeclinePortalWidgetLink(viewer);
  const answer = link.isSuccess
    ? "linked"
    : decline.isSuccess
      ? "declined"
      : null;
  if (!answer && !pending.data?.pending) return null;
  // The page column, so the prompt lines up with the page below it.
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-6">
      <WidgetLinkPrompt
        answer={answer}
        onConfirm={() => link.mutateAsync(input).then(() => undefined)}
        onDecline={() => decline.mutateAsync(input).then(() => undefined)}
        workspaceName={workspaceName}
      />
    </div>
  );
}
