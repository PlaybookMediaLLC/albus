import type { RotateWidgetSecretResponse } from "./rotate-widget-secret";
export const rotateWidgetSecretFixture = {
  ok: (overrides: Partial<RotateWidgetSecretResponse> = {}) =>
    ({
      ...{ secret: "value" },
      ...overrides,
    }) satisfies RotateWidgetSecretResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
