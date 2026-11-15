import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { SpamFilterForm } from "./spam-filter-form";

describe("SpamFilterForm", () => {
  describeFormContract<string[]>({
    render: (onSubmit) =>
      renderComponent(<SpamFilterForm senders={[]} onSubmit={onSubmit} />),
    fieldName: "Trusted senders",
    issuePath: "senders",
    submitName: "Save",
    validValue: "a.test, b@c.test",
    expectedValues: ["a.test", "b@c.test"],
    invalidValue: `${"a".repeat(321)}.test`,
  });
});
