import type { SetWorkflowCloseSpamResponse } from "./set-workflow-close-spam";
export const setWorkflowCloseSpamFixture = {
  ok: (overrides: Partial<SetWorkflowCloseSpamResponse> = {}) =>
    ({
      ...{ enabled: false },
      ...overrides,
    }) satisfies SetWorkflowCloseSpamResponse,
  problem: (status: 401 | 403 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
