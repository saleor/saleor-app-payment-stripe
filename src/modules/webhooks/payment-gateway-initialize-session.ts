import { getWebhookAppConfigurator } from "../stripe-configuration-v2/app-configuration-factory";
import { type StripeEntryFullyConfigured } from "../stripe-configuration-v2/stripe-entries-config";
import * as ApplePay from "../applepay/applepay";
import { getConfigurationForChannel } from "../stripe-configuration-v2/app-configuration";
import { stripeFullyConfiguredEntrySchema } from "../stripe-configuration-v2/stripe-entries-config";
import {
  paymentGatewayInitializeSessionEventToStripe,
  initializeStripePaymentMethods,
} from "@/modules/stripe/stripe-api";
import { type PaymentGatewayInitializeSessionResponse } from "@/schemas/PaymentGatewayInitializeSession/PaymentGatewayInitializeSessionResponse.mjs";
import { type PaymentGatewayInitializeSessionEventFragment } from "generated/graphql";
import { invariant } from "@/lib/invariant";
import { type JSONObject } from "@/types";
import { validateData } from "@/backend-lib/api-route-utils";
import ValidatePaymentGatewayInitializeSessionRequestData, {
  type PaymentGatewayInitializeSessionRequestData,
} from "@/schemas/PaymentGatewayInitializeSession/PaymentGatewayInitializeSessionRequestData.mjs";
import { unpackPromise } from "@/lib/utils";
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

  // if this validation fails we assume `paymentGatewayInitialize` was meant to be triggered
  const [requestDataError, requestData] = await unpackPromise(
    validateData(event.data || {}, ValidatePaymentGatewayInitializeSessionRequestData),
  );
  if (requestDataError) {
    logger.info({ requestDataError });
  }

  if (!requestDataError && requestData.action === "APPLEPAY_onvalidatemerchant") {
    logger.info({ requestData }, `Processing Apple Pay request`);
    return applePayOnValidateMerchant({ requestData, stripeConfig });
  }

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
  const stripePaymentMethodsRequest = await paymentGatewayInitializeSessionEventToStripe(
    event,
    stripeConfig.merchantAccount,
  );
  const stripePaymentMethodsResponse = await initializeStripePaymentMethods({
    stripePaymentMethodsRequest,
    apiKey: stripeConfig.apiKey,
    environment: stripeConfig.environment,
  });

  const data = {
    paymentMethodsResponse: stripePaymentMethodsResponse as JSONObject,
    clientKey: stripeConfig.clientKey,
    environment: stripeConfig.environment,
  };
  const paymentGatewayInitializeSessionResponse: PaymentGatewayInitializeSessionResponse = {
    data,
  };
  return paymentGatewayInitializeSessionResponse;
};

const applePayOnValidateMerchant = async ({
  requestData: { validationURL, domain, merchantIdentifier, merchantName },
  stripeConfig,
}: {
  requestData: PaymentGatewayInitializeSessionRequestData;
  stripeConfig: StripeEntryFullyConfigured;
}): Promise<PaymentGatewayInitializeSessionResponse> => {
  const applePayMerchantSession = await ApplePay.validateMerchant({
    validationURL,
    domain,
    merchantIdentifier,
    merchantName,
    applePayCertificate: stripeConfig.applePayCertificate,
  });
  const data = {
    applePayMerchantSession: applePayMerchantSession as JSONObject,
  };
  const paymentGatewayInitializeSessionResponse: PaymentGatewayInitializeSessionResponse = {
    data,
  };
  return paymentGatewayInitializeSessionResponse;
};
