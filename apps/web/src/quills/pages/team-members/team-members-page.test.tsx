import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { getUserFixture } from "../../api/team/get-user.fixture";
import { listUsersFixture } from "../../api/team/list-users.fixture";
import { meta } from "./meta";
import { TeamMembersPage } from "./team-members-page";

const { segments: _segments, tags: _tags, ...person } = getUserFixture.ok();
const ada = {
  ...person,
  principalId: "principal_ada",
  name: "Ada Lovelace",
  email: "ada@example.test",
  isLead: true,
};

describe("TeamMembersPage", () => {
  describePageContract(meta, TeamMembersPage, {
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
        mockApi().reply(listUsersFixture.ok({ items: [ada], total: 1 }));
      },
      assert: async (view) => {
        const row = await view.findByRole("link", { name: /Ada Lovelace/ });
        expect(row).toHaveAttribute(
          "href",
          "/feedback/workspace_test_1/members/principal_ada",
        );
        expect(row).toHaveTextContent("ada@example.test");
        expect(row).toHaveTextContent("Lead");
      },
    },
  });

  it("says that no member exists yet", async () => {
    mockApi().reply(listUsersFixture.ok());
    const view = renderPage(TeamMembersPage, meta);
    expect(await view.findByText("No members yet")).toBeInTheDocument();
  });

  it("searches and says when nothing matches", async () => {
    const api = mockApi();
    api.reply(listUsersFixture.ok({ items: [ada], total: 1 }));
    api.reply(listUsersFixture.ok());
    const view = renderPage(TeamMembersPage, meta);
    await view.findByRole("link", { name: /Ada Lovelace/ });
    fireEvent.change(view.getByRole("searchbox", { name: "Search members…" }), {
      target: { value: "zed" },
    });
    expect(await view.findByText("No members match “zed”")).toBeInTheDocument();
    const url = new URL(api.calls("listQuillsUsers")[1]!.url);
    expect(url.searchParams.get("search")).toBe("zed");
    expect(url.searchParams.get("limit")).toBe("50");
  });

  it("loads the next page under the first", async () => {
    const api = mockApi();
    api.reply(listUsersFixture.ok({ items: [ada], total: 51, nextOffset: 50 }));
    api.reply(
      listUsersFixture.ok({
        items: [{ ...ada, principalId: "principal_bo", name: "Bo Diddley" }],
        total: 51,
      }),
    );
    const view = renderPage(TeamMembersPage, meta);
    fireEvent.click(
      await view.findByRole("button", { name: "Load more members" }),
    );
    await view.findByRole("link", { name: /Bo Diddley/ });
    expect(
      view.getByRole("link", { name: /Ada Lovelace/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        new URL(api.calls("listQuillsUsers")[1]!.url).searchParams.get(
          "offset",
        ),
      ).toBe("50"),
    );
    expect(
      view.queryByRole("button", { name: "Load more members" }),
    ).toBeNull();
  });
});
