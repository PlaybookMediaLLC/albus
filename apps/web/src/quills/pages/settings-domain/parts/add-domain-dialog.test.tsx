import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { AddDomainDialog } from "./add-domain-dialog";

const submit = async (
  view: ReturnType<typeof renderComponent>,
  domain: string,
) => {
  fireEvent.click(view.getByRole("button", { name: "Add domain" }));
  const dialog = await view.findByRole("dialog", { name: "Add domain" });
  fireEvent.change(within(dialog).getByLabelText("Domain"), {
    target: { value: domain },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
  return dialog;
};

describe("AddDomainDialog", () => {
  it("sets the domain and closes", async () => {
    const onSet = vi.fn(async () => undefined);
    const view = renderComponent(
      <AddDomainDialog locked={false} onSet={onSet} />,
    );
    await submit(view, "feedback.acme.com");
    await waitFor(() =>
      expect(onSet).toHaveBeenCalledWith("feedback.acme.com"),
    );
    await waitFor(() =>
      expect(view.queryByRole("dialog", { name: "Add domain" })).toBeNull(),
    );
  });

  it("shows a domain that is in use as a field error and keeps the dialog open", async () => {
    const view = renderComponent(
      <AddDomainDialog
        locked={false}
        onSet={() => Promise.reject({ kind: "conflict" })}
      />,
    );
    const dialog = await submit(view, "feedback.acme.com");
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "This domain is already in use.",
    );
    expect(within(dialog).getByLabelText("Domain")).toHaveValue(
      "feedback.acme.com",
    );
  });

  it("closes with Cancel and sends nothing", async () => {
    const onSet = vi.fn(async () => undefined);
    const view = renderComponent(
      <AddDomainDialog locked={false} onSet={onSet} />,
    );
    fireEvent.click(view.getByRole("button", { name: "Add domain" }));
    const dialog = await view.findByRole("dialog", { name: "Add domain" });
    expect(within(dialog).getByText("https://")).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(view.queryByRole("dialog", { name: "Add domain" })).toBeNull(),
    );
    expect(onSet).not.toHaveBeenCalled();
  });

  it("shows an API issue of the domain at the field", async () => {
    const view = renderComponent(
      <AddDomainDialog
        locked={false}
        onSet={() =>
          Promise.reject({
            kind: "invalid",
            issues: [{ path: "domain", message: "Use a public host name." }],
          })
        }
      />,
    );
    const dialog = await submit(view, "localhost");
    await waitFor(() =>
      expect(within(dialog).getByLabelText("Domain")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
  });

  it("locks the button without an active plan", () => {
    const view = renderComponent(<AddDomainDialog locked onSet={vi.fn()} />);
    expect(view.getByRole("button", { name: "Add domain" })).toBeDisabled();
    expect(
      view.getByRole("img", { name: "Needs an active plan" }),
    ).toBeInTheDocument();
  });
});
