import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { DomainForm, type DomainValues } from "./domain-form";

describe("DomainForm", () => {
  describeFormContract<DomainValues>({
    render: (onSubmit) => renderComponent(<DomainForm onSubmit={onSubmit} />),
    fieldName: "Domain",
    issuePath: "domain",
    submitName: "Save",
    validValue: "feedback.acme.com",
    invalidValue: " ",
    expectedValues: { domain: "feedback.acme.com" },
  });
});
