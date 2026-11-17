import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { VoiceForm, type VoiceValues } from "./voice-form";

const values: VoiceValues = {
  name: "Ava",
  tone: "friendly",
  responseLength: "concise",
  additionalInstructions: "",
  productDescription: "",
};

describe("VoiceForm", () => {
  describeFormContract<VoiceValues>({
    render: (onSubmit) =>
      renderComponent(<VoiceForm values={values} onSubmit={onSubmit} />),
    fieldName: "Name",
    issuePath: "name",
    submitName: "Save",
    validValue: "Juno",
    expectedValues: { ...values, name: "Juno" },
    invalidValue: "",
  });
});
