import { type NextApiRequest, type NextApiResponse } from "next";
import * as Sentry from "@sentry/nextjs";
import { createLogger, redactError } from "@/lib/logger";
import { BaseError, MissingSaleorApiUrlError, MissingAuthDataError } from "@/errors";
import {
  InvalidNotificationError,
  UnexpectedTransactionEventReportError,
} from "@/modules/webhooks/stripe-webhook.errors";
import { stripeWebhookHandler } from "@/modules/webhooks/stripe-webhook";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function StripeWebhookHandler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
    return;
  }

  const logger = createLogger({}, { msgPrefix: "[StripeWebhookHandler] " });
  logger.info("Handler was called");

  try {
    await stripeWebhookHandler(req);
  } catch (err) {
    if (err instanceof BaseError) {
      Sentry.captureException(err, { extra: { errors: err.errors } });
    } else {
      Sentry.captureException(err);
    }
    logger.error(redactError(err), "stripeWebhookHandler failed");

    if (err instanceof MissingSaleorApiUrlError) {
      return res.status(400).json(MissingSaleorApiUrlError.serialize(err));
    }
    if (err instanceof MissingAuthDataError) {
      return res.status(412).json(MissingAuthDataError.serialize(err));
    }
    if (err instanceof InvalidNotificationError) {
      return res.status(400).json(InvalidNotificationError.serialize(err));
    }
    if (err instanceof UnexpectedTransactionEventReportError) {
      return res.status(500).json(UnexpectedTransactionEventReportError.serialize(err));
    }
    return res.status(500).json(BaseError.serialize(err));
  }

  logger.info("StripeWebhookHandler finished OK");
  res.status(204).end();
  return;
}
