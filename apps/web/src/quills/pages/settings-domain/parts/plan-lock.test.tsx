import { describe, expect, it } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { PlanLock } from "./plan-lock";

describe("PlanLock", () => {
  it("names the reason of the lock", () => {
    const view = renderComponent(<PlanLock />);
    expect(
      view.getByRole("img", { name: "Needs an active plan" }),
    ).toBeInTheDocument();
  });
});
