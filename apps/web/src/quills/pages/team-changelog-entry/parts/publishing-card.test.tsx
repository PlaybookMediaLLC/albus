import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { PublishingCard } from "./publishing-card";

describe("PublishingCard", () => {
  it("switches to later and shows the date field only then", () => {
    const onWhenChange = vi.fn();
    const onAtChange = vi.fn();
    const props = {
      at: "",
      onAtChange,
      onWhenChange,
      link: "https://kaneo.test/portal/w/changelog/c",
    };
    const view = renderComponent(<PublishingCard when="now" {...props} />);
    expect(view.queryByLabelText("Date")).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Later" }));
    expect(onWhenChange).toHaveBeenCalledWith("later");
    view.rerender(<PublishingCard when="later" {...props} />);
    fireEvent.change(view.getByLabelText("Date"), {
      target: { value: "2030-01-02T09:30" },
    });
    expect(onAtChange).toHaveBeenCalledWith("2030-01-02T09:30");
    expect(view.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });
});
