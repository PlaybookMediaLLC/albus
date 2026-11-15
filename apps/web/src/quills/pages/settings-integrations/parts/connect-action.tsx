import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem, PortalProblemKind } from "../../../core/types";
import { ConfirmAction } from "../../../ui/confirm-action";
import {
  Button,
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
  toast,
} from "../../../ui/upstream";
import type { Connector } from "../connectors";
import { ConnectForm } from "./connect-form";

export interface ConnectActionProps {
  workspaceId: string;
  /** The provider name, such as "Slack". */
  name: string;
  connector: Connector;
  /** Runs after a key or webhook is saved. */
  onConnected: () => void;
}

// The OAuth state works once, for ten minutes, in this browser session: open it in this tab.
const open = (address: string | null) => {
  if (address) window.location.assign(address);
};

// The problem keeps no API status, so one text covers a rejected key and a silent provider.
const problems: Partial<Record<PortalProblemKind, string>> = {
  failed: "settings-connections.integrations.rejected",
  conflict: "settings-connections.integrations.notReady",
  noAccess: "settings.saveDenied",
  rateLimited: "core.problem.rateLimited",
};
const problemText = (error: unknown, oauth: boolean) => {
  const kind = (error as Partial<PortalProblem> | null)?.kind;
  // An OAuth start has one conflict: the instance has no OAuth app for the provider.
  if (oauth && kind === "conflict")
    return "settings-connections.integrations.noApp";
  return (kind && problems[kind]) || "core.problem.failed";
};

/** Connect: an OAuth provider opens at once; a key or webhook provider asks for its values. */
export function ConnectAction({
  workspaceId,
  name,
  connector,
  onConnected,
}: ConnectActionProps) {
  const { t } = useTranslation("quills");
  const [shown, setShown] = useState(false);
  if (!connector.fields.length)
    return (
      <ConfirmAction
        variant="outline"
        labelKey="settings-connections.integrations.connectTo"
        labelValues={{ name }}
        onConfirm={async () => {
          try {
            open(await connector.connect(workspaceId, {}));
          } catch (error) {
            toast.error(t(problemText(error, true)));
          }
        }}
      >
        {t("settings-connections.integrations.connect")}
      </ConfirmAction>
    );
  return (
    <Dialog open={shown} onOpenChange={setShown}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            aria-label={t("settings-connections.integrations.connectTo", {
              name,
            })}
          />
        }
      >
        {t("settings-connections.integrations.connect")}
      </DialogTrigger>
      <DialogPopup className="gap-4 p-6">
        <DialogTitle>
          {t("settings-connections.integrations.connectTo", { name })}
        </DialogTitle>
        <DialogDescription>
          {t("settings-connections.integrations.connectText")}
        </DialogDescription>
        <ConnectForm
          fields={connector.fields}
          onSubmit={async (values): Promise<PortalProblem | void> => {
            try {
              const address = await connector.connect(workspaceId, values);
              if (address) return open(address);
              setShown(false);
              onConnected();
              toast.success(
                t("settings-connections.integrations.saved", { name }),
              );
            } catch (error) {
              const problem = error as PortalProblem;
              // Field problems show at the fields. A toast keeps the form usable for the rest.
              if (problem.kind === "invalid" && problem.issues?.length)
                return problem;
              toast.error(t(problemText(problem, Boolean(connector.oauth))));
            }
          }}
        />
      </DialogPopup>
    </Dialog>
  );
}
