import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { AddressForm, type AddressValues } from "./address-form";

describe("AddressForm", () => {
  describeFormContract<AddressValues>({
    render: (onSubmit) => renderComponent(<AddressForm onSubmit={onSubmit} />),
    fieldName: "Address",
    issuePath: "address",
    submitName: "Add",
    validValue: "help@example.test",
    expectedValues: { address: "help@example.test", module: "support" },
    invalidValue: "help",
  });
});
