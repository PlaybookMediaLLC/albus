import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../../core/types";
import {
  Button,
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
  toast,
} from "../../../ui/upstream";
import { DomainForm } from "./domain-form";
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full"
              disabled={locked}
            />
          }
        >
          <Plus aria-hidden="true" />
          {t("settings-workspace.domain.add")}
        </DialogTrigger>
        <DialogPopup className="gap-4 p-6">
          <DialogTitle>{t("settings-workspace.domain.add")}</DialogTitle>
          <DialogDescription>
            {t("settings-workspace.domain.addText")}
          </DialogDescription>
          <DomainForm
            onSubmit={async ({ domain }): Promise<PortalProblem | void> => {
              try {
                await onSet(domain);
                setOpen(false);
                toast.success(t("settings-workspace.domain.added"));
              } catch (error) {
                const problem = error as PortalProblem;
                // The one conflict here: another workspace, or the other kind, uses the domain.
                if (problem.kind !== "conflict") return problem;
                return {
                  kind: "invalid",
                  issues: [
                    {
                      path: "domain",
                      message: t("settings-workspace.domain.inUse"),
                    },
                  ],
                };
              }
            }}
          />
        </DialogPopup>
      </Dialog>
    </div>
  );
}
