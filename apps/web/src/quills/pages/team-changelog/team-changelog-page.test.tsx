import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createChangelogEntryFixture } from "../../api/team/create-changelog-entry.fixture";
import { draftChangelogFromPostsFixture } from "../../api/team/draft-changelog-from-posts.fixture";
import { getChangelogEntryFixture } from "../../api/team/get-changelog-entry.fixture";
import { listChangelogFixture } from "../../api/team/list-changelog.fixture";
import { listChangelogEngagementFixture } from "../../api/team/list-changelog-engagement.fixture";
import { searchShippedPostsFixture } from "../../api/team/search-shipped-posts.fixture";
import { press } from "../../test/actions";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { meta } from "./meta";
import { TeamChangelogPage } from "./team-changelog-page";

const entry = getChangelogEntryFixture.ok({
  id: "changelog_test_1",
  title: "November release",
  status: "draft",
  createdAt: "2026-11-01T12:00:00.000Z",
});
const entries = listChangelogFixture.ok({ entries: [entry] });
const shipped = searchShippedPostsFixture.ok({
  posts: [
    {
      id: "post_test_1",
      title: "Dark mode",
      voteCount: 3,
      boardSlug: "ideas",
      authorName: null,
      createdAt: "2026-10-01T00:00:00.000Z",
    },
  ],
});
const draft = draftChangelogFromPostsFixture.ok({
  title: "Dark mode is here",
  body: "- Dark mode",
  postIds: ["post_test_1"],
  requesterCount: 3,
});

/** Opens the draft sheet and drafts from the one shipped post. */
async function draftDarkMode() {
  press("Draft from shipped requests");
  (await screen.findByRole("checkbox", { name: /Dark mode/ })).click();
  const submit = screen.getByRole("button", { name: "Draft with AI" });
  await vi.waitFor(() => expect(submit).toBeEnabled());
  submit.click();
}

describe("TeamChangelogPage", () => {
  describePageContract(meta, TeamChangelogPage, {
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
        api.reply(entries);
        api.reply(shipped);
      },
      assert: async (view) => {
        const row = await view.findByRole("link", { name: /November release/ });
        expect(row).toHaveAttribute(
          "href",
          "/feedback/workspace_test_1/changelog/changelog_test_1",
        );
        expect(view.getByRole("img", { name: "Draft" })).toBeInTheDocument();
      },
    },
    done: {
      prepare: () => {
        const api = mockApi();
        api.reply(entries);
        api.reply(shipped);
        api.reply(draft);
      },
      act: async (view) => {
        await view.findByText("November release");
        await draftDarkMode();
      },
      assert: async () => {
        expect(
          await screen.findByRole("region", { name: "Draft for review" }),
        ).toHaveTextContent("Dark mode is here");
      },
    },
  });

  it("filters by status and says when no entry exists", async () => {
    const api = mockApi();
    api.reply(entries);
    api.reply(shipped);
    api.reply(listChangelogFixture.ok());
    const view = renderPage(TeamChangelogPage, meta);
    await view.findByText("November release");
    fireEvent.click(view.getByRole("button", { name: "Filters" }));
    fireEvent.click(
      await view.findByRole("menuitemradio", { name: "Published" }),
    );
    expect(await view.findByText("No updates yet")).toBeInTheDocument();
    const url = new URL(api.calls("listQuillsChangelog")[1]!.url);
    expect(url.searchParams.get("status")).toBe("published");
  });

  it("shows the engagement of published updates on its tab", async () => {
    const api = mockApi();
    api.reply(entries);
    api.reply(shipped);
    api.reply(
      listChangelogEngagementFixture.ok({
        items: [
          {
            id: "changelog_test_2",
            title: "October release",
            publishedAt: "2026-10-01T12:00:00.000Z",
            readCount: 4,
            reactions: [{ emoji: "🎉", count: 2 }],
          },
        ],
      }),
    );
    const view = renderPage(TeamChangelogPage, meta);
    await view.findByText("November release");
    expect(api.calls("listQuillsChangelogEngagement")).toHaveLength(0);
    fireEvent.click(view.getByRole("tab", { name: "Engagement" }));
    expect(
      await view.findByRole("link", { name: /October release/ }),
    ).toHaveTextContent("🎉 2");
  });

  it("saves the AI draft as a draft entry and opens it", async () => {
    const api = mockApi();
    api.reply(entries);
    api.reply(shipped);
    api.reply(draft);
    api.reply(createChangelogEntryFixture.ok({ id: "changelog_new" }));
    api.reply(entries);
    const view = renderPage(TeamChangelogPage, meta);
    await view.findByText("November release");
    await draftDarkMode();
    fireEvent.click(
      await screen.findByRole("button", { name: "Create draft entry" }),
    );
    await vi.waitFor(() =>
      expect(view.router.state.location.pathname).toBe(
        "/feedback/workspace_test_1/changelog/changelog_new",
      ),
    );
    expect(await api.calls("createQuillsChangelogEntry")[0]!.json()).toEqual({
      title: "Dark mode is here",
      content: "- Dark mode",
      linkedPostIds: ["post_test_1"],
      publishState: { type: "draft" },
    });
  });
});
