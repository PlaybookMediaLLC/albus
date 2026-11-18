import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { GroupedList } from "./grouped-list";

const groups = [
  { id: "high", label: "High", items: [{ id: "a", title: "Export fails" }] },
  { id: "low", label: "Low", items: [] },
  {
    id: "none",
    label: "No priority",
    items: [
      { id: "b", title: "Dark mode" },
      { id: "c", title: "Billing" },
    ],
  },
];

describe("GroupedList", () => {
  it("renders each group with a header and its count and leaves out empty groups", () => {
    const view = renderComponent(
      <GroupedList
        label="Conversations"
        groups={groups}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.title}</span>}
      />,
    );
    expect(view.getByRole("region", { name: "Conversations" })).toBeVisible();
    const high = view.getByRole("group", { name: "High 1" });
    expect(high).toHaveTextContent("Export fails");
    expect(
      view.getByRole("group", { name: "No priority 2" }),
    ).toHaveTextContent("Dark modeBilling");
    expect(view.queryByRole("group", { name: /Low/ })).toBeNull();
    expect(view.getAllByRole("listitem")).toHaveLength(3);
  });

  it("shows the icon of each group before its label", () => {
    const view = renderComponent(
      <GroupedList
        label="Requests"
        groups={groups}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.title}</span>}
        renderIcon={(group) => <svg aria-hidden="true" data-group={group.id} />}
      />,
    );
    const heading = view.getByRole("heading", { name: "High 1" });
    expect(heading.querySelector("[data-group=high]")).not.toBeNull();
  });
});
