import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { getWidgetSettingsFixture } from "../../../api/team/get-widget-settings.fixture";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { HomeSection } from "./home-section";

const base = getWidgetSettingsFixture.ok().home;
const home = {
  ...base,
  headerStyle: "plain",
  cards: [
    {
      id: "card_1",
      type: "new_conversation",
      enabled: true,
      audience: "everyone",
      title: null,
      subtitle: null,
      url: null,
    },
    {
      id: "card_2",
      type: "link",
      enabled: true,
      audience: "identified",
      title: "Docs",
      subtitle: null,
      url: "https://example.test/docs",
    },
  ],
};

describe("HomeSection", () => {
  it("sends the full card list with one card changed", async () => {
    const onSave = vi.fn(async () => undefined);
    const view = renderComponent(
      <TeamRuntimeProvider
        value={{
          workspaceId: "workspace_1",
          viewer: { kind: "user", id: "user_1" },
          permissions: {
            read: true,
            create: true,
            update: true,
            delete: true,
            manageSettings: false,
          },
        }}
      >
        <HomeSection
          workspaceId="workspace_1"
          home={home}
          locked={false}
          onSave={onSave}
        />
      </TeamRuntimeProvider>,
    );
    fireEvent.click(view.getByRole("switch", { name: "New conversation" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        cards: [
          {
            id: "card_1",
            type: "new_conversation",
            enabled: false,
            audience: "everyone",
          },
          {
            id: "card_2",
            type: "link",
            enabled: true,
            audience: "identified",
            title: "Docs",
            url: "https://example.test/docs",
          },
        ],
      }),
    );
  });
});
