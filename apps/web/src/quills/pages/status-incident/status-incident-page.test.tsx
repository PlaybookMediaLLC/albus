import { describe, expect, it } from "vite-plus/test";
import { getPublicStatusIncidentFixture } from "../../api/status/get-public-status-incident.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { StatusIncidentPage } from "./status-incident-page";
describe("StatusIncidentPage", () => {
  const options = { params: { incidentId: "status_incident_test_1" } };
  describePageContract(meta, StatusIncidentPage, {
    loading: {
      prepare: () => {
        mockApi().defer(() => undefined);
        return options;
      },
    },
    failed: {
      prepare: () => {
        mockApi().fail();
        return options;
      },
    },
    ready: {
      prepare: () => {
        mockApi().reply(
          getPublicStatusIncidentFixture.ok({ title: "Delayed notifications" }),
        );
        return options;
      },
      assert: async (view) => {
        await view.findByText("Delayed notifications");
      },
    },
  });

  describe("behavior", () => {
    it("asks a signed-out visitor to sign in on a private portal and loads nothing", async () => {
      const api = mockApi();
      const view = renderPage(StatusIncidentPage, meta, {
        ...options,
        accessGranted: false,
      });
      expect(await view.findByRole("link", { name: /sign in/i })).toBeVisible();
      expect(api.calls()).toHaveLength(0);
    });

    it("offers a retry when the access check fails, instead of denying a member", async () => {
      const api = mockApi();
      const view = renderPage(StatusIncidentPage, meta, {
        ...options,
        viewer: { kind: "user", id: "user_test_1" },
        accessGranted: false,
        accessProblem: { kind: "failed" },
        retryAccess: () => undefined,
      });
      expect(
        await view.findByRole("button", { name: "Try again" }),
      ).toBeVisible();
      expect(view.queryByText(/do not have access/i)).toBeNull();
      expect(api.calls()).toHaveLength(0);
    });

    it("names the status, impact and component states in words", async () => {
      mockApi().reply(
        getPublicStatusIncidentFixture.ok({
          title: "Exports are slow",
          status: "in_progress",
          impact: "major",
          affectedComponents: [
            { id: "c1", name: "API", componentStatus: "partial_outage" },
          ] as never,
          updates: [],
        }),
      );
      const view = renderPage(StatusIncidentPage, meta, options);
      await view.findByText("Exports are slow");
      expect(view.getByText("Status: In progress")).toBeInTheDocument();
      expect(view.getByText("Impact: Major")).toBeInTheDocument();
      expect(view.getByText("API: Partial outage")).toBeInTheDocument();
      expect(view.container.textContent).not.toMatch(
        /in_progress|partial_outage/,
      );
    });

    it("shows a non-disclosing not-found state", async () => {
      const api = mockApi();
      api.reply({ message: "Missing" }, 404);
      const view = renderPage(StatusIncidentPage, meta, {
        params: { incidentId: "missing" },
      });
      expect(await view.findByRole("alert")).toHaveTextContent(
        /could not be found/i,
      );
    });
  });
});
