import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { EmojiMenu } from "./emoji-menu";

describe("EmojiMenu", () => {
  it("reports the chosen emoji", async () => {
    const onPick = vi.fn();
    const view = renderComponent(<EmojiMenu onPick={onPick} />);
    fireEvent.click(view.getByRole("button", { name: "Add an emoji" }));
    fireEvent.click(await view.findByRole("menuitem", { name: "Insert 🎉" }));
    expect(onPick).toHaveBeenCalledWith("🎉");
  });
});
