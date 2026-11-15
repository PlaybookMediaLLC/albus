import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { ForwardingForm } from "./forwarding-form";

describe("ForwardingForm", () => {
  describeFormContract<string>({
    render: (onSubmit) =>
      renderComponent(<ForwardingForm target={null} onSubmit={onSubmit} />),
    fieldName: "Forward a copy to",
    issuePath: "forwardingTarget",
    submitName: "Save",
    validValue: "team@example.test",
    expectedValues: "team@example.test",
    invalidValue: "not an address",
  });
});
