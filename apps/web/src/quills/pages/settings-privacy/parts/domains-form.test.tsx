import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { DomainsForm } from "./domains-form";

describe("DomainsForm", () => {
  describeFormContract<string[]>({
    render: (onSubmit) =>
      renderComponent(<DomainsForm domains={[]} onSubmit={onSubmit} />),
    fieldName: "Allowed email domains",
    issuePath: "domains",
    submitName: "Save",
    validValue: "a.test, b.test",
    expectedValues: ["a.test", "b.test"],
    invalidValue: `${"a".repeat(254)}.test`,
  });
});
