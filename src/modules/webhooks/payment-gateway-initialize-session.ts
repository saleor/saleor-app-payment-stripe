import { getWebhookAppConfigurator } from "../stripe-configuration/app-configuration-factory";
import { getConfigurationForChannel } from "../stripe-configuration/app-configuration";
import { stripeFullyConfiguredEntrySchema } from "../stripe-configuration/stripe-entries-config";
import { type PaymentGatewayInitializeSessionResponse } from "@/schemas/PaymentGatewayInitializeSession/PaymentGatewayInitializeSessionResponse.mjs";
import { type PaymentGatewayInitializeSessionEventFragment } from "generated/graphql";
import { invariant } from "@/lib/invariant";
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
  const data = {
    publishableKey: stripeConfig.publishableKey,
  };
  const paymentGatewayInitializeSessionResponse: PaymentGatewayInitializeSessionResponse = {
    data,
  };
  return paymentGatewayInitializeSessionResponse;
};
