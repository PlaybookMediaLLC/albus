import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { getOfficeHoursFixture } from "../../../api/team/get-office-hours.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { OfficeHoursSection } from "./office-hours-section";

const team = {
  workspaceId: "workspace_1",
  viewer: { kind: "user" as const, id: "user_1" },
  permissions: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageSettings: true,
  },
};

const hours = getOfficeHoursFixture.ok({
  timezone: "UTC",
  intervals: [{ day: 1, start: "09:00", end: "17:00" }],
  holidays: [{ date: "2026-12-25", recurringAnnual: true }],
});

describe("OfficeHoursSection", () => {
  it("sends the full schedule with the switch value, and keeps the holidays", async () => {
    const api = mockApi();
    api.reply({ ...hours, enabled: true });
    api.reply({ ...hours, enabled: true });
    const view = renderComponent(
      <TeamRuntimeProvider value={team}>
        <OfficeHoursSection workspaceId="workspace_1" hours={hours} />
      </TeamRuntimeProvider>,
    );
    fireEvent.click(view.getByRole("switch", { name: "Use office hours" }));
    await waitFor(() =>
      expect(api.calls("setQuillsOfficeHours")).toHaveLength(1),
    );
    expect(await api.calls("setQuillsOfficeHours")[0]!.json()).toEqual({
      ...hours,
      enabled: true,
    });
  });

  it("hides the schedule form from a teammate without manage_settings", () => {
    mockApi();
    const view = renderComponent(
      <TeamRuntimeProvider
        value={{
          ...team,
          permissions: { ...team.permissions, manageSettings: false },
        }}
      >
        <OfficeHoursSection
          workspaceId="workspace_1"
          hours={{ ...hours, enabled: true }}
        />
      </TeamRuntimeProvider>,
    );
    expect(view.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("shows the schedule and the holiday note only while office hours are on", () => {
    mockApi();
    const view = renderComponent(
      <TeamRuntimeProvider value={team}>
        <OfficeHoursSection workspaceId="workspace_1" hours={hours} />
      </TeamRuntimeProvider>,
    );
    expect(view.queryByRole("button", { name: "Save" })).toBeNull();
    expect(
      view.queryByText("This page does not change your holidays."),
    ).toBeNull();
    view.rerender(
      <TeamRuntimeProvider value={team}>
        <OfficeHoursSection
          workspaceId="workspace_1"
          hours={{ ...hours, enabled: true }}
        />
      </TeamRuntimeProvider>,
    );
    expect(view.getByRole("button", { name: "Save" })).toBeVisible();
    expect(
      view.getByText("This page does not change your holidays."),
    ).toBeVisible();
  });
});
