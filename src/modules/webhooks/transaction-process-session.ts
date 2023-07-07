import { obfuscateConfig, obfuscateValue } from "../app-configuration/utils";
import { paymentAppFullyConfiguredEntrySchema } from "../payment-app-configuration/config-entry";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
import { getWebhookPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import {
  transactionSessionProcessEventToStripeUpdate,
  getEnvironmentFromKey,
  stripePaymentIntentToTransactionResult,
  getStripeExternalUrlForIntentId,
  updateStripePaymentIntent,
} from "../stripe/stripe-api";
import { getSaleorAmountFromStripeAmount } from "../stripe/currencies";
import { type TransactionProcessSessionEventFragment } from "generated/graphql";
import { type TransactionProcessSessionResponse } from "@/schemas/TransactionProcessSession/TransactionProcessSessionResponse.mjs";
import { createLogger } from "@/lib/logger";
import { invariant } from "@/lib/invariant";

export const TransactionProcessSessionWebhookHandler = async (
  event: TransactionProcessSessionEventFragment,
  saleorApiUrl: string,
): Promise<TransactionProcessSessionResponse> => {
  const logger = createLogger({}, { msgPrefix: `[TransactionProcessSessionWebhookHandler] ` });
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

  const paymentIntentUpdateParams = transactionSessionProcessEventToStripeUpdate(event);
  logger.debug({
    paymentIntentUpdateParams: obfuscateConfig(paymentIntentUpdateParams),
    environment: getEnvironmentFromKey(stripeConfig.publishableKey),
  });

  const stripePaymentIntent = await updateStripePaymentIntent({
    intentId: event.transaction.pspReference,
    paymentIntentUpdateParams,
    secretKey: stripeConfig.secretKey,
  });
  console.log({
    paymentIntentUpdateParams,
    stripePaymentIntent,
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
    `Transaction Process response`,
  );

  const result = stripePaymentIntentToTransactionResult(
    event.action.actionType,
    stripePaymentIntent,
  );
  logger.debug(result, "Stripe -> Transaction result");

  const transactionProcessSessionResponse: TransactionProcessSessionResponse = {
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
  return transactionProcessSessionResponse;
};
