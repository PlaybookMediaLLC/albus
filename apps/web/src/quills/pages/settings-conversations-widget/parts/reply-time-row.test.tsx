import { describe, expect, it, vi } from "vite-plus/test";
import { choose } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { ReplyTimeRow } from "./reply-time-row";

describe("ReplyTimeRow", () => {
  it("shows the stored reply time and saves none as no reply time", async () => {
    const onChange = vi.fn(async () => {});
    const view = renderComponent(
      <ReplyTimeRow value="day" disabled={false} onChange={onChange} />,
    );
    expect(
      view.getByRole("combobox", { name: "Reply time" }),
    ).toHaveTextContent("Within a day");
    // The page test chooses a reply time; this one hides the line.
    await choose("Reply time", "Do not show");
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
