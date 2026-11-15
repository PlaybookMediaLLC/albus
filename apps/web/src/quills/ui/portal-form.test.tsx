import { act, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { z } from "zod";
import { PortalForm } from "./portal-form";
import { renderComponent } from "../test/render";
import { advanceClock, fill, press } from "../test/actions";
import type { PortalProblem } from "../core/types";

function setup(
  onSubmit: (values: { message: string }) => Promise<PortalProblem | void>,
) {
  return renderComponent(
    <PortalForm
      schema={z.object({ message: z.string().min(1) })}
      defaultValues={{ message: "" }}
      submitKey="core.gallery.confirm"
      onSubmit={onSubmit}
    >
      {(form) => (
        <>
          <label htmlFor="message">Message</label>
          <input id="message" {...form.register("message")} />
          {form.formState.errors.message ? (
            <p role="alert">{form.formState.errors.message.message}</p>
          ) : null}
        </>
      )}
    </PortalForm>,
  );
}

describe("PortalForm", () => {
  afterEach(() => vi.useRealTimers());
  it("validates before sending and maps API field issues", async () => {
    const submit = vi.fn(async () => ({
      kind: "invalid" as const,
      issues: [{ path: "message", message: "Use a different message" }],
    }));
    const view = setup(submit);
    press(/confirm/i);
    await view.findByRole("alert");
    expect(submit).not.toHaveBeenCalled();
    fill("Message", "A draft");
    press(/confirm/i);
    expect(await view.findByText("Use a different message")).toBeVisible();
    expect(view.getByLabelText("Message")).toHaveValue("A draft");
  });
  it("preserves a draft after a rejected submission and retries only on explicit submit", async () => {
    const submit = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const view = setup(submit);
    fill("Message", "A draft");
    press(/confirm/i);
    await view.findByRole("alert");
    expect(view.getByLabelText("Message")).toHaveValue("A draft");
    expect(view.getByRole("button", { name: /confirm/i })).toBeDisabled();
    press("Try again");
    expect(submit).toHaveBeenCalledTimes(1);
    press(/confirm/i);
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
  });
  it("lets the user submit again after a conflict", async () => {
    const submit = vi
      .fn()
      .mockResolvedValueOnce({ kind: "conflict" })
      .mockResolvedValue(undefined);
    const view = setup(submit);
    fill("Message", "A draft");
    press(/confirm/i);
    await view.findByRole("alert");
    expect(view.getByRole("button", { name: /confirm/i })).toBeEnabled();
    press(/confirm/i);
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(view.queryByRole("alert")).toBeNull());
  });
  it("takes new stored values and keeps the fields that the user changed", async () => {
    const form = (values: { name: string; note: string }) => (
      <PortalForm
        schema={z.object({ name: z.string(), note: z.string() })}
        defaultValues={values}
        values={values}
        submitKey="core.gallery.confirm"
        onSubmit={async () => undefined}
      >
        {(form) => (
          <>
            <input aria-label="Name" {...form.register("name")} />
            <input aria-label="Note" {...form.register("note")} />
          </>
        )}
      </PortalForm>
    );
    const view = renderComponent(form({ name: "Ava", note: "Old" }));
    fill("Name", "Bob");
    view.rerender(form({ name: "Cy", note: "New" }));
    await waitFor(() => expect(view.getByLabelText("Note")).toHaveValue("New"));
    expect(view.getByLabelText("Name")).toHaveValue("Bob");
  });
  it("honors rate limits without resending or clearing the draft", async () => {
    vi.useFakeTimers();
    const submit = vi.fn(async () => ({
      kind: "rateLimited" as const,
      retryAt: Date.now() + 3000,
    }));
    const view = setup(submit);
    fill("Message", "A draft");
    await act(async () => press(/confirm/i));
    expect(view.getByRole("button", { name: /try again/i })).toBeDisabled();
    await advanceClock(3000);
    press("Try again");
    expect(submit).toHaveBeenCalledTimes(1);
    expect(view.getByLabelText("Message")).toHaveValue("A draft");
  });
  it("ignores duplicate submissions while a request is pending", async () => {
    let complete!: () => void;
    const submit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    const view = setup(submit);
    fill("Message", "A draft");
    const form = view.getByLabelText("Message").closest("form")!;
    await act(async () => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });
    expect(submit).toHaveBeenCalledTimes(1);
    await act(async () => complete());
  });
});

it("names an icon-only submit button and keeps footer controls in its row", async () => {
  const submit = vi.fn(async () => undefined);
  const view = renderComponent(
    <PortalForm
      schema={z.object({ message: z.string() })}
      defaultValues={{ message: "" }}
      submitKey="core.gallery.confirm"
      submitIcon={<svg aria-hidden="true" />}
      footer={() => <span>Footer control</span>}
      onSubmit={submit}
    >
      {() => null}
    </PortalForm>,
  );
  const button = view.getByRole("button", { name: "Confirm action" });
  expect(button).not.toHaveTextContent("Confirm action");
  expect(view.getByText("Footer control").parentElement).toContainElement(
    button,
  );
  press("Confirm action");
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ message: "" }));
});
