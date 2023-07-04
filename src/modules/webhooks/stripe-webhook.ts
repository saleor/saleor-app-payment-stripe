import "stripe-event-types";
import { type Readable } from "node:stream";
import * as Sentry from "@sentry/nextjs";
import { type NextApiRequest } from "next";
import Stripe from "stripe";
import { type Client } from "urql";
import { getStripeApiClient, getStripeExternalUrlForIntentId } from "../stripe/stripe-api";
import { getPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
import { type PaymentAppConfig } from "../payment-app-configuration/app-config";
import { getSaleorAmountFromStripeAmount } from "../stripe/currencies";
import {
  MissingSignatureError,
  UnexpectedTransactionEventReportError,
} from "./stripe-webhook.errors";
import { createClient } from "@/lib/create-graphq-client";
import { getAuthDataForRequest } from "@/backend-lib/api-route-utils";
import { createLogger } from "@/lib/logger";
import {
  type TransactionEventReportMutation,
  type TransactionEventReportMutationVariables,
  UntypedTransactionEventReportDocument,
  TransactionEventTypeEnum,
  TransactionActionEnum,
} from "generated/graphql";
import { assertUnreachableButNotThrow } from "@/lib/invariant";
import { unpackPromise } from "@/lib/utils";

export const stripeWebhookHandler = async (req: NextApiRequest) => {
  const logger = createLogger({}, { msgPrefix: "[stripeWebhookHandler] " });
  const authData = await getAuthDataForRequest(req);
  const client = createClient(authData.saleorApiUrl, async () => ({ token: authData.token }));
  const configurator = getPaymentAppConfigurator(client, authData.saleorApiUrl);
  const appConfig = await configurator.getConfig();

  const stripeEvent = await requestToStripeEvent({ req, appConfig });
  if (!stripeEvent) {
    return;
  }

  const transactionEventReport = await stripeEventToTransactionEventReport({
    appConfig,
    stripeEvent,
  });
  logger.debug({
    transactionEventReport: transactionEventReport && {
      transactionId: transactionEventReport.transactionId,
      availableActions: transactionEventReport.availableActions,
      pspReference: transactionEventReport.pspReference,
      externalUrl: transactionEventReport.externalUrl,
      message: transactionEventReport.message,
      type: transactionEventReport.type,
      time: transactionEventReport.time,
    },
  });

  if (!transactionEventReport) {
    return;
  }

  const transactionEventReportResult = await processTransactionEventReport({
    client,
    transactionEventReport,
  });
  logger.debug(
    {
      alreadyProcessed: transactionEventReportResult.data?.transactionEventReport?.alreadyProcessed,
      errors: transactionEventReportResult.errors,
    },
    "Received response from event report",
  );

  if (transactionEventReportResult.errors.length > 0) {
    const message = transactionEventReportResult.errors.map((err) => err.message).join(`\n`);
    throw new UnexpectedTransactionEventReportError(message, {
      errors: transactionEventReportResult.errors,
    });
  }
  return transactionEventReportResult;
};

async function processTransactionEventReport({
  client,
  transactionEventReport,
}: {
  client: Client;
  transactionEventReport: TransactionEventReportMutationVariables;
}) {
  const { data, error } = await client
    .mutation<TransactionEventReportMutation, TransactionEventReportMutationVariables>(
      UntypedTransactionEventReportDocument,
      transactionEventReport,
    )
    .toPromise();

  const errors = [error, ...(data?.transactionEventReport?.errors || [])].filter(Boolean);
  return { data, errors };
}

async function requestToStripeEvent({
  req,
  appConfig,
}: {
  req: NextApiRequest;
  appConfig: PaymentAppConfig;
}): Promise<Stripe.DiscriminatedEvent | null> {
  const logger = createLogger({}, { msgPrefix: "[requestToStripeEvent] " });

  const signature = req.headers["stripe-signature"];

  if (!signature) {
    throw new MissingSignatureError("Stripe signature is missing");
  }

  const body = await buffer(req);

  const unsafeParsedBody = JSON.parse(body.toString()) as Stripe.DiscriminatedEvent;
  const channelId = getChannelIdFromEventData(unsafeParsedBody.data);

  const configEntry = getConfigurationForChannel(appConfig, channelId);

  if (!configEntry || !configEntry.secretKey) {
    logger.warn(`Missing configuration for channel ${channelId || "<undefined>"}`);
    return null;
  }

  const stripe = getStripeApiClient(configEntry.secretKey);
  const [stripeEventError, stripeEvent] = await unpackPromise(
    stripe.webhooks.constructEventAsync(
      body,
      signature,
      configEntry.webhookSecret,
    ) as Promise<Stripe.DiscriminatedEvent>,
  );

  if (stripeEventError instanceof Stripe.errors.StripeSignatureVerificationError) {
    logger.warn(
      { message: stripeEventError.message, name: stripeEventError.name },
      `Invalid signature for event`,
    );
    return null;
  } else if (stripeEventError) {
    Sentry.captureException(stripeEventError);
    logger.error({ message: stripeEventError.message, name: stripeEventError.name });
    return null;
  }

  return stripeEvent;
}

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const getTransactionIdFromEventData = <T>(data?: T) => {
  if (
    typeof data === "object" &&
    data &&
    "object" in data &&
    typeof data?.object === "object" &&
    data?.object &&
    "metadata" in data.object &&
    typeof data.object.metadata === "object" &&
    data.object.metadata &&
    "transactionId" in data.object.metadata &&
    typeof data.object.metadata.transactionId === "string"
  ) {
    return data.object.metadata.transactionId;
  }
  return null;
};
const getChannelIdFromEventData = <T>(data?: T) => {
  if (
    typeof data === "object" &&
    data &&
    "object" in data &&
    typeof data.object === "object" &&
    data?.object &&
    "metadata" in data.object &&
    typeof data.object.metadata === "object" &&
    data.object.metadata &&
    "channelId" in data.object.metadata &&
    typeof data.object.metadata.channelId === "string"
  ) {
    return data.object.metadata.channelId;
  }
  return null;
};

async function stripeEventToTransactionEventReport({
  appConfig,
  stripeEvent,
}: {
  appConfig: PaymentAppConfig;
  stripeEvent: Stripe.DiscriminatedEvent;
}): Promise<TransactionEventReportMutationVariables | null> {
  const logger = createLogger({}, { msgPrefix: "[stripeEventToTransactionEventReport] " });

  const transactionId = getTransactionIdFromEventData(stripeEvent.data);
  if (!transactionId) {
    logger.warn(`stripeEvent is missing metadata.transactionId`);
    return null;
  }
  const channelId = getChannelIdFromEventData(stripeEvent.data);
  if (!channelId) {
    logger.warn(`stripeEvent is missing metadata.channelId`);
    return null;
  }

  const adyenConfig = getConfigurationForChannel(appConfig, channelId);
  if (!adyenConfig) {
    logger.warn(`Missing configuration for channel: ${channelId}`);
    return null;
  }

  return stripeEventToTransactionEventReportMutationVariables(transactionId, stripeEvent);
}

async function stripeEventToTransactionEventReportMutationVariables(
  transactionId: string,
  stripeEvent: Stripe.DiscriminatedEvent,
): Promise<TransactionEventReportMutationVariables | null> {
  const logger = createLogger(
    {},
    { msgPrefix: `[stripeEventToTransactionEventReportMutationVariables] ` },
  );

  const partialVariables =
    stripeEventToPartialToTransactionEventReportMutationVariables(stripeEvent);
  if (!partialVariables) {
    return null;
  }

  const availableActions = getAvailableActionsForType(partialVariables.type);

  const result = {
    transactionId,
    amount: partialVariables.amount,
    externalUrl: partialVariables.externalUrl,
    message: partialVariables.message,
    pspReference: partialVariables.pspReference,
    time: new Date(stripeEvent.created * 1000).toISOString(),
    type: partialVariables.type,
    availableActions,
  };
  logger.debug(
    {
      transactionId: result.transactionId,
      message: result.message,
      pspReference: result.pspReference,
      time: result.time,
      type: result.type,
      availableActions: result.availableActions,
    },
    "Result",
  );
  return result;
}

const getAvailableActionsForType = (
  type: TransactionEventTypeEnum,
): readonly TransactionActionEnum[] => {
  switch (type) {
    case TransactionEventTypeEnum.AuthorizationAdjustment:
      return [TransactionActionEnum.Cancel];
    case TransactionEventTypeEnum.AuthorizationSuccess:
      return [TransactionActionEnum.Charge, TransactionActionEnum.Cancel];
    case TransactionEventTypeEnum.ChargeSuccess:
      return [TransactionActionEnum.Refund];
    case TransactionEventTypeEnum.RefundReverse:
      return [TransactionActionEnum.Refund];

    // no actions possible
    case TransactionEventTypeEnum.AuthorizationActionRequired:
    case TransactionEventTypeEnum.AuthorizationFailure:
    case TransactionEventTypeEnum.AuthorizationRequest:
    case TransactionEventTypeEnum.CancelFailure:
    case TransactionEventTypeEnum.CancelRequest:
    case TransactionEventTypeEnum.CancelSuccess:
    case TransactionEventTypeEnum.ChargeActionRequired:
    case TransactionEventTypeEnum.ChargeBack:
    case TransactionEventTypeEnum.ChargeFailure:
    case TransactionEventTypeEnum.ChargeRequest:
    case TransactionEventTypeEnum.Info:
    case TransactionEventTypeEnum.RefundFailure:
    case TransactionEventTypeEnum.RefundRequest:
    case TransactionEventTypeEnum.RefundSuccess:
      return [];
    default:
      assertUnreachableButNotThrow(type);
      return [];
  }
};

function stripeEventToPartialToTransactionEventReportMutationVariables(
  stripeEvent: Stripe.DiscriminatedEvent,
) {
  switch (stripeEvent.type) {
    case "payment_intent.succeeded":
    case "payment_intent.processing":
    case "payment_intent.payment_failed":
    case "payment_intent.created":
    case "payment_intent.canceled":
    case "payment_intent.partially_funded":
    case "payment_intent.amount_capturable_updated":
    case "payment_intent.requires_action":
      return stripePaymentIntentEventToPartialToTransactionEventReportMutationVariables(
        stripeEvent,
      );
    default:
      return null;
  }
}

function stripePaymentIntentEventToPartialToTransactionEventReportMutationVariables(
  stripeEvent: Stripe.DiscriminatedEvent.PaymentIntentEvent,
) {
  const paymentIntent = stripeEvent.data.object;
  const message = paymentIntent.cancellation_reason || paymentIntent.description || "";
  const manualCapture = stripeEvent.data.object.capture_method === "manual";
  const externalUrl = getStripeExternalUrlForIntentId(paymentIntent.id);
  const pspReference = paymentIntent.id;

  switch (stripeEvent.type) {
    // handling these is required
    case "payment_intent.succeeded": {
      const amount = getSaleorAmountFromStripeAmount({
        amount: manualCapture ? paymentIntent.amount_capturable : paymentIntent.amount_received,
        currency: paymentIntent.currency,
      });
      const type = manualCapture
        ? TransactionEventTypeEnum.AuthorizationSuccess
        : TransactionEventTypeEnum.ChargeSuccess;

      return { amount, type, externalUrl, pspReference, message };
    }

    case "payment_intent.processing": {
      const amount = getSaleorAmountFromStripeAmount({
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
      const type = manualCapture
        ? TransactionEventTypeEnum.AuthorizationRequest
        : TransactionEventTypeEnum.ChargeRequest;
      return { amount, type, externalUrl, pspReference, message };
    }

    case "payment_intent.payment_failed": {
      const amount = getSaleorAmountFromStripeAmount({
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
      const type = manualCapture
        ? TransactionEventTypeEnum.AuthorizationFailure
        : TransactionEventTypeEnum.ChargeFailure;
      return { amount, type, externalUrl, pspReference, message };
    }

    // additional events
    case "payment_intent.created": {
      const amount = getSaleorAmountFromStripeAmount({
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
      const type = manualCapture
        ? TransactionEventTypeEnum.AuthorizationRequest
        : TransactionEventTypeEnum.ChargeRequest;
      return { amount, type, externalUrl, pspReference, message };
    }

    case "payment_intent.canceled": {
      const amount = getSaleorAmountFromStripeAmount({
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
      const type = manualCapture
        ? TransactionEventTypeEnum.AuthorizationFailure
        : TransactionEventTypeEnum.ChargeFailure;
      return { amount, type, externalUrl, pspReference, message };
    }

    case "payment_intent.partially_funded": {
      const amount = getSaleorAmountFromStripeAmount({
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
      const type = TransactionEventTypeEnum.Info;
      return { amount, type, externalUrl, pspReference, message };
    }

    case "payment_intent.amount_capturable_updated": {
      const amount = getSaleorAmountFromStripeAmount({
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
      const type = TransactionEventTypeEnum.Info;
      return { amount, type, externalUrl, pspReference, message };
    }

    case "payment_intent.requires_action": {
      const amount = getSaleorAmountFromStripeAmount({
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
      const type = manualCapture
        ? TransactionEventTypeEnum.AuthorizationActionRequired
        : TransactionEventTypeEnum.ChargeActionRequired;
      return { amount, type, externalUrl, pspReference, message };
    }

    default:
      assertUnreachableButNotThrow(stripeEvent.type);
      return null;
  }
}
