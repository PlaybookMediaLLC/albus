import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { CollectCard } from "./collect-card";

afterEach(() => vi.unstubAllGlobals());

describe("CollectCard", () => {
  it("copies and opens the portal URL", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const url = "https://feedback.acme.test";
    const view = renderComponent(<CollectCard workspace="Acme" url={url} />);
    expect(view.getByText("The Acme board is live")).toBeInTheDocument();
    expect(view.getByRole("link", { name: "Visit" })).toHaveAttribute(
      "href",
      url,
    );
    fireEvent.click(view.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(url));
  });
});
