import { describe, expect, it, vi } from "vitest";
import { tryIgnore, tryJsonParse } from "./api-route-utils";

describe("api-route-utils", () => {
  describe("tryIgnore", () => {
    it(`it should run the function`, () => {
      const fn = vi.fn();
      expect(() => tryIgnore(fn)).not.toThrow();
      expect(fn).toHaveBeenCalledOnce();
    });

    it(`it should ignore errors`, () => {
      expect(() =>
        tryIgnore(() => {
          throw new Error(`Error!`);
        }),
      ).not.toThrow();
    });
  });

  describe(`tryJsonParse`, () => {
    it(`should ignore empty input`, () => {
      expect(tryJsonParse("")).toEqual(undefined);
      expect(tryJsonParse(undefined)).toEqual(undefined);
    });

    it(`should try parsing to JSON`, () => {
      expect(tryJsonParse(`{"a": 123, "b": {"c": "aaa"}}`)).toEqual({ a: 123, b: { c: "aaa" } });
    });

    it(`should return original input in case of error`, () => {
      expect(tryJsonParse(`{"a": 123, "b" {"c": "aaa"}}`)).toEqual(`{"a": 123, "b" {"c": "aaa"}}`);
    });
  });
});
