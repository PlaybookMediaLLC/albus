import { describe, expect, it } from "vite-plus/test";
import { signInMethods } from "./sign-in-methods";

const t = (key: string) => `t:${key.split(".").at(-1)}`;

describe("signInMethods", () => {
  it("names the known providers once each", () => {
    expect(signInMethods(["google", "credential", "google"], t)).toEqual([
      "t:google",
      "t:password",
    ]);
  });
  it("uses the instance name of the custom provider, else a generic name", () => {
    expect(signInMethods(["custom"], t, "Acme SSO")).toEqual(["Acme SSO"]);
    expect(signInMethods(["custom"], t, null)).toEqual(["t:sso"]);
  });
  it("shows an unknown provider ID as it is", () => {
    expect(signInMethods(["gitlab"], t)).toEqual(["gitlab"]);
  });
  it("gives the email link or code when no provider is linked", () => {
    expect(signInMethods([], t)).toEqual(["t:email"]);
  });
});
