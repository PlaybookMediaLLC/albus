// Bad variants exist to prove the API refuses them (403) and the widget falls back to anonymous.
export const TOKEN_VARIANTS = [
  "valid",
  "bad-signature",
  "expired",
  "no-sub",
  "no-email",
] as const;
export type TokenVariant = (typeof TOKEN_VARIANTS)[number];
