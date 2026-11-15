import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { FormSelect } from "../../../ui/form-select";
import { PortalForm } from "../../../ui/portal-form";

const schema = z.object({
  kind: z.enum(["posts", "users", "companies", "conversations"]),
});
export type ExportValues = z.infer<typeof schema>;

export interface ExportFormProps {
  onSubmit: (values: ExportValues) => Promise<PortalProblem | void>;
}

/** The data of a CSV export. */
export function ExportForm({ onSubmit }: ExportFormProps) {
  const { t } = useTranslation("quills");
  return (
    <PortalForm
      schema={schema}
      defaultValues={{ kind: "posts" }}
      submitKey="settings-connections.data.startExport"
      className="max-w-none gap-3"
      onSubmit={onSubmit}
    >
      {(form) => (
        <FormSelect
          control={form.control}
          name="kind"
          label={t("settings-connections.data.exportData")}
          options={[
            {
              value: "posts",
              label: t("settings-connections.data.kinds.posts"),
            },
            {
              value: "users",
              label: t("settings-connections.data.kinds.users"),
            },
            {
              value: "companies",
              label: t("settings-connections.data.kinds.companies"),
            },
            {
              value: "conversations",
              label: t("settings-connections.data.kinds.conversations"),
            },
          ]}
        />
      )}
    </PortalForm>
  );
}
