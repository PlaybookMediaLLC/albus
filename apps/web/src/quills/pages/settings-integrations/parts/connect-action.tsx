import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../../core/types";
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
        labelKey="settings-connections.integrations.connectTo"
        labelValues={{ name }}
        onConfirm={async () => open(await connector.connect(workspaceId, {}))}
      >
        {t("settings-connections.integrations.connect")}
      </ConfirmAction>
    );
  return (
    <Dialog open={shown} onOpenChange={setShown}>
      <DialogTrigger
        render={
          <Button
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
              return error as PortalProblem;
            }
          }}
        />
      </DialogPopup>
    </Dialog>
  );
}
