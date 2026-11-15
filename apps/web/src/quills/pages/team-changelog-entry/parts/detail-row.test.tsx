import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { DetailRow } from "./detail-row";

describe("DetailRow", () => {
  it("shows the label and the control", () => {
    const view = renderComponent(
      <DetailRow icon={null} label="Author">
        <span>Grace</span>
      </DetailRow>,
    );
    expect(view.container).toHaveTextContent("AuthorGrace");
  });
});
