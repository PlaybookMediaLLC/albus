import type { ClearBoardDeliveryResponse } from "./clear-board-delivery";
export const clearBoardDeliveryFixture = {
  ok: (overrides: Partial<ClearBoardDeliveryResponse> = {}) =>
    ({
      ...{ changed: false },
      ...overrides,
    }) satisfies ClearBoardDeliveryResponse,
  problem: (status: 401 | 403 | 404 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
