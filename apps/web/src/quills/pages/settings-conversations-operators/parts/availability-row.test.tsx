import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { AvailabilityRow } from "./availability-row";

describe("AvailabilityRow", () => {
  it("shows no value until this page sets one, and says when the change fails", async () => {
    const error = vi.spyOn(toast, "error");
    mockApi().reply({ message: "Unavailable" }, 500);
    const view = renderComponent(<AvailabilityRow workspaceId="workspace_1" />);
    const online = view.getByRole("button", { name: "Online" });
    expect(online).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(online);
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "Your availability could not be changed.",
      ),
    );
    expect(online).toHaveAttribute("aria-pressed", "false");
  });
});
