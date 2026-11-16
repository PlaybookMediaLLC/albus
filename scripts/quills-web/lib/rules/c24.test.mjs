import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bannedClass } from "./c24.mjs";

describe("C24 class tokens", () => {
  for (const token of [
    "text-[11px]",
    "!text-[13px]",
    "text-[13px]!",
    "md:!text-[13px]",
    "text-[11px]/5",
    "bg-blue-600",
    "dark:text-orange-800",
    "!bg-blue-600",
    "bg-red-600/40",
    "text-white",
    "prose",
    "prose-sm",
    "dark:prose-invert",
    "before:hidden",
    "before:hidden!",
  ])
    it(`rejects ${token}`, () => assert.ok(bannedClass(token)));

  for (const token of [
    "kaneo-comment-editor-prose",
    "portal-prose",
    "text-xs",
    "text-warning-foreground",
    "bg-primary/10",
    "sm:size-8",
    "sm:h-full",
    "before:rounded-full",
    "max-w-[80%]",
  ])
    it(`accepts ${token}`, () => assert.equal(bannedClass(token), undefined));
});
