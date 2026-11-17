import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vite-plus/test";
import { evaluateMyPortalAccessFixture } from "@/quills/api/portal/evaluate-my-portal-access.fixture";
import { getPublicPortalConfigFixture } from "@/quills/api/portal/get-public-portal-config.fixture";
import { linkPortalWidgetProfileFixture } from "@/quills/api/portal/link-portal-widget-profile.fixture";
import { PortalRoute } from "@/quills/portal/layout";
import { mockApi } from "@/quills/test/mock-api";
import { i18n } from "@/quills/ui/upstream";
import { Route } from "./$workspaceId";

describe("portal layout route", () => {
  it("loads translations and resolves portal access before child routes", async () => {
    const api = mockApi();
    api.reply(getPublicPortalConfigFixture.ok());
    api.reply(evaluateMyPortalAccessFixture.ok({ granted: true }));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const beforeLoad = Route.options.beforeLoad;

    const result = await beforeLoad?.({
      context: { queryClient, user: null },
      params: { workspaceId: "workspace_test_1" },
    } as never);

    expect(i18n.hasResourceBundle("en-US", "quills")).toBe(true);
    expect(result?.quillsPortal).toMatchObject({
      workspaceId: "workspace_test_1",
      viewer: { kind: "anonymous" },
      portalAvailable: true,
      accessGranted: true,
    });
    expect(Route.options.component).toBe(PortalRoute);
    expect(api.calls().map((call) => new URL(call.url).pathname)).toEqual([
      "/api/quills-public/workspace_test_1/portal/config",
      "/api/quills-public/workspace_test_1/portal/access",
    ]);
  });

  it("links the signed-in account's widget profile once per page load, before child routes", async () => {
    const api = mockApi();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const enter = () =>
      Route.options.beforeLoad?.({
        context: { queryClient, user: { id: "user_link_1" } },
        params: { workspaceId: "workspace_test_1" },
      } as never);
    api.reply(linkPortalWidgetProfileFixture.ok());
    api.reply(getPublicPortalConfigFixture.ok());
    api.reply(evaluateMyPortalAccessFixture.ok({ granted: true }));
    await enter();
    queryClient.clear();
    api.reply(getPublicPortalConfigFixture.ok());
    api.reply(evaluateMyPortalAccessFixture.ok({ granted: true }));
    await enter();

    const calls = api.calls().map((call) => ({
      method: call.method,
      path: new URL(call.url).pathname,
    }));
    expect(calls[0]).toEqual({
      method: "POST",
      path: "/api/quills-public/workspace_test_1/portal/widget-link",
    });
    expect(
      calls.filter((call) => call.path.endsWith("/portal/widget-link")),
    ).toHaveLength(1);
    expect(calls).toHaveLength(5);
  });

  it("waits for the link before it loads the portal, and loads it when the link fails", async () => {
    const api = mockApi();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const enter = (user: string) =>
      Route.options.beforeLoad?.({
        context: { queryClient, user: { id: user } },
        params: { workspaceId: "workspace_test_1" },
      } as never);
    let resolveLink: ((body: unknown) => void) | undefined;
    api.defer(({ resolve }) => {
      resolveLink = resolve;
    });
    api.reply(getPublicPortalConfigFixture.ok());
    api.reply(evaluateMyPortalAccessFixture.ok({ granted: true }));
    const entering = enter("user_link_wait");
    await vi.waitFor(() => expect(resolveLink).toBeDefined());
    // One more turn of the event loop: a portal read started beside the link would show here.
    await new Promise((done) => setImmediate(done));
    expect(api.calls()).toHaveLength(1);
    resolveLink!(linkPortalWidgetProfileFixture.ok());
    await entering;
    expect(api.calls()).toHaveLength(3);

    queryClient.clear();
    api.reply({ message: "Too many attempts" }, 429);
    api.reply(getPublicPortalConfigFixture.ok());
    api.reply(evaluateMyPortalAccessFixture.ok({ granted: true }));
    const result = await enter("user_link_fails");
    expect(result?.quillsPortal).toMatchObject({
      portalAvailable: true,
      accessGranted: true,
    });
  });
});
