import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { PostCustomFields } from "./post-custom-fields";

describe("PostCustomFields", () => {
  it("lists each answer with its label, and nothing without answers", () => {
    const view = renderComponent(
      <PostCustomFields
        fields={[
          { key: "plan", label: "Plan", value: "Pro", values: null },
          { key: "areas", label: "Areas", value: null, values: ["API", "UI"] },
          { key: "ok", label: "Agreed", value: true, values: null },
        ]}
      />,
    );
    expect(view.getByText("Plan").nextSibling).toHaveTextContent("Pro");
    expect(view.getByText("Areas").nextSibling).toHaveTextContent("API, UI");
    expect(view.getByText("Agreed").nextSibling).toHaveTextContent("Yes");
    const none = renderComponent(<PostCustomFields fields={[]} />);
    expect(none.container).toBeEmptyDOMElement();
  });
});
