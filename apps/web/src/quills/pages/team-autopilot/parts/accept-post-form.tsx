import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  toFieldValues,
  type FieldValue,
  type PublicField,
} from "../../../core/composer-fields";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { BoardSelect } from "../../../ui/post/board-select";
import { ComposerFields } from "../../../ui/post/composer-fields";
import { fieldsOfBoard, requireFields } from "../../../ui/post/composer-schema";
import { Input, Label } from "../../../ui/upstream";
export interface AcceptPostFormProps {
  /** `fields`: the board's custom fields, internal ones included; a new post needs the required ones. */
  boards: Array<{ id: string; name: string; fields?: PublicField[] }>;
  /** The board that is chosen first; the first board when absent. */
  defaultBoardId?: string;
  /** The suggested title, which the teammate can edit. */
  title: string;
  /** Called when the teammate picks another board, so its fields can load. */
  onBoardChange?: (boardId: string) => void;
  onSubmit: (values: {
    boardId: string;
    title: string;
    customFields: Record<string, FieldValue>;
  }) => Promise<PortalProblem | void>;
}
/** The board, the title and the board's custom fields of the post that a signal becomes. */
export function AcceptPostForm({
  boards,
  defaultBoardId,
  title,
  onBoardChange,
  onSubmit,
}: AcceptPostFormProps) {
  const { t } = useTranslation("quills");
  const schema = z
    .object({
      boardId: z.string().min(1),
      title: z.string().trim().min(1).max(200),
      customFields: z.record(z.string(), z.any()).optional(),
    })
    .superRefine(
      requireFields(boards, (label) => t("feedback.fieldRequired", { label })),
    );
  return (
    <PortalForm
      schema={schema}
      defaultValues={{
        boardId: defaultBoardId ?? boards[0]?.id ?? "",
        title,
        customFields: {},
      }}
      submitKey="autopilot.submit"
      onSubmit={(values) =>
        onSubmit({
          boardId: values.boardId,
          title: values.title,
          customFields: toFieldValues(
            fieldsOfBoard(boards, values.boardId),
            values.customFields,
          ),
        })
      }
    >
      {(form) => (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="autopilot-post-title">
              {t("autopilot.postTitle")}
            </Label>
            <Input
              id="autopilot-post-title"
              maxLength={200}
              {...form.register("title")}
            />
            {form.formState.errors.title?.message ? (
              <p role="alert">{form.formState.errors.title.message}</p>
            ) : null}
          </div>
          <BoardSelect
            name="boardId"
            boards={boards}
            value={form.watch("boardId") || undefined}
            onChange={(boardId) => {
              form.setValue("boardId", boardId, { shouldDirty: true });
              onBoardChange?.(boardId);
            }}
          />
          {form.formState.errors.boardId?.message ? (
            <p role="alert">{form.formState.errors.boardId.message}</p>
          ) : null}
          <ComposerFields boards={boards} form={form} />
        </div>
      )}
    </PortalForm>
  );
}
