import { BaseError } from "@/errors";

export const MissingSignatureError = BaseError.subclass("MissingSignatureError");
export const UnexpectedTransactionEventReportError = BaseError.subclass(
  `UnexpectedTransactionEventReportError`,
);
