import "next";
import { expect, afterEach } from "vitest";
import matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

/**
 * Vitest setup logic
 * https://vitest.dev/config/#setupfiles
 */

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

export {};
