import { describe, expect, it, vi } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { DeliveryForm, type DeliveryValues } from "./delivery-form";

const statuses = [
  { id: "status_open", name: "Open" },
  { id: "status_planned", name: "Planned" },
];
const projects = [{ id: "project_web", name: "Web" }];
const trigger =
  "When a teammate moves a request to this status, create a task as them";

describe("DeliveryForm", () => {
  // The column list of the project is Kaneo's own read.
  mockApi();
  describeFormContract<DeliveryValues>({
    render: (onSubmit) =>
      renderComponent(
        <DeliveryForm
          projects={projects}
          delivery={null}
          statuses={statuses}
          onSubmit={onSubmit}
          onRemove={vi.fn()}
        />,
      ),
    fieldName: trigger,
    issuePath: "triggerStatusId",
    submitName: "Save delivery",
    select: true,
    validValue: "Planned",
    expectedValues: {
      projectId: "project_web",
      columnId: null,
      priority: "medium",
      triggerStatusId: "status_planned",
    },
  });

  it("starts with the rule off, says it does not change who sees the board, and removes a saved project", () => {
    const onRemove = vi.fn();
    const blank = renderComponent(
      <DeliveryForm
        projects={projects}
        delivery={null}
        statuses={statuses}
        onSubmit={vi.fn()}
        onRemove={onRemove}
      />,
    );
    expect(blank.getByRole("combobox", { name: trigger })).toHaveTextContent(
      "Do not create tasks",
    );
    expect(
      blank.getByText(/It does not change who sees the board/),
    ).toBeVisible();
    expect(
      blank.queryByRole("button", { name: "Remove delivery project" }),
    ).toBeNull();
    blank.unmount();
    const saved = renderComponent(
      <DeliveryForm
        projects={projects}
        delivery={{
          projectId: "project_web",
          columnId: null,
          priority: "high",
          triggerStatusId: "status_planned",
        }}
        statuses={statuses}
        onSubmit={vi.fn()}
        onRemove={onRemove}
      />,
    );
    saved.getByRole("button", { name: "Remove delivery project" }).click();
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
