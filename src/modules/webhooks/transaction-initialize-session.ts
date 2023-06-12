import { type TransactionInitializeSessionResponse } from "@/schemas/TransactionInitializeSession/TransactionInitializeSessionResponse.mjs";
import { type TransactionInitializeSessionEventFragment } from "generated/graphql";
import { invariant } from "@/lib/invariant";
import { createLogger } from "@/lib/logger";
import { getConfigurationForChannel } from "../stripe-configuration/app-configuration";
import { getWebhookAppConfigurator } from "../stripe-configuration/app-configuration-factory";
import {
  StripeEntryFullyConfigured,
  stripeFullyConfiguredEntrySchema,
} from "../stripe-configuration/stripe-entries-config";
import {
  getEnvironmentFromKey,
  getStripeExternalUrlForIntentId,
  initializeStripePaymentIntent,
  transactionInitializeSessionEventToStripe,
} from "../stripe/stripe-api";
import { JSONObject } from "@/types";
import { getSaleorAmountFromStripeAmount } from "../stripe/currencies";

export const TransactionInitializeSessionWebhookHandler = async (
  event: TransactionInitializeSessionEventFragment,
  saleorApiUrl: string,
): Promise<TransactionInitializeSessionResponse> => {
  const logger = createLogger(
    { saleorApiUrl },
    { msgPrefix: `[TransactionInitializeSessionWebhookHandler] ` },
  );
  logger.debug(
    {
      transaction: event.transaction,
      action: event.action,
      sourceObject: {
        id: event.sourceObject.id,
        channel: event.sourceObject.channel,
        __typename: event.sourceObject.__typename,
      },
      merchantReference: event.merchantReference,
    },
    `Received event`,
  );

  const app = event.recipient;
  invariant(app, `Missing event.recipient!`);

  const { privateMetadata } = app;
  const configurator = getWebhookAppConfigurator({ privateMetadata }, saleorApiUrl);
  const appConfig = await configurator.getConfig();

  const stripeConfig = stripeFullyConfiguredEntrySchema.parse(
    getConfigurationForChannel(appConfig, event.sourceObject.channel.id),
  );

  logger.info({}, `Processing Payment Gateway Initialize request`);

  const paymentIntentCreateParams = await transactionInitializeSessionEventToStripe(event);
  logger.debug({
    stripePaymentIntent: obfuscateConfig(paymentIntentCreateParams),
    environment: getEnvironmentFromKey(stripeConfig.publishableKey),
  });

  const stripePaymentIntent = await initializeStripePaymentIntent({
    paymentIntentCreateParams,
    secretKey: stripeConfig.secretKey,
  });

  const data = {
    paymentIntent: { client_secret: stripePaymentIntent.client_secret },
    publishableKey: stripeConfig.publishableKey,
  };
  const transactionInitializeSessionResponse: TransactionInitializeSessionResponse = {
    data,
    pspReference: stripePaymentIntent.id,
    result,
    amount: stripePaymentIntent.amount
      ? getSaleorAmountFromStripeAmount({
          amount: stripePaymentIntent.amount,
          currency: stripePaymentIntent.currency,
        })
      : 0,
    message: stripePaymentIntent.cancellation_reason || stripePaymentIntent.description || "",
    externalUrl: stripePaymentIntent.id
      ? getStripeExternalUrlForIntentId(stripePaymentIntent.id)
      : undefined,
  };

  return transactionInitializeSessionResponse;
};
