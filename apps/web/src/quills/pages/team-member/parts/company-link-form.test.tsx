import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { CompanyLinkForm } from "./company-link-form";

describe("CompanyLinkForm", () => {
  describeFormContract({
    render: (onSubmit) =>
      renderComponent(
        <CompanyLinkForm onSubmit={(name) => onSubmit({ name } as never)} />,
      ),
    fieldName: "Company name",
    issuePath: "name",
    submitName: "Save company",
    validValue: "Northwind",
    invalidValue: "   ",
    expectedValues: { name: "Northwind" },
  });
});
