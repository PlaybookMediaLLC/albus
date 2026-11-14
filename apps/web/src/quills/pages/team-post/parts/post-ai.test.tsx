import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { summarizePostFixture } from "../../../api/team/summarize-post.fixture";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { PostAi } from "./post-ai";

const render = () =>
  renderComponent(
    <PostAi workspaceId="workspace_test_1" postId="post_export" />,
  );

describe("PostAi", () => {
  it("summarizes the request when the chip opens", async () => {
    const api = mockApi();
    api.reply(
      summarizePostFixture.ok({ summary: "Customers want a CSV export." }),
    );
    const view = render();
    press("Summarize");
    const dialog = await view.findByRole("dialog", { name: "AI summary" });
    expect(await view.findByText("Customers want a CSV export.")).toBeVisible();
    expect(dialog).toBeVisible();
    expect(new URL(api.calls("summarizeQuillsPost")[0]!.url).pathname).toBe(
      "/api/quills/workspace_test_1/posts/post_export/summary",
    );
  });

  it("asks the provider once when the chip opens again", async () => {
    const api = mockApi();
    api.reply(summarizePostFixture.ok({ summary: "Once." }));
    const view = render();
    press("Summarize");
    expect(await view.findByText("Once.")).toBeVisible();
    fireEvent.keyDown(document.activeElement ?? document.body, {
      key: "Escape",
    });
    await waitFor(() =>
      expect(view.queryByRole("dialog", { name: "AI summary" })).toBeNull(),
    );
    press("Summarize");
    expect(await view.findByText("Once.")).toBeVisible();
    expect(api.calls("summarizeQuillsPost")).toHaveLength(1);
  });

  it("says that AI is not set up on a 409", async () => {
    const api = mockApi();
    const off = summarizePostFixture.problem(409);
    api.reply(off.body, off.status);
    const view = render();
    press("Summarize");
    expect(
      await view.findByText("AI is not set up for this workspace."),
    ).toBeVisible();
    expect(view.queryByRole("alert")).toBeNull();
  });

  it("shows a failure with a retry", async () => {
    const api = mockApi();
    api.fail();
    api.reply(summarizePostFixture.ok({ summary: "Second try." }));
    const view = render();
    press("Summarize");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "AI could not summarize this request.",
    );
    fireEvent.click(view.getByRole("button", { name: /Try again/ }));
    expect(await view.findByText("Second try.")).toBeVisible();
    await waitFor(() =>
      expect(api.calls("summarizeQuillsPost")).toHaveLength(2),
    );
  });
});
