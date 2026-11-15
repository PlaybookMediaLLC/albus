import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { z } from "zod";
import type { PortalProblem } from "../../core/types";
import { choose, press } from "../../test/actions";
import { renderComponent } from "../../test/render";
import { PortalForm } from "../../ui/portal-form";
import { PillSelect } from "./pill-select";

const schema = z.object({ boardId: z.string().min(1, "Choose a board.") });
type Values = z.infer<typeof schema>;
const options = [
  { value: "board_ideas", label: "Ideas", icon: <svg aria-label="Bulb" /> },
  { value: "board_bugs", label: "Bugs" },
];

const renderForm = (
  boardId: string,
  onSubmit: (values: Values) => Promise<PortalProblem | void> = vi.fn(
    async () => undefined,
  ),
) =>
  renderComponent(
    <PortalForm<Values>
      schema={schema}
      defaultValues={{ boardId }}
      submitKey="team-posts.create"
      onSubmit={onSubmit}
    >
      {(form) => (
        <PillSelect
          control={form.control}
          name="boardId"
          label="Board"
          options={options}
        />
      )}
    </PortalForm>,
  );

describe("PillSelect", () => {
  it("names the trigger, shows the option icon and sends the chosen value", async () => {
    const onSubmit = vi.fn(async () => undefined);
    const view = renderForm("board_ideas", onSubmit);
    const trigger = view.getByRole("combobox", { name: "Board" });
    expect(trigger).toHaveTextContent("Ideas");
    expect(view.getByLabelText("Bulb")).toBeInTheDocument();
    await choose("Board", "Bugs");
    expect(trigger).toHaveTextContent("Bugs");
    press("Create");
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ boardId: "board_bugs" }),
    );
  });

  it("shows the label without a value and links the error to the trigger", async () => {
    const view = renderForm("");
    const trigger = view.getByRole("combobox", { name: "Board" });
    expect(trigger).toHaveTextContent("Board");
    press("Create");
    expect(await view.findByRole("alert")).toHaveTextContent("Choose a board.");
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAccessibleDescription("Choose a board.");
  });
});
