import { describe, expect, it } from "vite-plus/test";
import { getPublicStatusPageFixture } from "../../api/status/get-public-status-page.fixture";
import { listPublicStatusHistoryFixture } from "../../api/status/list-public-status-history.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { StatusPage } from "./status-page";
describe("StatusPage", () => {
  describePageContract(meta, StatusPage, {
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
        const api = mockApi();
        api.reply(getPublicStatusPageFixture.ok());
        api.reply(listPublicStatusHistoryFixture.ok());
      },
      assert: async (view) => {
        await view.findByText("All systems operational");
      },
    },
  });
  describe("behavior", () => {
    it("asks a signed-out visitor to sign in on a private portal and loads nothing", async () => {
      const api = mockApi();
      const view = renderPage(StatusPage, meta, { accessGranted: false });
      expect(await view.findByRole("link", { name: /sign in/i })).toBeVisible();
      expect(api.calls()).toHaveLength(0);
    });
  });
});
