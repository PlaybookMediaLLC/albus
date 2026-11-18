import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../test/render";
import { EmptyState } from "./empty-state";
import { RequestsArt } from "./illustrations/requests-art";

describe("EmptyState", () => {
  it("shows the drawing, title, body, hint and actions as one status", () => {
    const view = renderComponent(
      <EmptyState
        art={<RequestsArt />}
        title="No requests yet"
        description="Requests from the portal land here."
        hint={{ keys: ["F"], label: "Change the filters" }}
        actions={<button type="button">New request</button>}
      />,
    );
    const status = view.getByRole("status");
    expect(status).toHaveTextContent("No requests yet");
    expect(status).toHaveTextContent("Requests from the portal land here.");
    expect(status).toHaveTextContent("Change the filters");
    expect(status.querySelector("kbd")).toHaveTextContent("F");
    expect(view.getByRole("button", { name: "New request" })).toBeVisible();
    expect(status.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("leaves out the parts it is not given", () => {
    const view = renderComponent(<EmptyState title="Nothing matches" />);
    expect(view.getByRole("status")).toHaveTextContent("Nothing matches");
    expect(view.queryByRole("button")).toBeNull();
    expect(view.container.querySelector("svg")).toBeNull();
  });
});
