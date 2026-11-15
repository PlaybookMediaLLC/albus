import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { LauncherForm, type LauncherValues } from "./launcher-form";

describe("LauncherForm", () => {
  describeFormContract<LauncherValues>({
    render: (onSubmit) =>
      renderComponent(
        <LauncherForm
          values={{ launcherLabel: "", launcherGreeting: "Hi" }}
          onSubmit={onSubmit}
        />,
      ),
    fieldName: "Launcher label",
    issuePath: "launcherLabel",
    submitName: "Save",
    validValue: "Help",
    expectedValues: { launcherLabel: "Help", launcherGreeting: "Hi" },
    invalidValue: "a".repeat(61),
  });
});
