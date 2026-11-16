import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { EmojiButton } from "./emoji-button";

describe("EmojiButton", () => {
  it("picks an emoji and closes", async () => {
    const onPick = vi.fn();
    const view = renderComponent(<EmojiButton onPick={onPick} />);
    press("Add emoji");
    fireEvent.click(await view.findByRole("button", { name: "Insert 🎉" }));
    expect(onPick).toHaveBeenCalledWith("🎉");
    await vi.waitFor(() =>
      expect(view.queryByRole("button", { name: "Insert 🎉" })).toBeNull(),
    );
  });
});
