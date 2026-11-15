import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../../core/types";
import { NameDialog } from "../../../ui/name-dialog";
import { Button, toast } from "../../../ui/upstream";
import { PlanLock } from "./plan-lock";

export interface AddDomainDialogProps {
  /** The plan is not active: the API refuses a new domain with 402. */
  locked: boolean;
  onSet: (domain: string) => Promise<unknown>;
}

/** The "Add domain" button and its dialog. */
export function AddDomainDialog({ locked, onSet }: AddDomainDialogProps) {
  const { t } = useTranslation("quills");
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {locked ? <PlanLock /> : null}
      <Button
        variant="secondary"
        size="sm"
        className="rounded-full"
        disabled={locked}
        onClick={() => setOpen(true)}
      >
        <Plus aria-hidden="true" />
        {t("settings-workspace.domain.add")}
      </Button>
      <NameDialog
        open={open}
        onOpenChange={setOpen}
        title={t("settings-workspace.domain.add")}
        description={t("settings-workspace.domain.addText")}
        label={t("settings-workspace.domain.domain")}
        placeholder={t("settings-workspace.domain.placeholder")}
        prefix={t("settings-workspace.domain.scheme")}
        maxLength={253}
        submitKey="settings-workspace.domain.save"
        // The one conflict here: another workspace, or the other kind, uses the domain.
        taken={t("settings-workspace.domain.inUse")}
        issuePath="domain"
        onSubmit={async (domain): Promise<PortalProblem | void> => {
          try {
            await onSet(domain);
            setOpen(false);
            toast.success(t("settings-workspace.domain.added"));
          } catch (error) {
            return error as PortalProblem;
          }
        }}
      />
    </div>
  );
}
