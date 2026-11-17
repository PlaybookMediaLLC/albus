import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { Input, Label } from "../../../ui/upstream";
const schema = z.object({
  boardId: z.string().optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(10000),
  attachmentIds: z.array(z.string()).max(10).optional(),
  idempotencyKey: z.string().min(1).max(128).optional(),
  customFields: z
    .record(
      z.string(),
      z.union([
        z.string().max(2000),
        z.number(),
        z.boolean(),
        z.array(z.string().max(100)).max(50),
        z.null(),
      ]),
    )
    .optional(),
});
export interface SampleFormProps {
  onSubmit: (values: z.infer<typeof schema>) => Promise<PortalProblem | void>;
}
export function SampleForm({ onSubmit }: SampleFormProps) {
  const { t } = useTranslation("quills");
  return (
    <PortalForm
      schema={schema}
      defaultValues={{ content: "value" }}
      submitKey="sample.submit"
      onSubmit={onSubmit}
    >
      {(form) => (
        <div>
          <Label htmlFor="sample-board-id">{t("sample.boardId")}</Label>
          <Input id="sample-board-id" {...form.register("boardId")} />
          {form.formState.errors.boardId?.message ? (
            <p role="alert">{form.formState.errors.boardId.message}</p>
          ) : null}
        </div>
      )}
    </PortalForm>
  );
}
