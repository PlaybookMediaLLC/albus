import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { SignInSection } from "./sign-in-section";

const state = vi.hoisted(() => ({
  accounts: {
    data: undefined as { providerId: string }[] | undefined,
    isPending: false,
    isError: false,
  },
  customOAuthName: null as string | null,
}));
vi.mock("@/hooks/queries/use-list-accounts", () => ({
  default: () => state.accounts,
}));
vi.mock("@/hooks/queries/config/use-get-config", () => ({
  default: () => ({ data: { customOAuthName: state.customOAuthName } }),
}));

describe("SignInSection", () => {
  beforeEach(() => {
    state.accounts = { data: undefined, isPending: false, isError: false };
    state.customOAuthName = null;
  });

  it("lists the linked methods with the instance name of the custom provider", () => {
    state.accounts.data = [
      { providerId: "custom" },
      { providerId: "credential" },
    ];
    state.customOAuthName = "Acme SSO";
    const view = renderComponent(<SignInSection />);
    expect(
      view.getByText("Acme SSO and Email and password"),
    ).toBeInTheDocument();
  });

  it("shows a spinner while the accounts load", () => {
    state.accounts.isPending = true;
    const view = renderComponent(<SignInSection />);
    expect(view.getByRole("status")).toBeInTheDocument();
  });

  it("says when the accounts could not load", () => {
    state.accounts.isError = true;
    const view = renderComponent(<SignInSection />);
    expect(
      view.getByText("Something went wrong. Try again."),
    ).toBeInTheDocument();
  });
});
