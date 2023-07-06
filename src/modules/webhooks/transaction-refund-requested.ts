import { paymentAppFullyConfiguredEntrySchema } from "../payment-app-configuration/config-entry";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
import { getWebhookPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import { invariant } from "@/lib/invariant";
import { type TransactionRefundRequestedResponse } from "@/schemas/TransactionRefundRequesed/TransactionRefundRequestedResponse.mjs";
import {
  TransactionActionEnum,
  type TransactionRefundRequestedEventFragment,
} from "generated/graphql";

export const TransactionRefundRequestedWebhookHandler = async (
  event: TransactionRefundRequestedEventFragment,
  saleorApiUrl: string,
): Promise<TransactionRefundRequestedResponse> => {
  const app = event.recipient;

  invariant(app, "Missing event.recipient!");
  invariant(
    event.action.actionType === TransactionActionEnum.Refund,
    `Incorrect action.actionType: ${event.action.actionType}`,
  );
  invariant(event.transaction?.pspReference, `Missing event.transaction.pspReference!`);

  const { privateMetadata } = app;
  const pspReference = event.transaction.pspReference;

  const configurator = getWebhookPaymentAppConfigurator({ privateMetadata }, saleorApiUrl);
  const appConfig = await configurator.getConfig();
  const stripeConfig = paymentAppFullyConfiguredEntrySchema.parse(
    getConfigurationForChannel(appConfig, event.transaction.sourceObject?.channel.id),
  );
  const { merchantAccount, environment, apiKey } = stripeConfig;

  const stripeCreateRefundRequest = transactionRefundRequestedEventToStripe(event, merchantAccount);
  const refundResult = await processStripeRefundRequest({
    stripeCreateRefundRequest,
    pspReference,
    environment,
    apiKey,
  });

  const transactionRefundRequestedResponse: TransactionRefundRequestedResponse = {
    pspReference: refundResult.pspReference,
  };
  return transactionRefundRequestedResponse;
};
