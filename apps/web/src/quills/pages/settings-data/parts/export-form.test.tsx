import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { ExportForm, type ExportValues } from "./export-form";

describe("ExportForm", () => {
  describeFormContract<ExportValues>({
    render: (onSubmit) => renderComponent(<ExportForm onSubmit={onSubmit} />),
    fieldName: "Data",
    select: true,
    issuePath: "kind",
    submitName: "Start export",
    validValue: "People",
    expectedValues: { kind: "users" },
  });
});
