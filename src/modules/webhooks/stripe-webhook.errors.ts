import { BaseError } from "@/errors";

export const MissingSignatureError = BaseError.subclass("MissingSignatureError");
export const InvalidNotificationError = BaseError.subclass("InvalidNotificationError");
export const UnexpectedTransactionEventReportError = BaseError.subclass(
  `UnexpectedTransactionEventReportError`,
);
