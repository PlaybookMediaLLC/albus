import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { DomainSection, type DomainSectionProps } from "./domain-section";

const render = (props: Partial<DomainSectionProps>) =>
  renderComponent(
    <DomainSection
      title="Custom domain"
      note="A note"
      defaultAddress="kaneo.test/portal/workspace_1"
      domain={null}
      entitled
      manage
      onSet={vi.fn()}
      onVerify={vi.fn()}
      onRemove={vi.fn()}
      {...props}
    />,
  );

describe("DomainSection", () => {
  it("shows the default address and offers a custom domain", () => {
    const view = render({});
    expect(view.getByText("kaneo.test/portal/workspace_1")).toBeInTheDocument();
    expect(view.getByText("A note")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Add domain" })).toBeEnabled();
  });

  it("hides Add domain while a domain is set and without manage_settings", () => {
    const set = render({
      domain: {
        kind: "portal",
        domain: "feedback.acme.com",
        active: true,
        verifiedAt: "2026-11-01T00:00:00.000Z",
        checkedAt: "2026-11-01T00:00:00.000Z",
        checkResult: "verified",
        record: { type: "TXT", name: "_quills-verification", value: "v" },
      },
    });
    expect(set.getByText("feedback.acme.com")).toBeInTheDocument();
    expect(set.queryByRole("button", { name: "Add domain" })).toBeNull();
    set.unmount();
    const reader = render({ manage: false });
    expect(reader.queryByRole("button", { name: "Add domain" })).toBeNull();
  });
});
