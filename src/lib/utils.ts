import type { JSONValue } from "../types";
import { UnknownError } from "@/errors";

export const tryJsonParse = (text: string | undefined) => {
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as JSONValue;
  } catch (e) {
    return text;
  }
};

export const tryIgnore = (fn: () => void) => {
  try {
    fn();
  } catch {
    // noop
  }
};

export const toStringOrEmpty = (value: unknown) => {
  if (typeof value === "string") return value;
  return "";
};

type PromiseToTupleResult<T> = [Error, null] | [null, Awaited<T>];
export const unpackPromise = async <T extends Promise<unknown>>(
  promise: T,
): Promise<PromiseToTupleResult<T>> => {
  try {
    const result = await promise;
    return [null, result];
  } catch (maybeError) {
    return [UnknownError.normalize(maybeError), null];
  }
};

type ThrowableToTupleResult<T> = [Error, null] | [null, T];
export const unpackThrowable = <T>(throwable: () => T): ThrowableToTupleResult<T> => {
  try {
    const result = throwable();
    return [null, result];
  } catch (maybeError) {
    return [UnknownError.normalize(maybeError), null];
  }
};
export const isNotNullish = <T>(val: T | null | undefined): val is T =>
  val !== undefined && val !== null;
