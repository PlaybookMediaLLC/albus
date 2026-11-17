import { describe, expect, it, vi } from "vite-plus/test";
import { choose } from "../../test/actions";
import { renderComponent } from "../../test/render";
import { SourceSelect } from "./source-select";

describe("SourceSelect", () => {
  it("names the trigger, shows the source and sends the chosen one", async () => {
    const onChange = vi.fn();
    const view = renderComponent(
      <SourceSelect value="call" onChange={onChange} />,
    );
    expect(
      view.getByRole("combobox", { name: "Where you heard it" }),
    ).toHaveTextContent("Call");
    await choose("Where you heard it", "Email");
    expect(onChange).toHaveBeenCalledWith("email");
  });
});
