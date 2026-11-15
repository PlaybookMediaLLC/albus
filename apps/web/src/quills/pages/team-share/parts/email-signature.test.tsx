import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { EmailSignature } from "./email-signature";

afterEach(() => vi.unstubAllGlobals());

describe("EmailSignature", () => {
  it("previews the signature and copies its plain text", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const view = renderComponent(
      <EmailSignature
        workspace="Acme"
        url="https://a.test"
        user={{ name: "Ada" }}
      />,
    );
    expect(view.getByText("Ada from Acme")).toBeInTheDocument();
    fireEvent.click(view.getByRole("button", { name: "Copy snippet" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "Ada from Acme\nDo you have feedback about Acme?\nShare your feedback → https://a.test",
      ),
    );
  });
});
