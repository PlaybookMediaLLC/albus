import { describe, expect, it } from "vite-plus/test";
import { getPublicHelpCenterFixture } from "../../api/help-center/get-public-help-center.fixture";
import { searchPublicHelpCenterFixture } from "../../api/help-center/search-public-help-center.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { HelpCenterPage } from "./help-center-page";
describe("HelpCenterPage", () => {
  describePageContract(meta, HelpCenterPage, {
    loading: {
      prepare: () => {
        mockApi().defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        mockApi().fail();
      },
    },
    ready: {
      prepare: () => {
        mockApi().reply(
          getPublicHelpCenterFixture.ok({ homepageTitle: "Help home" }),
        );
        return {};
      },
      assert: async (view) => {
        await view.findByText("Help home");
      },
    },
    done: {
      prepare: () => {
        const api = mockApi();
        api.reply(getPublicHelpCenterFixture.ok());
        api.reply(searchPublicHelpCenterFixture.ok());
        return { search: { query: "billing" } };
      },
      assert: async (view) => {
        await view.findByRole("heading", { name: "Search results" });
      },
    },
  });
  describe("behavior", () => {
    it("asks a signed-out visitor to sign in on a private portal and loads nothing", async () => {
      const api = mockApi();
      const view = renderPage(HelpCenterPage, meta, { accessGranted: false });
      expect(await view.findByRole("link", { name: /sign in/i })).toBeVisible();
      expect(api.calls()).toHaveLength(0);
    });

    it("runs search from the route query", async () => {
      const api = mockApi();
      api.reply(
        getPublicHelpCenterFixture.ok({ homepageTitle: "Product help" }),
      );
      api.reply(searchPublicHelpCenterFixture.ok());
      const view = renderPage(HelpCenterPage, meta, {
        search: { query: "reset" },
      });
      expect(
        await view.findByText("No articles match your search."),
      ).toBeInTheDocument();
      expect(api.calls("searchQuillsPublicHelpCenter")).toHaveLength(1);
    });
  });
});
