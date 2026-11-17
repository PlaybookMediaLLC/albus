import { fireEvent } from "@testing-library/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vite-plus/test";
import type { PublicField, RawFieldValue } from "../../core/composer-fields";
import { renderComponent } from "../../test/render";
import { ComposerFields } from "./composer-fields";

type Values = {
  boardId?: string;
  customFields?: Record<string, RawFieldValue>;
};
let read: () => Values = () => ({});

function Fields({ fields }: { fields: PublicField[] }) {
  const form = useForm<Values>({
    defaultValues: { boardId: "b1", customFields: {} },
  });
  useEffect(() => {
    read = form.getValues;
  });
  return (
    <ComposerFields boards={[{ id: "b1", fields }, { id: "b2" }]} form={form} />
  );
}

describe("ComposerFields", () => {
  it("renders an input for each type and keeps the raw values", () => {
    const view = renderComponent(
      <Fields
        fields={[
          { key: "seats", label: "Seats", type: "number", required: true },
          { key: "due", label: "Due", type: "date", required: false },
          {
            key: "areas",
            label: "Areas",
            type: "multi_select",
            required: false,
            options: ["API", "UI"],
          },
          { key: "ok", label: "I agree", type: "checkbox", required: false },
        ]}
      />,
    );
    fireEvent.change(view.getByLabelText("Seats (required)"), {
      target: { value: "3" },
    });
    fireEvent.change(view.getByLabelText("Due"), {
      target: { value: "2026-12-01" },
    });
    fireEvent.click(view.getByRole("checkbox", { name: "UI" }));
    fireEvent.click(view.getByRole("checkbox", { name: "I agree" }));
    expect(read().customFields).toEqual({
      seats: "3",
      due: "2026-12-01",
      areas: ["UI"],
      ok: true,
    });
  });

  it("renders nothing for a board without fields", () => {
    const view = renderComponent(<Fields fields={[]} />);
    expect(view.container).toBeEmptyDOMElement();
  });
});
