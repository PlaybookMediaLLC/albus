import { describe, it, expect } from "vite-plus/test";
import Quills, {
  Quackback,
  Quills as NamedQuills,
  type InitOptions,
} from "../src";

describe("public API", () => {
  it("exports the expected surface", () => {
    expect(typeof Quills.init).toBe("function");
    expect(typeof Quills.identify).toBe("function");
    expect(typeof Quills.logout).toBe("function");
    expect(typeof Quills.open).toBe("function");
    expect(typeof Quills.close).toBe("function");
    expect(typeof Quills.showLauncher).toBe("function");
    expect(typeof Quills.hideLauncher).toBe("function");
    expect(typeof Quills.isOpen).toBe("function");
    expect(typeof Quills.getUser).toBe("function");
    expect(typeof Quills.isIdentified).toBe("function");
    expect(typeof Quills.on).toBe("function");
    expect(typeof Quills.off).toBe("function");
    expect(typeof Quills.metadata).toBe("function");
    expect(typeof Quills.destroy).toBe("function");
    expect(typeof Quills.version).toBe("string");
  });

  it("init throws when instanceUrl is missing", () => {
    expect(() => Quills.init({} as InitOptions)).toThrow(/instanceUrl/);
  });

  it("init throws when workspace is missing", () => {
    expect(() =>
      Quills.init({
        instanceUrl: "https://kaneo.example.com",
      } as InitOptions),
    ).toThrow(/workspace/);
  });
});

describe("the names before the rename", () => {
  it("keeps Quackback as an alias of the Quills singleton", () => {
    expect(NamedQuills).toBe(Quills);
    expect(Quackback).toBe(Quills);
  });
});
