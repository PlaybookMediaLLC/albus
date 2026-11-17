import { describe, expect, it, vi } from "vite-plus/test";
import { fill, press } from "../../../test/actions";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { CompanyRevenueForm } from "./company-revenue-form";

describe("CompanyRevenueForm", () => {
  describeFormContract({
    // The contract checks the form's values; the part turns them into cents for the caller.
    render: (onSubmit) =>
      renderComponent(
        <CompanyRevenueForm
          mrrCents={null}
          onSubmit={(cents) =>
            onSubmit({ mrr: cents === null ? null : cents / 100 } as never)
          }
        />,
      ),
    fieldName: "Company monthly revenue",
    issuePath: "mrr",
    submitName: "Save revenue",
    validValue: "1250.5",
    invalidValue: "-1",
    expectedValues: { mrr: 1250.5 },
  });

  it("sends cents, and refuses an amount with a comma or three decimals", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = renderComponent(
      <CompanyRevenueForm mrrCents={125050} onSubmit={onSubmit} />,
    );
    expect(view.getByLabelText("Company monthly revenue")).toHaveValue(
      "1250.5",
    );
    fill("Company monthly revenue", "1,250");
    press("Save revenue");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Enter an amount such as 1250.50.",
    );
    fill("Company monthly revenue", "10.999");
    press("Save revenue");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "Enter an amount such as 1250.50.",
    );
    fill("Company monthly revenue", "2000");
    press("Save revenue");
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledWith(200000));
  });
});
