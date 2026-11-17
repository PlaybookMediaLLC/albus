import type { SetBoardDeliveryResponse } from "./set-board-delivery";
export const setBoardDeliveryFixture = {
  ok: (overrides: Partial<SetBoardDeliveryResponse> = {}) =>
    ({
      ...{
        projectId: "project_id_test_1",
        columnId: null,
        priority: "no-priority",
        triggerStatusId: null,
      },
      ...overrides,
    }) satisfies SetBoardDeliveryResponse,
  problem: (status: 401 | 403 | 404 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
