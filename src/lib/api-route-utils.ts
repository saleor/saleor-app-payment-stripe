import ModernError from "modern-errors";
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
