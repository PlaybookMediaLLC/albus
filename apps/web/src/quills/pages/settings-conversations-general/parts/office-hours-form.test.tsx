import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { weekRows, type DayRow } from "../week";
import { OfficeHoursForm } from "./office-hours-form";

const intervals = [{ day: 1, start: "09:00", end: "17:00" }];
const days = weekRows(intervals);

describe("OfficeHoursForm", () => {
  describeFormContract<{ timezone: string; days: DayRow[] }>({
    render: (onSubmit) =>
      renderComponent(
        <OfficeHoursForm
          timezone="UTC"
          intervals={intervals}
          onSubmit={onSubmit}
        />,
      ),
    fieldName: "Monday closes",
    issuePath: "days.0.end",
    submitName: "Save",
    validValue: "18:00",
    expectedValues: {
      timezone: "UTC",
      days: [{ ...days[0]!, end: "18:00" }, ...days.slice(1)],
    },
    // An open day that closes when it opens.
    invalidValue: "09:00",
  });

  it("shows a field error for an opening time that is not HH:MM", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = renderComponent(
      <OfficeHoursForm
        timezone="UTC"
        intervals={intervals}
        onSubmit={onSubmit}
      />,
    );
    const opens = view.getByLabelText("Monday opens");
    fireEvent.change(opens, { target: { value: "" } });
    fireEvent.click(view.getByRole("button", { name: "Save" }));
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Enter a time as HH:MM, such as 09:00.",
    );
    expect(opens).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
