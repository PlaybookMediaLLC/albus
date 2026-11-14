import { describe, expect, it } from "vite-plus/test";
import { mockApi } from "../../test/mock-api";
import { renderQuillsHook } from "../../test/render";
import { describeHookContract } from "../../test/contracts";
import { listImportRunsFixture } from "../../api/team/list-import-runs.fixture";
import { useListImportRuns } from "./use-list-import-runs";
describe("useListImportRuns", () => {
  describeHookContract({
    kind: "query",
    hook: useListImportRuns,
    operationId: "listQuillsImportRuns",
    request: { param: { workspaceId: "workspace_test_1" } },
    emptyRequest: { param: { workspaceId: "" } },
    response: listImportRunsFixture.ok(),
    viewer: { kind: "anonymous" },
    takesViewer: false,
    invalidates: [],
  });

  it("polls every 10 seconds only while a run waits or runs", () => {
    mockApi().defer(() => undefined);
    const view = renderQuillsHook(
      () =>
        useListImportRuns(
          { param: { workspaceId: "workspace_test_1" }, query: { limit: "5" } },
          { kind: "user", id: "user_test_1" },
        ),
      {},
    );
    const query = view.queryClient.getQueryCache().getAll()[0]!;
    const interval = (query.options as { refetchInterval?: unknown })
      .refetchInterval as (query: unknown) => unknown;
    const runs = (status: string) => ({
      state: { data: { items: [{ status: "completed" }, { status }] } },
    });
    expect(interval(runs("running"))).toBe(10_000);
    expect(interval(runs("completed"))).toBe(false);
    expect(interval({ state: {} })).toBe(false);
  });
});
