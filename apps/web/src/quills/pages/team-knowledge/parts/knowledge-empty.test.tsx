import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { KnowledgeEmpty } from "./knowledge-empty";

describe("KnowledgeEmpty", () => {
  it("shows the drawing, the title and the body as a status", async () => {
    const view = renderComponent(<KnowledgeEmpty />);
    expect(await view.findByText("No suggestions here")).toBeVisible();
    expect(view.getByRole("status")).toHaveTextContent(
      "When the AI cannot answer a customer",
    );
    expect(view.container.querySelector("svg.art")).not.toBeNull();
  });
});
