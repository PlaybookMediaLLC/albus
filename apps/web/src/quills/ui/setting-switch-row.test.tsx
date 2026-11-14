import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../test/render";
import { SettingSwitchRow } from "./setting-switch-row";
import { toast } from "./upstream";

const render = (props: Partial<Parameters<typeof SettingSwitchRow>[0]>) =>
  renderComponent(
    <SettingSwitchRow
      title="Public roadmap"
      description="Show the roadmap in the portal."
      checked={false}
      onCheckedChange={async () => undefined}
      {...props}
    />,
  );

describe("SettingSwitchRow", () => {
  it("moves the switch at once and saves the new value", async () => {
    let finish!: () => void;
    const onCheckedChange = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const view = render({ onCheckedChange });
    const control = view.getByRole("switch", { name: "Public roadmap" });
    fireEvent.click(control);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control).toBeChecked();
    expect(control).toHaveAttribute("aria-disabled", "true");
    finish();
    await waitFor(() => expect(control).not.toHaveAttribute("aria-disabled"));
  });

  it("moves the switch back and shows the problem when the save fails", async () => {
    const error = vi.spyOn(toast, "error");
    const view = render({
      onCheckedChange: () => Promise.reject({ kind: "noAccess" }),
    });
    const control = view.getByRole("switch", { name: "Public roadmap" });
    fireEvent.click(control);
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "You do not have permission to change this setting.",
      ),
    );
    expect(control).not.toBeChecked();
  });

  it("shows the lock reason and keeps a locked switch disabled", () => {
    const onCheckedChange = vi.fn(async () => undefined);
    const view = render({ locked: "Needs an active plan", onCheckedChange });
    expect(
      view.getByRole("img", { name: "Needs an active plan" }),
    ).toBeVisible();
    const control = view.getByRole("switch", { name: "Public roadmap" });
    expect(control).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(control);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
