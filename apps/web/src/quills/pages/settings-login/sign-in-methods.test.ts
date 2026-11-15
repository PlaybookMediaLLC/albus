import { describe, expect, it } from "vite-plus/test";
import { signInMethods } from "./sign-in-methods";

const none = {
  disableLoginForm: true,
  hasGoogleSignIn: false,
  hasGithubSignIn: false,
  hasDiscordSignIn: false,
  hasCustomOAuth: false,
  customOAuthName: null,
};

describe("signInMethods", () => {
  it("lists the enabled methods in a fixed order", () => {
    expect(
      signInMethods({
        ...none,
        disableLoginForm: false,
        hasGithubSignIn: true,
        hasCustomOAuth: true,
      }),
    ).toEqual([
      "settings-product.login.methods.email",
      "settings-product.login.methods.github",
      "settings-product.login.methods.sso",
    ]);
  });

  it("uses the name of the custom provider when the instance sets one", () => {
    expect(
      signInMethods({ ...none, hasCustomOAuth: true, customOAuthName: "Okta" }),
    ).toEqual(["Okta"]);
    expect(signInMethods(none)).toEqual([]);
  });
});
