import type { TFunction } from "i18next";

/**
 * A field error in the portal's language, from zod's issue code and bounds: a client check's issue,
 * or the same fields of an API issue. zod's own English never reaches the page.
 */
export function validationMessage(
  t: TFunction,
  issue: {
    code?: string;
    origin?: string;
    minimum?: unknown;
    maximum?: unknown;
  },
): string {
  if (issue.code === "too_small" && issue.origin === "string")
    return Number(issue.minimum) <= 1
      ? t("core.validation.required")
      : t("core.validation.tooShort", { min: Number(issue.minimum) });
  if (issue.code === "too_big" && issue.origin === "string")
    return t("core.validation.tooLong", { max: Number(issue.maximum) });
  if (issue.code === "invalid_format") return t("core.validation.format");
  return t("core.validation.invalid");
}
