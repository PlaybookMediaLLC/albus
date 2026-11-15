import type { SyntheticEvent } from "react";
import { describe, expect, it, vi } from "vite-plus/test";
import { ownListeners } from "./card-listeners";

function eventOn(card: Element, target: Element) {
  return { currentTarget: card, target } as unknown as SyntheticEvent;
}

describe("ownListeners", () => {
  it("passes events from the card, and drops presses on a button or from outside the card", () => {
    const card = document.createElement("article");
    const link = card.appendChild(document.createElement("a"));
    const button = card.appendChild(document.createElement("button"));
    const icon = button.appendChild(document.createElement("svg"));
    const popup = document.createElement("div");
    const onMouseDown = vi.fn();
    const own = ownListeners({ onMouseDown })!;

    own.onMouseDown!(eventOn(card, link));
    expect(onMouseDown).toHaveBeenCalledOnce();
    own.onMouseDown!(eventOn(card, icon));
    own.onMouseDown!(eventOn(card, popup));
    expect(onMouseDown).toHaveBeenCalledOnce();
    expect(ownListeners(undefined)).toBeUndefined();
  });
});
