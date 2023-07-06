import { paymentAppFullyConfiguredEntrySchema } from "../payment-app-configuration/config-entry";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
import { getWebhookPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import {
  getStripeExternalUrlForIntentId,
  processStripePaymentIntentCaptureRequest,
} from "../stripe/stripe-api";
import {
  getSaleorAmountFromStripeAmount,
  getStripeAmountFromSaleorMoney,
} from "../stripe/currencies";
import { type TransactionChargeRequestedResponse } from "@/schemas/TransactionChargeRequested/TransactionChargeRequestedResponse.mjs";
import { type TransactionChargeRequestedEventFragment } from "generated/graphql";
import { invariant } from "@/lib/invariant";
import { TransactionActionEnum } from "generated/graphql";

export const TransactionChargeRequestedWebhookHandler = async (
  event: TransactionChargeRequestedEventFragment,
  saleorApiUrl: string,
): Promise<TransactionChargeRequestedResponse> => {
  const app = event.recipient;
  invariant(app, `Missing event.recipient!`);
  invariant(
    event.action.actionType === TransactionActionEnum.Charge,
    `Incorrect action.actionType: ${event.action.actionType}`,
  );
  invariant(event.transaction, `Missing transaction`);
  invariant(event.action.amount, `Missing action.amount`);
  invariant(event.transaction.sourceObject, `Missing transaction.sourceObject`);

  const { privateMetadata } = app;
  const configurator = getWebhookPaymentAppConfigurator({ privateMetadata }, saleorApiUrl);
  const appConfig = await configurator.getConfig();
  const stripeConfig = paymentAppFullyConfiguredEntrySchema.parse(
    getConfigurationForChannel(appConfig, event.transaction.sourceObject?.channel.id),
  );

  const stripePaymentIntentCaptureResponse = await processStripePaymentIntentCaptureRequest({
    paymentIntentId: event.transaction.pspReference,
    stripeAmount: getStripeAmountFromSaleorMoney({
      amount: event.action.amount,
      currency: event.transaction.sourceObject.total.gross.currency,
    }),
    secretKey: stripeConfig.secretKey,
  });

  const transactionChargeRequestedResponse: TransactionChargeRequestedResponse = {
    result: "CHARGE_SUCCESS",
    pspReference: stripePaymentIntentCaptureResponse.id,
    amount: getSaleorAmountFromStripeAmount({
      amount: stripePaymentIntentCaptureResponse.amount_received,
      currency: stripePaymentIntentCaptureResponse.currency,
    }),
    externalUrl: getStripeExternalUrlForIntentId(stripePaymentIntentCaptureResponse.id),
  };
  return transactionChargeRequestedResponse;
};
