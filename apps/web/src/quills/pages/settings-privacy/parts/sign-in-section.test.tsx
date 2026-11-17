import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getPortalSettingsFixture } from "../../../api/team/get-portal-settings.fixture";
import { updatePortalSignInFixture } from "../../../api/team/update-portal-sign-in.fixture";
import { choose } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { SignInSection } from "./sign-in-section";

const render = (data: Parameters<typeof SignInSection>[0]["data"]) =>
  renderComponent(
    <TeamRuntimeProvider
      value={{
        workspaceId: "workspace_test_1",
        viewer: { kind: "user", id: "account_test_1" },
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: true,
          manageSettings: true,
        },
      }}
    >
      <SignInSection
        workspaceId="workspace_test_1"
        locked={false}
        data={data}
      />
    </TeamRuntimeProvider>,
  );

describe("SignInSection", () => {
  const kaneo = { mode: "kaneo" as const, widgetSignIn: false, ssoUrl: null };

  it("turns on widget sign-in and keeps the other choices", async () => {
    const api = mockApi();
    api.reply(updatePortalSignInFixture.ok());
    api.reply(getPortalSettingsFixture.ok());
    const view = render(kaneo);
    fireEvent.click(
      view.getByRole("switch", {
        name: "Open the portal signed in from the widget",
      }),
    );
    await waitFor(() =>
      expect(api.calls("updateQuillsPortalSignIn")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsPortalSignIn")[0]!.json()).toEqual({
      ...kaneo,
      widgetSignIn: true,
    });
  });

  it("saves the host app's login page, and offers it as the sign-in button once saved", async () => {
    const api = mockApi();
    api.reply(updatePortalSignInFixture.ok());
    api.reply(getPortalSettingsFixture.ok());
    const view = render(kaneo);
    fireEvent.change(view.getByLabelText("Your app's login page"), {
      target: { value: "https://app.example.test/login" },
    });
    fireEvent.click(view.getByRole("button", { name: "Save login page" }));
    await waitFor(() =>
      expect(api.calls("updateQuillsPortalSignIn")).toHaveLength(1),
    );
    expect(await api.calls("updateQuillsPortalSignIn")[0]!.json()).toEqual({
      ...kaneo,
      ssoUrl: "https://app.example.test/login",
    });
    view.unmount();

    const saved = render({
      ...kaneo,
      ssoUrl: "https://app.example.test/login",
    });
    api.reply(updatePortalSignInFixture.ok());
    api.reply(getPortalSettingsFixture.ok());
    await choose("Sign-in button", "Your app's login page");
    await waitFor(() =>
      expect(api.calls("updateQuillsPortalSignIn")).toHaveLength(2),
    );
    expect(
      await api.calls("updateQuillsPortalSignIn")[1]!.json(),
    ).toMatchObject({
      mode: "sso",
    });
    saved.unmount();
  });
});
