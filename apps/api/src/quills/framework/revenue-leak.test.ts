import { describe, expect, it, vi } from "vite-plus/test";
import { z } from "../../openapi";
import * as kaneo from "../../database/schema";
import "../index";
import "../public";
import { customerAudiences, revenueKey } from "./contract-probe";
import { registry } from "./registry";

// Revenue never reaches a customer (#79). Every portal, widget, public and signed route declares a
// response with no revenue field. The contract suite checks the real responses with the same names.

vi.mock("../../database/index", () => ({
  getDatabasePool: () => undefined,
  get schema() {
    return kaneo;
  },
  default: {},
}));

/** Every object key that a response schema can produce, with its path. */
function keys(schema: z.ZodType, path = "$"): string[] {
  if (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault
  )
    return keys(schema.unwrap() as z.ZodType, path);
  if (schema instanceof z.ZodArray)
    return keys(schema.element as z.ZodType, `${path}[]`);
  if (schema instanceof z.ZodUnion)
    return (schema.options as z.ZodType[]).flatMap((option) =>
      keys(option, path),
    );
  if (schema instanceof z.ZodIntersection)
    return [
      ...keys(schema.def.left as z.ZodType, path),
      ...keys(schema.def.right as z.ZodType, path),
    ];
  if (schema instanceof z.ZodRecord)
    return keys(schema.valueType as z.ZodType, `${path}.*`);
  if (schema instanceof z.ZodObject)
    return Object.entries(schema.shape).flatMap(([key, field]) => [
      `${path}.${key}`,
      ...keys(field as z.ZodType, `${path}.${key}`),
    ]);
  return [];
}

describe("Customer responses", () => {
  const customerRoutes = [...registry.keys()].filter((d) =>
    customerAudiences.includes(d.audience ?? "teammate"),
  );

  it("cover the customer routes", () => {
    expect(customerRoutes.length).toBeGreaterThan(50);
  });

  it("declare no revenue field", () => {
    const leaks = customerRoutes.flatMap((d) =>
      keys(d.response as z.ZodType)
        .filter((path) => revenueKey.test(path.split(".").at(-1)!))
        .map((path) => `${d.operationId}: ${path}`),
    );
    expect(leaks).toEqual([]);
  });

  it("would catch a revenue field", () => {
    const leaking = z.object({
      items: z.array(z.object({ company: z.object({ mrrCents: z.number() }) })),
    });
    expect(
      keys(leaking).filter((p) => revenueKey.test(p.split(".").at(-1)!)),
    ).toEqual(["$.items[].company.mrrCents"]);
  });
});
