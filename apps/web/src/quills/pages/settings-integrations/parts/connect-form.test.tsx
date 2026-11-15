import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { fill, press } from "../../../test/actions";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { ConnectForm } from "./connect-form";

const fields = [
  {
    name: "url",
    labelKey: "settings-connections.integrations.fields.url",
  },
  {
    name: "token",
    labelKey: "settings-connections.integrations.fields.token",
    secret: true,
    optional: true,
  },
];

describe("ConnectForm", () => {
  describeFormContract<Record<string, string>>({
    render: (onSubmit) =>
      renderComponent(
        <ConnectForm fields={fields.slice(0, 1)} onSubmit={onSubmit} />,
      ),
    fieldName: "Topic URL",
    issuePath: "url",
    submitName: "Connect",
    validValue: "https://ntfy.example.test/topic",
    invalidValue: " ",
    expectedValues: { url: "https://ntfy.example.test/topic" },
  });

  it("asks for each required value, hides secrets and sends the trimmed values", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = renderComponent(
      <ConnectForm fields={fields} onSubmit={onSubmit} />,
    );
    expect(view.getByLabelText(/Access token/)).toHaveAttribute(
      "type",
      "password",
    );
    expect(view.getByText("(optional)")).toBeVisible();
    press("Connect");
    expect(await view.findByText("Enter a value.")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
    fill("Topic URL", " https://ntfy.example.test/topic ");
    press("Connect");
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        url: "https://ntfy.example.test/topic",
        token: "",
      }),
    );
  });

  it("shows the field problems that the API returns", async () => {
    const view = renderComponent(
      <ConnectForm
        fields={fields.slice(0, 1)}
        onSubmit={async () => ({
          kind: "invalid",
          issues: [{ path: "url", message: "Use a public address." }],
        })}
      />,
    );
    fireEvent.change(view.getByLabelText("Topic URL"), {
      target: { value: "http://10.0.0.1" },
    });
    press("Connect");
    expect(await view.findByText("Use a public address.")).toBeVisible();
  });
});
