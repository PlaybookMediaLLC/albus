import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { AwayReplyForm, type AwayReplyValues } from "./away-reply-form";

const values: AwayReplyValues = { message: "We reply in the morning." };

describe("AwayReplyForm", () => {
  describeFormContract<AwayReplyValues>({
    render: (onSubmit) =>
      renderComponent(<AwayReplyForm values={values} onSubmit={onSubmit} />),
    fieldName: "Away message",
    issuePath: "message",
    submitName: "Save",
    validValue: "Back at 9:00.",
    expectedValues: { message: "Back at 9:00." },
    invalidValue: "",
  });
});
