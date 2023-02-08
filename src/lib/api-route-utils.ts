import ModernError from "modern-errors";
import { ObjectSchema } from "yup";
import { JSONValue } from "../types";

export const JsonParseError = ModernError.subclass("JsonParseError");
export const parseJsonRequest = async <S extends ObjectSchema<{}>>(req: Request, schema: S) => {
  try {
    const json = (await req.json()) as JSONValue;
    return [null, schema.validateSync(json)] as const;
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
