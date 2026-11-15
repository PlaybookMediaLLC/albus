import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import type { PortalProblem } from "../core/types";
import { renderComponent } from "../test/render";
import { NameDialog } from "./name-dialog";

const render = (onSubmit: (name: string) => Promise<PortalProblem | void>) =>
  renderComponent(
    <NameDialog
      open
      onOpenChange={() => undefined}
      title="New tag"
      description="Tags sort posts."
      label="Name"
      maxLength={10}
      defaultValue=" "
      taken="A tag with this name exists."
      submitKey="settings-product.dialog.create"
      onSubmit={onSubmit}
    />,
  );

describe("NameDialog", () => {
  it("sends the trimmed name", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = render(onSubmit);
    const dialog = await view.findByRole("dialog", { name: "New tag" });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "  Ideas " },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("Ideas"));
  });

  it("checks the name before it sends it", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = render(onSubmit);
    const dialog = await view.findByRole("dialog", { name: "New tag" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Enter a name.",
    );
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "A very long name" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Use 10 characters or fewer.",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a conflict at the field", async () => {
    const view = render(async () => ({ kind: "conflict" }));
    const dialog = await view.findByRole("dialog", { name: "New tag" });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Ideas" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "A tag with this name exists.",
    );
  });

  it("shows a prefix and an API issue of its own path at the field", async () => {
    const view = renderComponent(
      <NameDialog
        open
        onOpenChange={() => undefined}
        title="Add domain"
        description="Use your own domain."
        label="Domain"
        prefix="https://"
        maxLength={253}
        issuePath="domain"
        submitKey="settings-workspace.domain.save"
        onSubmit={async () => ({
          kind: "invalid",
          issues: [{ path: "domain", message: "Use a public host name." }],
        })}
      />,
    );
    const dialog = await view.findByRole("dialog", { name: "Add domain" });
    expect(within(dialog).getByText("https://")).toBeVisible();
    const field = within(dialog).getByLabelText("Domain");
    fireEvent.change(field, { target: { value: "localhost" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(field).toHaveAttribute("aria-invalid", "true"));
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Use a public host name.",
    );
  });
});
