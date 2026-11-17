import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../test/actions";
import { renderComponent } from "../../test/render";
import { WidgetLinkPrompt } from "./widget-link-prompt";

const props = {
  workspaceName: "Acme",
  answer: null,
  onConfirm: vi.fn(async () => {}),
  onDecline: vi.fn(async () => {}),
};

describe("WidgetLinkPrompt", () => {
  it("asks before it links, naming the workspace", () => {
    const view = renderComponent(<WidgetLinkPrompt {...props} />);
    expect(
      view.getByRole("region", {
        name: "Link your activity from the support widget?",
      }),
    ).toHaveTextContent("Acme support widget");
    expect(
      view.getByRole("button", { name: "Link my activity" }),
    ).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "This wasn't me" }),
    ).toBeInTheDocument();
  });

  it("reports the answer instead of asking again", () => {
    const linked = renderComponent(
      <WidgetLinkPrompt {...props} answer="linked" />,
    );
    expect(linked.getByRole("status")).toHaveTextContent(
      "Your activity from the support widget is now in the portal.",
    );
    expect(linked.queryByRole("button")).toBeNull();
    linked.unmount();
    const declined = renderComponent(
      <WidgetLinkPrompt {...props} answer="declined" />,
    );
    expect(declined.getByRole("status")).toHaveTextContent(
      "Nothing was linked.",
    );
  });

  it("calls the confirm and decline callbacks", async () => {
    const onConfirm = vi.fn(async () => {});
    const onDecline = vi.fn(async () => {});
    renderComponent(
      <WidgetLinkPrompt
        {...props}
        onConfirm={onConfirm}
        onDecline={onDecline}
      />,
    );
    press("Link my activity");
    await vi.waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    press("This wasn't me");
    await vi.waitFor(() => expect(onDecline).toHaveBeenCalledTimes(1));
  });
});
