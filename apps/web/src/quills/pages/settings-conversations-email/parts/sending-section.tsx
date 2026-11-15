import { Mail, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetEmailChannelConfigResponse } from "../../../api/team/get-email-channel-config";
import { problemOf } from "../../../core/problem-of";
import { useCreateSendingAddress } from "../../../hooks/team/use-create-sending-address";
import { useDeleteChannelAccount } from "../../../hooks/team/use-delete-channel-account";
import { useTeamRuntime } from "../../../team/runtime";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  RowActionsMenu,
  SettingsCard,
  SettingsEmpty,
  SettingsRow,
  SettingsSection,
  StatusBadge,
  toast,
} from "../../../ui/upstream";
import { AddressForm } from "./address-form";

export interface SendingSectionProps {
  workspaceId: string;
  addresses: GetEmailChannelConfigResponse["sendingAddresses"];
}

const moduleKeys: Record<string, string> = {
  support: "settings-conversations.email.modules.support",
  feedback: "settings-conversations.email.modules.feedback",
  changelog: "settings-conversations.email.modules.changelog",
};

/** The addresses that the workspace sends email from. */
export function SendingSection({
  workspaceId,
  addresses,
}: SendingSectionProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const create = useCreateSendingAddress(team.viewer);
  const remove = useDeleteChannelAccount(team.viewer);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const manage = team.permissions.manageSettings;
  return (
    <SettingsSection
      title={t("settings-conversations.email.sending")}
      action={
        manage ? (
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() => setAdding(true)}
          >
            <Plus aria-hidden="true" />
            {t("settings-conversations.email.addAddress")}
          </Button>
        ) : null
      }
    >
      <SettingsCard>
        {addresses.length ? null : (
          <SettingsEmpty
            icon={<Mail />}
            title={t("settings-conversations.email.noAddresses")}
            description={t("settings-conversations.email.noAddressesText")}
          />
        )}
        {addresses.map((account) => (
          <SettingsRow
            key={account.id}
            title={account.address ?? account.id}
            badge={
              account.module ? (
                <StatusBadge tone="neutral">
                  {t(moduleKeys[account.module] ?? account.module)}
                </StatusBadge>
              ) : null
            }
          >
            {manage ? (
              <RowActionsMenu
                label={t("settings-conversations.email.actions", {
                  name: account.address,
                })}
                actions={[
                  {
                    id: "remove",
                    label: t("settings-conversations.email.remove"),
                    icon: Trash2,
                    destructive: true,
                    onSelect: () => setRemoving(account.id),
                  },
                ]}
              />
            ) : null}
          </SettingsRow>
        ))}
      </SettingsCard>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t("settings-conversations.email.removeTitle")}
        description={t("settings-conversations.email.removeText")}
        confirmLabel={t("settings-conversations.email.remove")}
        pending={remove.isPending}
        onConfirm={() =>
          removing &&
          remove.mutate(
            { param: { workspaceId, channelAccountId: removing } },
            {
              onSuccess: () => setRemoving(null),
              onError: () =>
                toast.error(t("settings-conversations.email.failed")),
            },
          )
        }
      />
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>
              {t("settings-conversations.email.addAddress")}
            </DialogTitle>
            <DialogDescription>
              {t("settings-conversations.email.addText")}
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            onSubmit={async (json) => {
              const problem = await problemOf(
                create.mutateAsync({ param: { workspaceId }, json }),
              );
              if (!problem) setAdding(false);
              return problem;
            }}
          />
        </DialogPopup>
      </Dialog>
    </SettingsSection>
  );
}
