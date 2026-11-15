import { describe, expect, it } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { LanguageForm, type LanguageValues } from "./language-form";

const empty: LanguageValues = {
  locale: "de",
  homepageTitle: "",
  homepageDescription: "",
  searchPlaceholder: "",
};

describe("LanguageForm", () => {
  describeFormContract<LanguageValues>({
    render: (onSubmit) =>
      renderComponent(
        <LanguageForm defaultValues={empty} onSubmit={onSubmit} />,
      ),
    fieldName: "Homepage title",
    issuePath: "homepageTitle",
    submitName: "Save",
    validValue: "Hilfe",
    invalidValue: "",
    expectedValues: { ...empty, homepageTitle: "Hilfe" },
  });

  it("shows the language select only when it adds a language", () => {
    const add = renderComponent(
      <LanguageForm
        defaultValues={empty}
        options={[{ value: "de", label: "German" }]}
        onSubmit={async () => undefined}
      />,
    );
    expect(add.getByRole("combobox", { name: "Language" })).toBeInTheDocument();
    add.unmount();
    const edit = renderComponent(
      <LanguageForm defaultValues={empty} onSubmit={async () => undefined} />,
    );
    expect(edit.queryByRole("combobox", { name: "Language" })).toBeNull();
  });
});
