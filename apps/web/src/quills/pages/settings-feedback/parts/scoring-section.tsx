import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { GetScoringFactorsResponse } from "../../../api/team/get-scoring-factors";
import { useSetScoringFactors } from "../../../hooks/team/use-set-scoring-factors";
import { useTeamRuntime } from "../../../team/runtime";
import { IconButton } from "../../../ui/inbox/icon-button";
import { PortalForm } from "../../../ui/portal-form";
import {
  Button,
  Input,
  SettingsCard,
  SettingsNote,
  SettingsSection,
} from "../../../ui/upstream";

// A weight is kept as typed text, so "-" can start a negative weight; it is checked on save.
type Row = { id?: string; name: string; weight: string };
type Values = { factors: Row[] };

export interface ScoringSectionProps {
  workspaceId: string;
  factors: GetScoringFactorsResponse["factors"];
}

/**
 * The team's scoring factors (#79): a name and a weight from -10 to 10 each, negative for a cost
 * such as effort. Triage ranks requests by the sum of weight × each request's value.
 */
export function ScoringSection({ workspaceId, factors }: ScoringSectionProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const save = useSetScoringFactors(team.viewer);
  // The bounds of setQuillsScoringFactors. A factor without an ID gets one from the API.
  const schema = z.object({
    factors: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z
            .string()
            .trim()
            .min(1, t("settings-product.scoring.nameRequired"))
            .max(60),
          weight: z
            .string()
            .regex(/^-?(10|[1-9])$/, t("settings-product.scoring.weightRange")),
        }),
      )
      .max(10),
  });
  const stored: Values = {
    factors: factors.map((f) => ({ ...f, weight: String(f.weight) })),
  };
  const head = "text-xs font-medium text-muted-foreground";
  if (!team.permissions.manageSettings)
    return (
      <SettingsSection title={t("settings-product.scoring.title")}>
        <SettingsCard>
          <ul className="grid gap-1 p-4 text-sm">
            {factors.map((f) => (
              <li key={f.id}>
                {t("settings-product.scoring.factor", {
                  name: f.name,
                  weight: f.weight,
                })}
              </li>
            ))}
          </ul>
        </SettingsCard>
        <SettingsNote>{t("settings-product.scoring.note")}</SettingsNote>
      </SettingsSection>
    );
  return (
    <SettingsSection title={t("settings-product.scoring.title")}>
      <SettingsCard>
        <PortalForm<Values>
          schema={schema}
          defaultValues={stored}
          values={stored}
          submitKey="settings-product.scoring.save"
          className="max-w-none p-4"
          onSubmit={async (values) => {
            await save.mutateAsync({
              param: { workspaceId },
              json: {
                factors: values.factors.map((f) => ({
                  ...(f.id && { id: f.id }),
                  name: f.name,
                  weight: Number(f.weight),
                })),
              },
            });
          }}
        >
          {(form) => {
            const rows = form.watch("factors");
            const set = (next: Row[]) =>
              form.setValue("factors", next, { shouldDirty: true });
            const change = (index: number, patch: Partial<Row>) =>
              set(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
            return (
              <div className="grid gap-2">
                {rows.length ? (
                  <div aria-hidden="true" className="flex gap-2">
                    <span className={`flex-1 ${head}`}>
                      {t("settings-product.scoring.nameHead")}
                    </span>
                    <span className={`w-24 ${head}`}>
                      {t("settings-product.scoring.weightHead")}
                    </span>
                    <span className="size-9" />
                  </div>
                ) : null}
                {rows.map((row, index) => {
                  const errors = form.formState.errors.factors?.[index];
                  return (
                    <div key={row.id ?? `new-${index}`} className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <Input
                          aria-label={t("settings-product.scoring.name", {
                            n: index + 1,
                          })}
                          value={row.name}
                          aria-invalid={Boolean(errors?.name)}
                          onChange={(e) =>
                            change(index, { name: e.target.value })
                          }
                        />
                        <Input
                          aria-label={t("settings-product.scoring.weight", {
                            n: index + 1,
                          })}
                          inputMode="numeric"
                          className="w-24"
                          value={row.weight}
                          aria-invalid={Boolean(errors?.weight)}
                          onChange={(e) =>
                            change(index, { weight: e.target.value.trim() })
                          }
                        />
                        <IconButton
                          label={t("settings-product.scoring.remove", {
                            name: row.name || index + 1,
                          })}
                          onClick={() =>
                            set(rows.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 aria-hidden="true" />
                        </IconButton>
                      </div>
                      {errors?.name?.message || errors?.weight?.message ? (
                        <p role="alert" className="text-sm text-destructive">
                          {errors.name?.message ?? errors.weight?.message}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
                {rows.length < 10 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="justify-self-start"
                    onClick={() => set([...rows, { name: "", weight: "1" }])}
                  >
                    <Plus aria-hidden="true" />
                    {t("settings-product.scoring.add")}
                  </Button>
                ) : null}
              </div>
            );
          }}
        </PortalForm>
      </SettingsCard>
      <SettingsNote>{t("settings-product.scoring.note")}</SettingsNote>
    </SettingsSection>
  );
}
