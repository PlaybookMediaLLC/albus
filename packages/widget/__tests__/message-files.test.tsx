import { afterEach, expect, it, vi } from "vite-plus/test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MessageFiles } from "../src/ui/MessageFiles.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const files = [{ id: "file_1", name: "invoice.pdf" }];
const fakeTab = () => ({
  opener: window,
  location: { href: "" },
  close: vi.fn(),
});

it("opens the tab on click and points it at the file's URL", async () => {
  const tab = fakeTab();
  vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
  const onOpen = vi.fn(async () => "https://storage.example.test/a.pdf");
  render(<MessageFiles files={files} onOpen={onOpen} />);
  fireEvent.click(screen.getByRole("button", { name: "invoice.pdf" }));
  expect(window.open).toHaveBeenCalledWith("", "_blank");
  await waitFor(() =>
    expect(tab.location.href).toBe("https://storage.example.test/a.pdf"),
  );
  expect(tab.opener).toBeNull();
  expect(onOpen).toHaveBeenCalledWith("file_1");
});

it("closes the tab and says so when the file cannot be opened", async () => {
  const tab = fakeTab();
  vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);
  render(
    <MessageFiles
      files={files}
      onOpen={() => Promise.reject(new Error("gone"))}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "invoice.pdf" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Could not open the file.",
  );
  expect(tab.close).toHaveBeenCalledOnce();
});

it("shows only the names without a way to open them", () => {
  render(<MessageFiles files={files} />);
  expect(screen.getByText("invoice.pdf")).toBeTruthy();
  expect(screen.queryByRole("button")).toBeNull();
});

it("fails without moving the widget when the browser blocks the tab", async () => {
  vi.spyOn(window, "open").mockReturnValue(null);
  const onOpen = vi.fn(async () => "https://storage.example.test/a.png");
  render(<MessageFiles files={files} onOpen={onOpen} />);
  fireEvent.click(screen.getByRole("button", { name: "invoice.pdf" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Could not open the file.",
  );
  expect(onOpen).not.toHaveBeenCalled();
});
