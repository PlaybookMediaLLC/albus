import { z } from "@hono/zod-openapi";

export const apiErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "Human-readable description of the error.",
      example: "Task not found",
    }),
    code: z.string().openapi({
      description:
        "Stable UPPER_SNAKE_CASE code. Derived from the status unless a more specific code applies, such as VALIDATION_ERROR or MISSING_PERMISSION.",
      example: "NOT_FOUND",
    }),
    issues: z
      .array(
        z.object({
          path: z.string().openapi({
            description:
              "Dotted path to the invalid input, prefixed with the request part (body, query, params, header).",
            example: "body.title",
          }),
          message: z.string().openapi({ example: "Required" }),
          code: z.string().optional().openapi({
            description:
              "The validator's issue code, such as too_small, too_big, invalid_format or invalid_type. Translate from it rather than from message.",
            example: "too_small",
          }),
          origin: z.string().optional().openapi({
            description:
              "The kind of value the issue is about, such as string, number or array.",
            example: "string",
          }),
          minimum: z.number().optional().openapi({
            description:
              "For too_small: the smallest allowed length, size or value.",
            example: 1,
          }),
          maximum: z.number().optional().openapi({
            description:
              "For too_big: the largest allowed length, size or value.",
            example: 200,
          }),
        }),
      )
      .optional()
      .openapi({
        description: "Every validation issue, for VALIDATION_ERROR.",
      }),
    missingPermissions: z
      .array(z.string())
      .optional()
      .openapi({
        description:
          "Permissions the caller lacks for this route, as resource:action, for MISSING_PERMISSION and API_KEY_SCOPE.",
        example: ["task:update"],
      }),
  })
  .openapi("ApiError");
