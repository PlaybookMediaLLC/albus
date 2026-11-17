import { describe, expect, it } from "vite-plus/test";
import { composerSchema, fieldsOfBoard } from "./composer-schema";

const schema = composerSchema({
  titleRequired: "Title required",
  boards: [
    {
      id: "b1",
      fields: [
        {
          key: "plan",
          label: "Plan",
          type: "select",
          required: true,
          options: ["Pro"],
        },
      ],
    },
    { id: "b2" },
  ],
  fieldRequired: (label) => `${label} is required`,
});

describe("fieldsOfBoard", () => {
  it("finds the board's fields, else none", () => {
    const fields = [
      { key: "a", label: "A", type: "text" as const, required: false },
    ];
    expect(fieldsOfBoard([{ id: "b1", fields }], "b1")).toBe(fields);
    expect(fieldsOfBoard([{ id: "b1" }], "b1")).toEqual([]);
    expect(fieldsOfBoard([], undefined)).toEqual([]);
  });
});

describe("composerSchema", () => {
  it("asks for the title and the chosen board's required fields only", () => {
    const missing = schema.safeParse({ boardId: "b1", title: "", content: "" });
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.message)).toEqual([
      "Title required",
      "Plan is required",
    ]);
    expect(
      schema.safeParse({ boardId: "b2", title: "Idea", content: "" }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        boardId: "b1",
        title: "Idea",
        content: "",
        customFields: { plan: "Pro" },
      }).success,
    ).toBe(true);
  });
});
