import { describe, expect, it } from "vite-plus/test";
import { describeRouteContract } from "@/quills/test/contracts";
import { Route } from "./desktop";

describeRouteContract(Route);

describe("desktop sign-in route", () => {
  it("accepts only a boolean start flag", () => {
    const schema = Route.options.validateSearch as {
      parse: (value: unknown) => unknown;
    };
    expect(schema.parse({ start: true })).toEqual({ start: true });
    expect(schema.parse({ start: "yes", token: "x" })).toEqual({
      start: undefined,
    });
    expect(schema.parse({})).toEqual({});
    expect(
      schema.parse({
        link: "google",
        user: "user-1",
        linked: true,
        provider: "github",
      }),
    ).toEqual({
      link: "google",
      user: "user-1",
      linked: true,
      provider: undefined,
    });
  });
});
