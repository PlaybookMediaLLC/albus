import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { authClient, Button, SettingsRow, toast } from "../../../ui/upstream";

export interface DeleteWorkspaceRowProps {
  workspaceId: string;
}

/**
 * Links to the workspace settings, where the owner deletes the whole workspace. Those
 * settings act on the active workspace, so this one becomes active first.
 */
export function DeleteWorkspaceRow({ workspaceId }: DeleteWorkspaceRowProps) {
  const { t } = useTranslation("quills");
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const open = async () => {
    setPending(true);
    try {
      const { error } = await authClient.organization.setActive({
        organizationId: workspaceId,
      });
      if (error) throw error;
      await navigate({ to: "/dashboard/settings/workspace/general" });
    } catch {
      toast.error(t("settings-connections.data.openFailed"));
    } finally {
      setPending(false);
    }
  };
  return (
    <SettingsRow
      title={t("settings-connections.data.deleteWorkspace")}
      titleClassName="text-destructive-foreground"
      description={t("settings-connections.data.deleteWorkspaceText")}
    >
      <Button
        variant="outline"
        size="sm"
        loading={pending}
        onClick={() => void open()}
      >
        {t("settings-connections.data.openSettings")}
        <ArrowUpRight aria-hidden="true" />
      </Button>
    </SettingsRow>
  );
}
