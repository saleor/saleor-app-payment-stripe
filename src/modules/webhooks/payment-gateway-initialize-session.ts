import { getWebhookPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import { paymentAppFullyConfiguredEntrySchema } from "../payment-app-configuration/config-entry";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
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
    { msgPrefix: "[PaymentGatewayInitializeSessionWebhookHandler] " },
  );

  const app = event.recipient;
  invariant(app, "Missing event.recipient!");

  const { privateMetadata } = app;
  const configurator = getWebhookPaymentAppConfigurator({ privateMetadata }, saleorApiUrl);
  const appConfig = await configurator.getConfig();

  const stripeConfig = paymentAppFullyConfiguredEntrySchema.parse(
    getConfigurationForChannel(appConfig, event.sourceObject.channel.id),
  );

  logger.info({}, "Processing Payment Gateway Initialize request");
  const data = {
    publishableKey: stripeConfig.publishableKey,
  };
  const paymentGatewayInitializeSessionResponse: PaymentGatewayInitializeSessionResponse = {
    data,
  };
  return paymentGatewayInitializeSessionResponse;
};
