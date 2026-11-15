import { describe, expect, it, vi } from "vite-plus/test";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsAccountPage } from "./settings-account-page";

// Kaneo's own profile parts and account hooks have their own tests and requests.
vi.mock("@/components/providers/auth-provider/hooks/use-auth", () => {
  const useAuth = () => ({
    user: { name: "Ada", email: "ada@example.com" },
    refetchUser: async () => undefined,
  });
  return { default: useAuth, useAuth };
});
vi.mock("@/components/settings/profile/profile-details-section", () => ({
  ProfileDetailsSection: () => <h2>Details</h2>,
}));
vi.mock("@/components/settings/profile/delete-account-section", () => ({
  DeleteAccountSection: ({ email }: { email?: string }) => (
    <h2>Danger zone {email}</h2>
  ),
}));
vi.mock("@/components/settings/profile/use-profile-name-autosave", () => ({
  useProfileNameAutosave: () => ({}),
}));
vi.mock("@/hooks/queries/user/use-managed-profile-fields", () => ({
  default: () => [],
}));
vi.mock("@/hooks/queries/use-list-accounts", () => ({
  default: () => ({
    data: [{ providerId: "google" }],
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/hooks/queries/config/use-get-config", () => ({
  default: () => ({ data: { customOAuthName: null } }),
}));

describe("SettingsAccountPage", () => {
  describePageContract(meta, SettingsAccountPage, {
    ready: {
      prepare: () => {
        mockApi();
      },
    },
  });

  it("shows the profile, the appearance, the sign-in and the danger zone in this order", async () => {
    const view = renderPage(SettingsAccountPage, meta);
    expect(
      await view.findByRole("heading", { level: 1, name: "Account" }),
    ).toBeInTheDocument();
    expect(
      view.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      "Details",
      "Appearance",
      "Sign-in",
      "Danger zone ada@example.com",
    ]);
    expect(view.getByText("Google")).toBeInTheDocument();
  });
});
