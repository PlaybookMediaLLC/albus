import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { BoardFieldRows } from "./board-field-rows";
import {
  FIELD_TYPES,
  toFields,
  toRows,
  type BoardField,
  type FieldRow,
} from "../board-fields";

// Named like the API body, so a server issue such as customFields.0.options marks its row.
const schema = z.object({
  customFields: z
    .array(
      z.object({
        key: z
          .string()
          .trim()
          .regex(/^$|^[a-z][a-z0-9_]{0,39}$/),
        label: z.string().trim().min(1).max(100),
        type: z.enum(FIELD_TYPES),
        required: z.boolean(),
        internal: z.boolean(),
        options: z.string().max(5100),
      }),
    )
    .max(20),
});

export interface BoardFieldsFormProps {
  fields: readonly BoardField[];
  onSubmit: (fields: BoardField[]) => Promise<PortalProblem | void>;
}

/** The custom fields that a board asks for when someone submits a post (issue #71). */
export function BoardFieldsForm({ fields, onSubmit }: BoardFieldsFormProps) {
  const { t } = useTranslation("quills");
  return (
    <section aria-labelledby="team-boards-fields" className="grid gap-2">
      <h2 id="team-boards-fields" className="text-sm font-semibold">
        {t("board-fields.title")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("board-fields.description")}
      </p>
      <PortalForm<{ customFields: FieldRow[] }>
        schema={schema}
        defaultValues={{ customFields: toRows(fields) }}
        submitKey="board-fields.save"
        onSubmit={(values) => onSubmit(toFields(values.customFields))}
      >
        {(form) => <BoardFieldRows form={form} />}
      </PortalForm>
    </section>
  );
}
