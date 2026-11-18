import { describe, expect, it, vi } from "vite-plus/test";
import { fill } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { KnowledgeDraft } from "./knowledge-draft";

describe("DraftChanges", () => {
  it("reports the text on screen after each edit, before any save", () => {
    const onChange = vi.fn();
    renderComponent(
      <KnowledgeDraft
        values={{ title: "Refunds", content: "Refunds take five days." }}
        audience="team"
        onAudienceChange={() => undefined}
        onSave={() => Promise.resolve()}
        onChange={onChange}
      />,
    );
    fill("Title", "Refund policy");
    expect(onChange).toHaveBeenLastCalledWith({
      title: "Refund policy",
      content: "Refunds take five days.",
    });
  });
});
