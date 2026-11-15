import type { GetWidgetSecretResponse } from "./get-widget-secret";
export const getWidgetSecretFixture = {
  ok: (overrides: Partial<GetWidgetSecretResponse> = {}) =>
    ({ ...{ secret: null }, ...overrides }) satisfies GetWidgetSecretResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
