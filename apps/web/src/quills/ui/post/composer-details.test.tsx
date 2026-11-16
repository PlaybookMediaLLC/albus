import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { ComposerDetails } from "./composer-details";

describe("ComposerDetails", () => {
  it("labels the field and asks for context in its placeholder", () => {
    const view = renderComponent(<ComposerDetails defaultValue="Monthly" />);
    const field = view.getByLabelText("Details");
    expect(field).toHaveValue("Monthly");
    expect(field).toHaveAttribute(
      "placeholder",
      "Say what you were trying to do, what got in the way, and how you work around it today.",
    );
  });
});
