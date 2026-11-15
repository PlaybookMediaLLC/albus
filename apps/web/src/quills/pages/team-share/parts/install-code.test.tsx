import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { mintWidgetInstallCodeFixture } from "../../../api/team/mint-widget-install-code.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { InstallCode } from "./install-code";

describe("InstallCode", () => {
  it("creates a code only on the click and shows it", async () => {
    const api = mockApi();
    const view = renderComponent(
      <InstallCode workspaceId="workspace_test_1" />,
    );
    expect(api.calls()).toHaveLength(0);
    api.reply(
      mintWidgetInstallCodeFixture.ok({
        code: "ABCD-1234",
        expiresAt: "2026-11-14T12:15:00.000Z",
      }),
    );
    fireEvent.click(view.getByRole("button", { name: "Create install code" }));
    expect(
      await view.findByRole("group", { name: "Install code" }),
    ).toHaveTextContent("ABCD-1234");
    expect(api.calls("mintQuillsWidgetInstallCode")).toHaveLength(1);
  });
});
