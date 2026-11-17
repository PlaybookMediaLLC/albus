import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { ComposerTitle } from "./composer-title";

describe("ComposerTitle", () => {
  it("is a labelled title field that names the workspace", () => {
    const view = renderComponent(
      <ComposerTitle workspaceName="Acme" defaultValue="CSV" />,
    );
    const field = view.getByLabelText("Title");
    expect(field).toHaveValue("CSV");
    expect(field).toHaveAttribute(
      "placeholder",
      "What would make Acme better?",
    );
  });
});
