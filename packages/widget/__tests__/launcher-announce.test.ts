// @vitest-environment happy-dom
// #108: the launcher shows a new changelog entry's title; a click opens that entry, × hides it.
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createLauncher } from "../src/core/launcher";

const bubble = () =>
  [...document.body.children].find(
    (el) => el.tagName === "DIV" && el.querySelector("[aria-label=Dismiss]"),
  ) as HTMLElement;
const text = () => bubble().querySelector("button") as HTMLButtonElement;
const dismiss = () =>
  bubble().querySelector("[aria-label=Dismiss]") as HTMLButtonElement;

describe("launcher announcement", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    sessionStorage.clear();
  });

  it("shows the title over the greeting and opens the entry on click", () => {
    const onClick = vi.fn();
    const onOpen = vi.fn();
    const launcher = createLauncher({ placement: "right", onClick });
    launcher.setGreeting("Hi there");
    launcher.announce("Roadmap export to CSV", onOpen);
    expect(bubble().style.display).toBe("flex");
    expect(text().textContent).toBe("New: Roadmap export to CSV");
    text().click();
    expect(onOpen).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
    // The greeting comes back; the announcement does not show again.
    expect(text().textContent).toBe("Hi there");
  });

  it("hides while the widget is open and after a dismiss, without dismissing the greeting", () => {
    const launcher = createLauncher({ placement: "right", onClick: vi.fn() });
    launcher.announce("Dark mode", vi.fn());
    launcher.setOpen(true);
    expect(bubble().style.display).toBe("none");
    launcher.setOpen(false);
    expect(bubble().style.display).toBe("flex");
    dismiss().click();
    expect(bubble().style.display).toBe("none");
    launcher.setGreeting("Hi there");
    expect(bubble().style.display).toBe("flex");
    expect(text().textContent).toBe("Hi there");
  });

  it("writes the announcement in the visitor's language", () => {
    const launcher = createLauncher({
      placement: "right",
      onClick: vi.fn(),
      locale: () => "fr-CA",
    });
    launcher.announce("Export CSV", vi.fn());
    expect(text().textContent).toBe("Nouveau : Export CSV");
  });
});
