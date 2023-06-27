import { type Readable } from "node:stream";
import { type NextApiRequest } from "next";
import type Stripe from "stripe";
import { type AuthData } from "@saleor/app-sdk/APL";
import { type Client } from "urql";
import { getStripeApiClient } from "../stripe/stripe-api";
import { getPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
import { type StripeWebhookEvents } from "../stripe/stripe-events";
import { type PaymentAppConfig } from "../payment-app-configuration/app-config";
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
} from "generated/graphql";

export const stripeWebhookHandler = async (req: NextApiRequest) => {
  const logger = createLogger({}, { msgPrefix: "[stripeWebhookHandler] " });
  const authData = await getAuthDataForRequest(req);
  const client = createClient(authData.saleorApiUrl, async () => ({ token: authData.token }));

  const stripeEvent = await requestToStripeEvent({ req, authData, client });
  if (!stripeEvent) {
    return;
  }

  const transactionEventReport = await stripeEventToTransactionEventReport(stripeEvent);
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
  authData,
  client,
}: {
  req: NextApiRequest;
  authData: AuthData;
  client: Client;
}): Promise<StripeWebhookEvents | null> {
  const logger = createLogger({}, { msgPrefix: "[requestToStripeEvent] " });

  const signature = req.headers["stripe-signature"];

  if (!signature) {
    throw new MissingSignatureError("Stripe signature is missing");
  }

  const body = await buffer(req);

  const unsafeParsedBody = JSON.parse(body.toString()) as StripeWebhookEvents;
  const channelId = getChannelIdFromEventData(unsafeParsedBody.data);

  const configurator = getPaymentAppConfigurator(client, authData.saleorApiUrl);
  const appConfig = await configurator.getConfig();
  const configEntry = getConfigurationForChannel(appConfig, channelId);

  if (!configEntry || !configEntry.secretKey) {
    logger.warn(`Missing configuration for channel ${channelId || "<undefined>"}`);
    return null;
  }

  const stripe = getStripeApiClient(configEntry.secretKey);
  const stripeEvent = (await stripe.webhooks.constructEventAsync(
    body,
    signature,
    configEntry.webhookSecret,
  )) as StripeWebhookEvents;
  return stripeEvent;
}

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const getTransactionIdFromEventData = (data: {
  object?: {
    metadata?: Stripe.Metadata | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K: string]: any;
  } | null;
}) => {
  if (data?.object && "metadata" in data.object) {
    return data.object.metadata?.["transactionId"];
  }
  return null;
};
const getChannelIdFromEventData = (data: {
  object?: {
    metadata?: Stripe.Metadata | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K: string]: any;
  } | null;
}) => {
  if (data?.object && "metadata" in data.object) {
    return data.object.metadata?.["channelId"];
  }
  return null;
};

async function stripeEventToTransactionEventReport({
  appConfig,
  stripeEvent,
}: {
  appConfig: PaymentAppConfig;
  stripeEvent: StripeWebhookEvents;
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

  throw new Error("Function not implemented.");
}
