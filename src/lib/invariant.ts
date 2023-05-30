import ModernError from "modern-errors";

export const InvariantError = ModernError.subclass("InvariantError");

export function invariant(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new InvariantError(`Invariant failed: ${message || ""}`);
  }
}

/* c8 ignore start */
export function assertUnreachableButNotThrow(_: never) {
  return null as never;
}
/* c8 ignore stop */
