import type { GetWorkflowCloseSpamResponse } from "./get-workflow-close-spam";
export const getWorkflowCloseSpamFixture = {
  ok: (overrides: Partial<GetWorkflowCloseSpamResponse> = {}) =>
    ({
      ...{ enabled: false },
      ...overrides,
    }) satisfies GetWorkflowCloseSpamResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
