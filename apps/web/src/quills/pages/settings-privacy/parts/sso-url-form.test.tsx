import { describe } from "vite-plus/test";
import { describeFormContract } from "../../../test/contracts";
import { renderComponent } from "../../../test/render";
import { SsoUrlForm } from "./sso-url-form";

describe("SsoUrlForm", () => {
  describeFormContract<string>({
    render: (onSubmit) =>
      renderComponent(<SsoUrlForm ssoUrl={null} onSubmit={onSubmit} />),
    fieldName: "Your app's login page",
    issuePath: "ssoUrl",
    submitName: "Save login page",
    validValue: "https://app.example.test/login",
    expectedValues: "https://app.example.test/login",
    invalidValue: "login",
  });
});
