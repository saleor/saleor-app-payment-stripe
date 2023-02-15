import ModernError from "modern-errors";
import { z } from "zod";
import { NextApiRequest } from "next";
import type { ValidateFunction } from "ajv";
import type { JSONValue } from "../types";

export const JsonParseError = ModernError.subclass("JsonParseError");
export const JsonSchemaError = ModernError.subclass("JsonSchemaError");
export const parseJsonRequest = async <S extends ValidateFunction>(req: Request, validate: S) => {
  type Result = S extends ValidateFunction<infer T> ? T : never;
  try {
    const json: unknown = await req.json();
    const isValid = validate(json);
    if (isValid) {
      return [null, json as Result] as const;
    } else {
      return [JsonSchemaError.normalize(validate.errors), null] as const;
    }
  } catch (err) {
    return [JsonParseError.normalize(err), null] as const;
  }
};

export const parseRawBodyToJson = async <T>(req: NextApiRequest, schema: z.ZodType<T>) => {
  try {
    if (typeof req.body !== "string") {
      throw new JsonParseError("Invalid body type");
    }
    if (req.body === "") {
      throw new JsonParseError("No request body");
    }
    const json = JSON.parse(req.body) as unknown;
    return [null, schema.parse(json)] as const;
  } catch (err) {
    return [JsonParseError.normalize(err), null] as const;
  }
};

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

export const UnknownError = ModernError.subclass("UnknownError");

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
