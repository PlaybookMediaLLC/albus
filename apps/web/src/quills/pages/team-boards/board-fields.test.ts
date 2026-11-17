import { describe, expect, it } from "vite-plus/test";
import { keyFrom, toFields, toRows, type BoardField } from "./board-fields";

describe("board field rows", () => {
  it("makes a key from a Latin label, else field_N", () => {
    expect(keyFrom("Company size (seats)", 0)).toBe("company_size_seats");
    expect(keyFrom("Café plan", 1)).toBe("cafe_plan");
    expect(keyFrom("الخطة", 2)).toBe("field_3");
    expect(keyFrom("2nd plan", 3)).toBe("field_4");
  });

  it("round-trips fields, with options only for select types", () => {
    const fields: BoardField[] = [
      {
        key: "plan",
        label: "Plan",
        type: "select",
        required: true,
        internal: false,
        options: ["Free", "Pro"],
      },
      {
        key: "mrr",
        label: "MRR",
        type: "number",
        required: false,
        internal: true,
      },
    ];
    expect(toFields(toRows(fields))).toEqual(fields);
    expect(
      toFields([
        {
          key: "",
          label: " Areas ",
          type: "multi_select",
          required: false,
          internal: false,
          options: "API\n\n UI \nAPI",
        },
        {
          key: "",
          label: "Note",
          type: "text",
          required: false,
          internal: false,
          options: "ignored",
        },
      ]),
    ).toEqual([
      {
        key: "areas",
        label: "Areas",
        type: "multi_select",
        required: false,
        internal: false,
        options: ["API", "UI"],
      },
      {
        key: "note",
        label: "Note",
        type: "text",
        required: false,
        internal: false,
      },
    ]);
  });
});
