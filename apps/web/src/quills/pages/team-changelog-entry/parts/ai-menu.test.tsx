import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { createAdminAssistantTransformFixture } from "../../../api/team/create-admin-assistant-transform.fixture";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { AiMenu } from "./ai-menu";

const open = async (name: string) => {
  fireEvent.click(screen.getByRole("button", { name: "Rewrite with AI" }));
  fireEvent.click(await screen.findByRole("menuitem", { name }));
};

describe("AiMenu", () => {
  it("rewrites the target and applies it only after the user accepts", async () => {
    const api = mockApi();
    api.reply(createAdminAssistantTransformFixture.ok({ text: "Fixed text" }));
    const onApply = vi.fn();
    const target = { text: "fixd txt", start: 2, end: 10 };
    renderComponent(
      <AiMenu
        workspaceId="workspace_test_1"
        target={() => target}
        onApply={onApply}
      />,
    );
    await open("Fix grammar");
    expect(await screen.findByRole("dialog")).toHaveTextContent("Fixed text");
    expect(
      await api.calls("createQuillsAdminAssistantTransform")[0]!.json(),
    ).toEqual({
      kind: "fix_grammar",
      text: "fixd txt",
    });
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Replace" }));
    expect(onApply).toHaveBeenCalledWith("Fixed text", target);
  });

  it("sends nothing for text over the API limit", async () => {
    const api = mockApi();
    renderComponent(
      <AiMenu
        workspaceId="workspace_test_1"
        target={() => ({ text: "x".repeat(8001), start: 0, end: 8001 })}
        onApply={vi.fn()}
      />,
    );
    await open("Rephrase");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(api.calls()).toHaveLength(0);
  });
});
