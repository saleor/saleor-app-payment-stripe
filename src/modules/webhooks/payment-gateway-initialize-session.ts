import { getWebhookAppConfigurator } from "../stripe-configuration/app-configuration-factory";
import { type StripeEntryFullyConfigured } from "../stripe-configuration/stripe-entries-config";
import { getConfigurationForChannel } from "../stripe-configuration/app-configuration";
import { stripeFullyConfiguredEntrySchema } from "../stripe-configuration/stripe-entries-config";
import {
  paymentGatewayInitializeSessionEventToStripe,
  initializeStripePaymentIntent,
} from "@/modules/stripe/stripe-api";
import { type PaymentGatewayInitializeSessionResponse } from "@/schemas/PaymentGatewayInitializeSession/PaymentGatewayInitializeSessionResponse.mjs";
import { type PaymentGatewayInitializeSessionEventFragment } from "generated/graphql";
import { invariant } from "@/lib/invariant";
import { type JSONObject } from "@/types";
import { createLogger } from "@/lib/logger";

export const PaymentGatewayInitializeSessionWebhookHandler = async (
  event: PaymentGatewayInitializeSessionEventFragment,
  saleorApiUrl: string,
): Promise<PaymentGatewayInitializeSessionResponse> => {
  const logger = createLogger(
    {},
    { msgPrefix: `[PaymentGatewayInitializeSessionWebhookHandler] ` },
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
  return paymentGatewayInitialize({ event, stripeConfig });
};

const paymentGatewayInitialize = async ({
  event,
  stripeConfig,
}: {
  event: PaymentGatewayInitializeSessionEventFragment;
  stripeConfig: StripeEntryFullyConfigured;
}): Promise<PaymentGatewayInitializeSessionResponse> => {
  const paymentIntentCreateParams = await paymentGatewayInitializeSessionEventToStripe(event);
  const stripePaymentIntent = await initializeStripePaymentIntent({
    paymentIntentCreateParams,
    secretKey: stripeConfig.secretKey,
  });

  const data = {
    paymentMethodsResponse: stripePaymentIntent as JSONObject,
    publishableKey: stripeConfig.publishableKey,
  };
  const paymentGatewayInitializeSessionResponse: PaymentGatewayInitializeSessionResponse = {
    data,
  };
  return paymentGatewayInitializeSessionResponse;
};
