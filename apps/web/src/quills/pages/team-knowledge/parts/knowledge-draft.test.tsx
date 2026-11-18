import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { fill, press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { KnowledgeDraft } from "./knowledge-draft";

describe("KnowledgeDraft", () => {
  it("saves the edited draft and changes the audience", async () => {
    const onSave = vi.fn(() => Promise.resolve());
    const onAudienceChange = vi.fn();
    const view = renderComponent(
      <KnowledgeDraft
        values={{ title: "Refunds", content: "Refunds take five days." }}
        audience="team"
        onAudienceChange={onAudienceChange}
        onSave={onSave}
        onChange={() => undefined}
      />,
    );
    expect(
      view.getByRole("radio", { name: "Teammates and the copilot" }),
    ).toBeChecked();
    fireEvent.click(
      view.getByRole("radio", { name: "Also the customer agent" }),
    );
    expect(onAudienceChange).toHaveBeenCalledWith("public");
    fill("Title", "Refund policy");
    press("Save draft");
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        title: "Refund policy",
        content: "Refunds take five days.",
      }),
    );
  });

  it("refuses an empty title", async () => {
    const onSave = vi.fn(() => Promise.resolve());
    const view = renderComponent(
      <KnowledgeDraft
        values={{ title: "Refunds", content: "Refunds take five days." }}
        audience="team"
        onAudienceChange={() => undefined}
        onSave={onSave}
        onChange={() => undefined}
      />,
    );
    fill("Title", " ");
    press("Save draft");
    expect(await view.findByRole("alert")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
