import { describe, expect, it, vi } from "vite-plus/test";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { renderComponent } from "../../../test/render";
import { LinkedTask, type LinkedTaskProps } from "./linked-task";

const router = createRouter({
  routeTree: createRootRoute(),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});
const task: LinkedTaskProps["task"] = {
  taskId: "task_csv",
  key: "WEB-12",
  title: "Build the CSV export",
  projectId: "project_web",
  columnName: "In progress",
  columnColor: "#f97316",
  done: false,
  assigneeName: "Ada",
  source: "rule",
};
const render = (props: Partial<LinkedTaskProps> = {}) =>
  renderComponent(
    <RouterContextProvider router={router}>
      <LinkedTask workspaceId="workspace_test_1" task={task} {...props} />
    </RouterContextProvider>,
  );

describe("LinkedTask", () => {
  it("links the key and title to the Kaneo task, with its column and assignee", () => {
    const view = render();
    expect(
      view.getByRole("link", { name: "WEB-12 Build the CSV export" }),
    ).toHaveAttribute(
      "href",
      "/dashboard/workspace/workspace_test_1/project/project_web/task/task_csv",
    );
    expect(view.getByText("In progress")).toBeVisible();
    expect(view.getByText("Assigned to Ada")).toBeVisible();
    expect(view.queryByRole("button")).toBeNull();
  });

  it("unlinks with the update permission", () => {
    const onUnlink = vi.fn();
    const view = render({ onUnlink });
    view.getByRole("button", { name: "Unlink Build the CSV export" }).click();
    expect(onUnlink).toHaveBeenCalledOnce();
  });
});
