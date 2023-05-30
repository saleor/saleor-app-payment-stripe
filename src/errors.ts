import ModernError from "modern-errors";
import ModernErrorsSerialize from "modern-errors-serialize";

// Http errors
type CommonProps = {};

export const BaseError = ModernError.subclass("BaseError", {
  plugins: [ModernErrorsSerialize],
  props: {} as CommonProps,
});
export const UnknownError = BaseError.subclass("UnknownError");
export const JsonParseError = ModernError.subclass("JsonParseError");
export const JsonSchemaError = ModernError.subclass("JsonSchemaError");
export const MissingSaleorApiUrlError = BaseError.subclass(`MissingSaleorApiUrlError`);
export const MissingAuthDataError = BaseError.subclass(`MissingAuthDataError`);
