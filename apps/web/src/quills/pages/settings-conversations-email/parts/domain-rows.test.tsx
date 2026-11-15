import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { restartSendingDomainChecksFixture } from "../../../api/team/restart-sending-domain-checks.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { toast } from "../../../ui/upstream";
import { DomainRows } from "./domain-rows";

const domain = restartSendingDomainChecksFixture.ok({
  id: "domain_1",
  domain: "example.test",
  status: "verified",
  dnsRecords: [{ type: "TXT", host: "@", value: "v=spf1", purpose: "SPF" }],
});

const render = () =>
  renderComponent(
    <TeamRuntimeProvider
      value={{
        workspaceId: "workspace_1",
        viewer: { kind: "user", id: "user_1" },
        permissions: {
          read: true,
          create: true,
          update: true,
          delete: true,
          manageSettings: true,
        },
      }}
    >
      <DomainRows workspaceId="workspace_1" domain={domain} />
    </TeamRuntimeProvider>,
  );

describe("DomainRows", () => {
  it("hides the DNS records of a verified domain and says why it cannot be removed", async () => {
    const error = vi.spyOn(toast, "error");
    mockApi().reply({ message: "In use" }, 409);
    const view = render();
    expect(view.getByText("Verified")).toBeVisible();
    expect(view.queryByRole("group", { name: "TXT record value" })).toBeNull();
    fireEvent.click(
      view.getByRole("button", { name: "Actions for example.test" }),
    );
    fireEvent.click(
      await view.findByRole("menuitem", { name: "Remove domain" }),
    );
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "The domain could not be removed. Remove its sending addresses first.",
      ),
    );
  });
});
