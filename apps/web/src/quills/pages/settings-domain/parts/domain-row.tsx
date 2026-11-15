import { Globe, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CopyField } from "../../../ui/copy-field";
import {
  Button,
  ConfirmDialog,
  RowActionsMenu,
  SettingsRow,
  StatusBadge,
  toast,
} from "../../../ui/upstream";
import { domainStatus, type CustomDomain } from "../domain-status";
import { PlanLock } from "./plan-lock";

export interface DomainRowProps {
  domain: CustomDomain;
  /** False when the plan is not active: the API refuses a check with 402. */
  entitled: boolean;
  manage: boolean;
  onVerify: () => Promise<unknown>;
  /** Always allowed, also without an active plan. */
  onRemove: () => Promise<unknown>;
}

/**
 * A custom domain with its status. While the domain is not active, a second row gives the
 * TXT record that the DNS check looks for.
 */
export function DomainRow(props: DomainRowProps) {
  const { domain } = props;
  const { t } = useTranslation("quills");
  const [checking, setChecking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const status = domainStatus(domain);
  const check = async () => {
    setChecking(true);
    try {
      await props.onVerify();
      // The API only queues the check. The job's change event refreshes the list.
      toast.success(t("settings-workspace.domain.checkQueued"));
    } catch {
      toast.error(t("core.problem.failed"));
    } finally {
      setChecking(false);
    }
  };
  const remove = async () => {
    setRemoving(true);
    try {
      await props.onRemove();
      setConfirming(false);
    } catch {
      toast.error(t("core.problem.failed"));
    } finally {
      setRemoving(false);
    }
  };
  return (
    <>
      <SettingsRow
        icon={<Globe />}
        title={<span className="font-mono font-normal">{domain.domain}</span>}
        badge={<StatusBadge tone={status.tone}>{t(status.key)}</StatusBadge>}
      >
        {props.manage && !domain.active ? (
          <>
            {props.entitled ? null : <PlanLock />}
            <Button
              variant="outline"
              size="sm"
              disabled={!props.entitled}
              loading={checking}
              onClick={() => void check()}
            >
              {t("settings-workspace.domain.check")}
            </Button>
          </>
        ) : null}
        {props.manage ? (
          <RowActionsMenu
            label={t("settings-workspace.domain.actions", {
              domain: domain.domain,
            })}
            actions={[
              {
                id: "remove",
                label: t("settings-workspace.domain.remove"),
                icon: Trash2,
                destructive: true,
                onSelect: () => setConfirming(true),
              },
            ]}
          />
        ) : null}
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={t("settings-workspace.domain.removeTitle", {
            domain: domain.domain,
          })}
          description={t("settings-workspace.domain.removeText")}
          confirmLabel={t("settings-workspace.domain.remove")}
          pending={removing}
          onConfirm={() => void remove()}
        />
      </SettingsRow>
      {domain.active ? null : (
        <SettingsRow
          stack
          title={t("settings-workspace.domain.record")}
          description={t("settings-workspace.domain.recordText")}
        >
          <div className="grid w-full gap-2 sm:w-72">
            {[
              [t("settings-workspace.domain.recordName"), domain.record.name],
              [t("settings-workspace.domain.recordValue"), domain.record.value],
            ].map(([label, value]) => (
              <div key={label} className="grid gap-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <CopyField label={label} value={value} />
              </div>
            ))}
          </div>
        </SettingsRow>
      )}
    </>
  );
}
