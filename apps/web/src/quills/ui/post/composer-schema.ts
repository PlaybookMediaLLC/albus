import { z } from "zod";
import {
  missingFields,
  type PublicField,
  type RawFieldValue,
} from "../../core/composer-fields";

/** The public custom fields of one of the composer's boards. */
export const fieldsOfBoard = (
  boards: ReadonlyArray<{ id: string; fields?: readonly PublicField[] }>,
  boardId?: string,
) => boards.find((board) => board.id === boardId)?.fields ?? [];

/**
 * The composer's form schema: a title, details, and the chosen board's required custom fields
 * (issue #71). The messages come from the caller, so this module needs no translation.
 */
export function composerSchema(options: {
  titleRequired: string;
  boards: ReadonlyArray<{ id: string; fields?: readonly PublicField[] }>;
  fieldRequired: (label: string) => string;
}) {
  return z
    .object({
      boardId: z.string().optional(),
      title: z.string().trim().min(1, options.titleRequired).max(200),
      content: z.string().trim().max(10000),
      customFields: z.record(z.string(), z.any()).optional(),
    })
    .superRefine(requireFields(options.boards, options.fieldRequired));
}

/** A form check: an issue for each required field of the chosen board that has no value. */
export const requireFields =
  (
    boards: ReadonlyArray<{ id: string; fields?: readonly PublicField[] }>,
    fieldRequired: (label: string) => string,
  ) =>
  (
    values: { boardId?: string; customFields?: Record<string, RawFieldValue> },
    ctx: z.RefinementCtx,
  ) => {
    for (const field of missingFields(
      fieldsOfBoard(boards, values.boardId),
      values.customFields,
    ))
      ctx.addIssue({
        code: "custom",
        path: ["customFields", field.key],
        message: fieldRequired(field.label),
      });
  };
