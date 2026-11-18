import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, it, vi } from "vite-plus/test";
import updateTask from "@/fetchers/task/update-task";
import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";
import { useUpdateTask } from "./use-update-task";

vi.mock("@/fetchers/task/update-task", () => ({ default: vi.fn() }));

const task: Task = {
  id: "t1",
  title: "Old",
  number: 1,
  description: null,
  status: "to-do",
  priority: null,
  startDate: null,
  dueDate: null,
  position: 0,
  createdAt: "2026-08-31T00:00:00.000Z",
  userId: null,
  assigneeId: null,
  assigneeName: null,
  projectId: "p",
};
const board = {
  id: "p",
  columns: [
    { id: "to-do", slug: "to-do", tasks: [task] },
    { id: "done", slug: "done", tasks: [] },
  ],
  plannedTasks: [],
  archivedTasks: [],
} as unknown as ProjectWithTasks;

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient();
  client.setQueryData(["tasks", "p"], board);
});
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

async function save(next: Task) {
  vi.mocked(updateTask).mockResolvedValue(next as never);
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const { result } = renderHook(() => useUpdateTask(), { wrapper });
  await act(() => result.current.mutateAsync(next));
  return invalidate.mock.calls.map(([filters]) => filters?.queryKey);
}

it("patches the card without reloading the board when the status is unchanged", async () => {
  const keys = await save({ ...task, startDate: "2026-09-01" });
  expect(keys).not.toContainEqual(["tasks", "p"]);
  expect(
    client.getQueryData<ProjectWithTasks>(["tasks", "p"])?.columns[0].tasks[0]
      .startDate,
  ).toBe("2026-09-01");
});

it("reloads the board when the status changed", async () => {
  const keys = await save({ ...task, status: "done" });
  expect(keys).toContainEqual(["tasks", "p"]);
});
