import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { SettingsBillingPage } from "./settings-billing-page";

// Kaneo's own billing page has its own tests and requests.
vi.mock("@/components/billing/billing-settings-page", () => ({
  BillingSettingsPage: (props: {
    checkout?: string;
    onDismissCheckout: () => void;
  }) => (
    <>
      <h1>Billing</h1>
      <p>Checkout: {props.checkout ?? "none"}</p>
      <button type="button" onClick={props.onDismissCheckout}>
        Dismiss
      </button>
    </>
  ),
}));

describe("SettingsBillingPage", () => {
  describePageContract(meta, SettingsBillingPage, {
    ready: {
      prepare: () => {
        mockApi();
      },
    },
  });

  it("passes the checkout result to Kaneo's billing page and clears it when dismissed", async () => {
    const view = renderPage(SettingsBillingPage, meta, {
      search: { checkout: "success" },
    });
    expect(view.getByText("Checkout: success")).toBeInTheDocument();
    fireEvent.click(view.getByRole("button", { name: "Dismiss" }));
    await waitFor(() =>
      expect(view.router.state.location.search).not.toHaveProperty("checkout"),
    );
  });
});
