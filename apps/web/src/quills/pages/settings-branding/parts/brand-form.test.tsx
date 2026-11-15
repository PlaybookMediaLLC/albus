import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { BrandForm, type BrandValues } from "./brand-form";

describe("BrandForm", () => {
  describeFormContract<BrandValues>({
    render: (onSubmit) =>
      renderComponent(
        <BrandForm
          workspaceId="workspace_1"
          name="Acme"
          headerDisplayName={null}
          logoUrl={null}
          onLogoChanged={async () => undefined}
          onSubmit={onSubmit}
        />,
      ),
    fieldName: "Brand name",
    issuePath: "headerDisplayName",
    submitName: "Save",
    validValue: "Acme Feedback",
    invalidValue: "x".repeat(101),
    expectedValues: { headerDisplayName: "Acme Feedback" },
  });
});
