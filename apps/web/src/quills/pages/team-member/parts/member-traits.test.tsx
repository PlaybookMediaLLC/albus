import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { listUserAttributesFixture } from "../../../api/team/list-user-attributes.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { member, memberAttributes, inTeam } from "../member.fixture";
import { MemberTraits } from "./member-traits";

const Traits = () => (
  <MemberTraits workspaceId="workspace_test_1" member={member} />
);

describe("MemberTraits", () => {
  it("removes a trait with a null value", async () => {
    const api = mockApi();
    api.reply(memberAttributes);
    const view = renderComponent(inTeam(<Traits />));
    expect(await view.findByText("Plan:")).toBeInTheDocument();
    api.reply(member);
    fireEvent.click(
      view.getByRole("button", { name: "Actions for the trait plan" }),
    );
    fireEvent.click(await view.findByRole("menuitem", { name: "Remove" }));
    await waitFor(() => expect(api.calls("updateQuillsUser")).toHaveLength(1));
    expect(await api.calls("updateQuillsUser")[0]!.json()).toEqual({
      attributes: { plan: null },
    });
  });

  it("hides add without attribute definitions or without the update permission", async () => {
    mockApi().reply(listUserAttributesFixture.ok());
    const view = renderComponent(inTeam(<Traits />));
    // Without a definition the row shows the stored key.
    await waitFor(() => expect(view.getByText("plan:")).toBeInTheDocument());
    expect(view.queryByRole("button", { name: "Add a trait" })).toBeNull();
    view.unmount();
    mockApi().reply(memberAttributes);
    const limited = renderComponent(inTeam(<Traits />, { update: false }));
    await limited.findByText("Plan:");
    expect(limited.queryByRole("button", { name: "Add a trait" })).toBeNull();
    expect(
      limited.queryByRole("button", { name: /Actions for the trait/ }),
    ).toBeNull();
  });
});
