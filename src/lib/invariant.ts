import ModernError from "modern-errors";

export const InvariantError = ModernError.subclass("InvariantError");

export default function invariant(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new InvariantError(`Invariant failed: ${message || ""}`);
  }
}
