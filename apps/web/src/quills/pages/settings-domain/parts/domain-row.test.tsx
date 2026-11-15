import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import type { CustomDomain } from "../domain-status";
import { DomainRow, type DomainRowProps } from "./domain-row";

const pending: CustomDomain = {
  kind: "portal",
  domain: "feedback.acme.com",
  active: false,
  verifiedAt: null,
  checkedAt: null,
  checkResult: "missing",
  record: {
    type: "TXT",
    name: "_quills-verification.feedback.acme.com",
    value: "token123",
  },
};

const render = (props: Partial<DomainRowProps>) =>
  renderComponent(
    <DomainRow
      domain={pending}
      entitled
      manage
      onVerify={vi.fn(async () => undefined)}
      onRemove={vi.fn(async () => undefined)}
      {...props}
    />,
  );

describe("DomainRow", () => {
  it("shows the status and the TXT record of a domain that is not active", () => {
    const view = render({});
    expect(view.getByText("Record not found")).toBeInTheDocument();
    expect(view.getByRole("group", { name: "Name" })).toHaveTextContent(
      "_quills-verification.feedback.acme.com",
    );
    expect(view.getByRole("group", { name: "Value" })).toHaveTextContent(
      "token123",
    );
  });

  it("queues a DNS check", async () => {
    const success = vi.spyOn(toast, "success");
    const onVerify = vi.fn(async () => undefined);
    const view = render({ onVerify });
    fireEvent.click(view.getByRole("button", { name: "Check now" }));
    await waitFor(() => expect(success).toHaveBeenCalled());
    expect(onVerify).toHaveBeenCalledTimes(1);
  });

  it("locks the check without an active plan, but still allows the removal", async () => {
    const onRemove = vi.fn(async () => undefined);
    const view = render({ entitled: false, onRemove });
    expect(view.getByRole("button", { name: "Check now" })).toBeDisabled();
    fireEvent.click(
      view.getByRole("button", { name: "Actions for feedback.acme.com" }),
    );
    fireEvent.click(
      await view.findByRole("menuitem", { name: "Remove domain" }),
    );
    const dialog = await view.findByRole("alertdialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Remove domain" }),
    );
    await waitFor(() => expect(onRemove).toHaveBeenCalledTimes(1));
  });

  it("shows an active domain without the check and the record", () => {
    const view = render({ domain: { ...pending, active: true } });
    expect(view.getByText("Active")).toBeInTheDocument();
    expect(view.queryByRole("button", { name: "Check now" })).toBeNull();
    expect(view.queryByText("TXT record")).toBeNull();
  });

  it("has no actions without manage_settings", () => {
    const view = render({ manage: false });
    expect(view.queryByRole("button", { name: "Check now" })).toBeNull();
    expect(
      view.queryByRole("button", { name: "Actions for feedback.acme.com" }),
    ).toBeNull();
  });
});
