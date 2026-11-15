import type { GetWorkflowAbandonedAutoCloseResponse } from "./get-workflow-abandoned-auto-close";
export const getWorkflowAbandonedAutoCloseFixture = {
  ok: (overrides: Partial<GetWorkflowAbandonedAutoCloseResponse> = {}) =>
    ({
      ...{ enabled: false, waitMinutes: 1, keepIfEmailCaptured: false },
      ...overrides,
    }) satisfies GetWorkflowAbandonedAutoCloseResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
