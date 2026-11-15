import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { blockUserFixture } from "../../api/team/block-user.fixture";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { member, memberComments, replyMember } from "./member.fixture";
import { meta } from "./meta";
import { TeamMemberPage } from "./team-member-page";

let api: ReturnType<typeof mockApi>;

describe("TeamMemberPage", () => {
  describePageContract(meta, TeamMemberPage, {
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
        replyMember();
      },
      assert: async (view) => {
        expect(
          view.getByRole("heading", { level: 1, name: "Ada Lovelace" }),
        ).toBeInTheDocument();
        expect(view.getByRole("tab", { name: "Requests 1" })).toHaveAttribute(
          "aria-selected",
          "true",
        );
        const request = await view.findByRole("link", {
          name: /Export to CSV/,
        });
        expect(request).toHaveAttribute(
          "href",
          "/feedback/workspace_test_1/posts/post_export",
        );
        expect(request).toHaveTextContent("Ideas");
        expect(request).toHaveTextContent("Open");
        expect(view.getByText("Identified by your app")).toBeInTheDocument();
        expect(await view.findByText("Plan:")).toBeInTheDocument();
        // The Activity tab waits for a route (settings spec 5.3).
        expect(view.queryByRole("tab", { name: /Activity/ })).toBeNull();
      },
    },
    done: {
      prepare: () => {
        api = replyMember();
      },
      act: async (view) => {
        await view.findByText("Plan:");
        api.reply(
          blockUserFixture.ok({ blockedAt: "2026-02-01T00:00:00.000Z" }),
        );
        api.reply({ ...member, blockedAt: "2026-02-01T00:00:00.000Z" });
        fireEvent.click(view.getByRole("button", { name: "Member actions" }));
        fireEvent.click(await view.findByRole("menuitem", { name: "Block" }));
      },
      assert: async (view) => {
        await waitFor(() =>
          expect(api.calls("blockQuillsUser")).toHaveLength(1),
        );
        fireEvent.click(view.getByRole("button", { name: "Member actions" }));
        expect(
          await view.findByRole("menuitem", { name: "Unblock" }),
        ).toBeInTheDocument();
      },
    },
  });

  it("lists the comments as plain text on the Comments tab", async () => {
    const api = replyMember();
    api.reply(memberComments);
    const view = renderPage(TeamMemberPage, meta);
    fireEvent.click(await view.findByRole("tab", { name: "Comments 2" }));
    const comment = await view.findByRole("link", { name: /Please add this/ });
    expect(comment).toHaveTextContent("Export to CSV");
    expect(comment).toHaveAttribute(
      "href",
      "/feedback/workspace_test_1/posts/post_export",
    );
    expect(view.getByLabelText("4 reactions")).toBeInTheDocument();
    expect(new URL(api.calls("listQuillsUserComments")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/users/principalId_test_1/comments",
    );
  });

  it("asks for the author's posts only", async () => {
    const api = replyMember();
    const view = renderPage(TeamMemberPage, meta);
    await view.findByRole("link", { name: /Export to CSV/ });
    const url = new URL(api.calls("listQuillsPosts")[0]!.url);
    expect(url.searchParams.get("authorPrincipalId")).toBe(
      "principalId_test_1",
    );
  });

  it("keeps the confirmation open when the person still authors content", async () => {
    const api = replyMember();
    const view = renderPage(TeamMemberPage, meta);
    await view.findByText("Plan:");
    api.reply({ message: "The person still authors content" }, 409);
    fireEvent.click(view.getByRole("button", { name: "Member actions" }));
    fireEvent.click(
      await view.findByRole("menuitem", { name: "Remove member" }),
    );
    const dialog = await view.findByRole("alertdialog");
    fireEvent.click(
      view.getAllByRole("button", { name: "Remove member" }).at(-1)!,
    );
    await waitFor(() => expect(api.calls("deleteQuillsUser")).toHaveLength(1));
    expect(dialog).toBeInTheDocument();
  });
});
