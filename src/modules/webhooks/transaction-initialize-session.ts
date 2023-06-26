import {
  getEnvironmentFromKey,
  getStripeExternalUrlForIntentId,
  initializeStripePaymentIntent,
  stripePaymentIntentToTransactionResult,
  transactionSessionInitializeEventToStripeCreate,
} from "../stripe/stripe-api";
import { getSaleorAmountFromStripeAmount } from "../stripe/currencies";
import { getWebhookPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import { paymentAppFullyConfiguredEntrySchema } from "../payment-app-configuration/config-entry";
import { obfuscateConfig, obfuscateValue } from "../app-configuration/utils";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
import { type TransactionInitializeSessionResponse } from "@/schemas/TransactionInitializeSession/TransactionInitializeSessionResponse.mjs";
import { type TransactionInitializeSessionEventFragment } from "generated/graphql";
import { invariant } from "@/lib/invariant";
import { createLogger } from "@/lib/logger";

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
  const configurator = getWebhookPaymentAppConfigurator({ privateMetadata }, saleorApiUrl);
  const appConfig = await configurator.getConfig();

  const stripeConfig = paymentAppFullyConfiguredEntrySchema.parse(
    getConfigurationForChannel(appConfig, event.sourceObject.channel.id),
  );

  logger.info({}, `Processing Transaction Initialize request`);

  const paymentIntentCreateParams = transactionSessionInitializeEventToStripeCreate(event);
  logger.debug({
    paymentIntentCreateParams: obfuscateConfig(paymentIntentCreateParams),
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
  logger.debug(
    {
      paymentIntent: {
        client_secret: data.paymentIntent.client_secret
          ? obfuscateValue(data.paymentIntent.client_secret)
          : "",
      },
      publishableKey: obfuscateValue(data.publishableKey),
    },
    `Transaction Initialize response`,
  );

  const result = stripePaymentIntentToTransactionResult(
    event.action.actionType,
    stripePaymentIntent,
  );
  logger.debug(result, "Stripe -> Transaction result");

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
    time: stripePaymentIntent.created
      ? new Date(stripePaymentIntent.created * 1000).toISOString()
      : undefined,
    message: stripePaymentIntent.cancellation_reason || stripePaymentIntent.description || "",
    externalUrl: stripePaymentIntent.id
      ? getStripeExternalUrlForIntentId(stripePaymentIntent.id)
      : undefined,
  };

  return transactionInitializeSessionResponse;
};
