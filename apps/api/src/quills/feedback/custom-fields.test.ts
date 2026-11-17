import { describe, expect, it } from "vite-plus/test";
import {
  checkValues,
  fieldDefinitions,
  fieldsOf,
  visibleValues,
  type Field,
} from "./custom-fields";

const fields: Field[] = fieldDefinitions.parse([
  {
    key: "plan",
    label: "Plan",
    type: "select",
    required: true,
    options: ["Free", "Pro"],
  },
  { key: "seats", label: "Seats", type: "number" },
  {
    key: "areas",
    label: "Areas",
    type: "multi_select",
    options: ["API", "UI"],
  },
  { key: "consent", label: "I agree", type: "checkbox" },
  { key: "due", label: "Due", type: "date" },
  { key: "note", label: "Note", type: "text" },
  { key: "mrr", label: "MRR", type: "number", required: true, internal: true },
]);
const customer = { team: false };
const team = { team: true };

describe("board custom fields", () => {
  it("rejects bad definitions", () => {
    for (const bad of [
      [{ key: "Plan", label: "Plan", type: "text" }],
      [{ key: "plan", label: "Plan", type: "select" }],
      [{ key: "plan", label: "Plan", type: "text", options: ["a"] }],
      [{ key: "plan", label: "Plan", type: "select", options: ["a", "a"] }],
      [
        { key: "plan", label: "A", type: "text" },
        { key: "plan", label: "B", type: "text" },
      ],
      Array.from({ length: 21 }, (_, i) => ({
        key: `f${i}`,
        label: "F",
        type: "text",
      })),
    ])
      expect(fieldDefinitions.safeParse(bad).success).toBe(false);
  });

  it("reads malformed settings as no fields", () => {
    expect(fieldsOf(null)).toEqual([]);
    expect(fieldsOf({ customFields: "nope" })).toEqual([]);
  });

  it("accepts each type and stores trimmed, unique values", () => {
    expect(
      checkValues(
        fields,
        {
          plan: "Pro",
          seats: 3,
          areas: ["API", "API", "UI"],
          consent: false,
          due: "2026-02-28",
          note: "  hi  ",
        },
        customer,
      ),
    ).toEqual({
      plan: "Pro",
      seats: 3,
      areas: ["API", "UI"],
      consent: false,
      due: "2026-02-28",
      note: "hi",
    });
  });

  it("rejects a missing required value and a value of the wrong type", () => {
    const bad: Array<[Record<string, unknown>, string]> = [
      [{}, 'Field "plan" is required'],
      [{ plan: "Gold" }, 'Field "plan" needs one of its options'],
      [{ plan: "Pro", seats: "3" }, 'Field "seats" needs a number value'],
      [
        { plan: "Pro", areas: ["CLI"] },
        'Field "areas" needs a list of its options',
      ],
      [
        { plan: "Pro", consent: "yes" },
        'Field "consent" needs a checkbox value',
      ],
      [{ plan: "Pro", due: "2026-02-30" }, 'Field "due" needs a date value'],
      [{ plan: "Pro", note: 5 }, 'Field "note" needs a text value'],
      [{ plan: "Pro", other: "x" }, 'Unknown field "other"'],
    ];
    for (const [input, message] of bad)
      expect(() => checkValues(fields, input as never, customer)).toThrow(
        message,
      );
  });

  it("never lets a customer set an internal field, and checks a teammate's required internal field", () => {
    expect(() =>
      checkValues(fields, { plan: "Pro", mrr: 10 }, customer),
    ).toThrow('Unknown field "mrr"');
    expect(checkValues(fields, { plan: "Pro" }, customer)).toEqual({
      plan: "Pro",
    });
    expect(() => checkValues(fields, { plan: "Pro" }, team)).toThrow(
      'Field "mrr" is required',
    );
    expect(checkValues(fields, { plan: "Pro", mrr: 10 }, team)).toEqual({
      plan: "Pro",
      mrr: 10,
    });
    expect(checkValues(fields, {}, { ...team, requireAll: false })).toBeNull();
  });

  it("requires a required checkbox to be checked", () => {
    const consent = fieldDefinitions.parse([
      { key: "consent", label: "I agree", type: "checkbox", required: true },
    ]);
    expect(() => checkValues(consent, { consent: false }, customer)).toThrow(
      "is required",
    );
    expect(checkValues(consent, { consent: true }, customer)).toEqual({
      consent: true,
    });
  });

  it("merges an update, clears with null, and keeps values of removed fields", () => {
    const current = { plan: "Free", mrr: 5, gone: "kept" };
    expect(
      checkValues(fields, { plan: "Pro", note: null }, { ...team, current }),
    ).toEqual({
      plan: "Pro",
      mrr: 5,
      gone: "kept",
    });
    expect(() =>
      checkValues(fields, { plan: null }, { ...team, current }),
    ).toThrow('Field "plan" is required');
  });

  it("shows only current, well-typed values, and no internal value to a customer", () => {
    const settings = { customFields: fields };
    const stored = { plan: "Pro", mrr: 10, seats: "three", gone: "x" };
    expect(visibleValues(settings, stored, true)).toEqual({
      plan: "Pro",
      mrr: 10,
    });
    expect(visibleValues(settings, stored, false)).toEqual({ plan: "Pro" });
    expect(visibleValues(settings, null, false)).toEqual({});
  });
});
