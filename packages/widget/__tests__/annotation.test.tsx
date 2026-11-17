import { afterEach, expect, it, vi } from "vite-plus/test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ImageAnnotation } from "../src/ui/ImageAnnotation.js";
import { arrowHead } from "../src/ui/annotation-draw.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("draws an arrowhead behind the point, on both sides of the line", () => {
  const [ax, ay, bx, by] = arrowHead(0, 0, 100, 0, 10);
  expect(ax).toBeCloseTo(100 - 10 * Math.cos((25 * Math.PI) / 180));
  expect(bx).toBeCloseTo(ax);
  expect(ay).toBeCloseTo(-by);
  expect(ay).not.toBe(0);
});

it("adds boxes, arrows, blurs and redactions from the keyboard, and undoes them", async () => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:shot");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  // The image loads at once; happy-dom has no image decoder.
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = 800;
      naturalHeight = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    },
  );
  render(
    <ImageAnnotation
      file={new File(["png"], "shot.png", { type: "image/png" })}
      onSave={vi.fn()}
      onCancel={vi.fn()}
    />,
  );
  const tools = screen.getByRole("group", { name: "Tool" });
  expect(
    Array.from(tools.querySelectorAll("[aria-pressed]"), (b) => b.textContent),
  ).toEqual(["Box", "Arrow", "Pen", "Text", "Blur", "Redact"]);
  fireEvent.click(screen.getByRole("button", { name: "Arrow" }));
  expect(
    screen.getByRole("button", { name: "Arrow" }).getAttribute("aria-pressed"),
  ).toBe("true");
  const add = await screen.findByRole("button", { name: "Add arrow" });
  await vi.waitFor(() =>
    expect((add as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(add);
  const to = screen.getByLabelText<HTMLInputElement>("Mark to x");
  expect(to.value).toBe("50");
  fireEvent.change(to, { target: { value: "70" } });
  expect(screen.getByLabelText<HTMLInputElement>("Mark to x").value).toBe("70");
  fireEvent.click(screen.getByRole("button", { name: "Blur" }));
  fireEvent.click(screen.getByRole("button", { name: "Add blur" }));
  expect(screen.getByLabelText<HTMLInputElement>("Mark to x").value).toBe("50");
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(screen.getByLabelText<HTMLInputElement>("Mark to x").value).toBe("70");
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(screen.queryByLabelText("Mark to x")).toBeNull();
});

it("adds a pen line and text in the chosen color from the keyboard", async () => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:shot");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = 800;
      naturalHeight = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    },
  );
  render(
    <ImageAnnotation
      file={new File(["png"], "shot.png", { type: "image/png" })}
      onSave={vi.fn()}
      onCancel={vi.fn()}
    />,
  );
  const color = screen.getByLabelText<HTMLInputElement>("Color");
  expect(color.value).toBe("#e53935");
  fireEvent.change(color, { target: { value: "#1e88e5" } });
  fireEvent.click(screen.getByRole("button", { name: "Text" }));
  const add = await screen.findByRole("button", { name: "Add text" });
  await vi.waitFor(() =>
    expect((add as HTMLButtonElement).disabled).toBe(false),
  );
  fireEvent.click(add);
  fireEvent.change(screen.getByLabelText("Mark text"), {
    target: { value: "Broken here" },
  });
  expect(screen.getByLabelText<HTMLInputElement>("Mark text").value).toBe(
    "Broken here",
  );
  // Text has a place, not an end point.
  expect(screen.getByLabelText("Mark from x")).toBeTruthy();
  expect(screen.queryByLabelText("Mark to x")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Pen" }));
  fireEvent.click(screen.getByRole("button", { name: "Add pen" }));
  // A pen line has no position fields.
  expect(screen.queryByLabelText("Mark from x")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect(screen.getByLabelText<HTMLInputElement>("Mark text").value).toBe(
    "Broken here",
  );
});
