import type { SetWorkflowAbandonedAutoCloseResponse } from "./set-workflow-abandoned-auto-close";
export const setWorkflowAbandonedAutoCloseFixture = {
  ok: (overrides: Partial<SetWorkflowAbandonedAutoCloseResponse> = {}) =>
    ({
      ...{ enabled: false, waitMinutes: 1, keepIfEmailCaptured: false },
      ...overrides,
    }) satisfies SetWorkflowAbandonedAutoCloseResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
