import { describe, expect, it } from "vite-plus/test";
import {
  missingFields,
  toFieldValues,
  type PublicField,
} from "./composer-fields";

const fields: PublicField[] = [
  {
    key: "plan",
    label: "Plan",
    type: "select",
    required: true,
    options: ["Free", "Pro"],
  },
  { key: "seats", label: "Seats", type: "number", required: false },
  {
    key: "areas",
    label: "Areas",
    type: "multi_select",
    required: false,
    options: ["API"],
  },
  { key: "ok", label: "I agree", type: "checkbox", required: true },
  { key: "note", label: "Note", type: "text", required: false },
];

describe("composer fields", () => {
  it("sends typed values and leaves empty inputs out", () => {
    expect(
      toFieldValues(fields, {
        plan: "Pro",
        seats: "3",
        areas: [],
        ok: true,
        note: "  ",
      }),
    ).toEqual({ plan: "Pro", seats: 3, ok: true });
  });

  it("finds required fields without a value, an unchecked required checkbox included", () => {
    expect(missingFields(fields, { ok: false }).map((f) => f.key)).toEqual([
      "plan",
      "ok",
    ]);
    expect(missingFields(fields, { plan: "Free", ok: true })).toEqual([]);
  });
});
