import { paymentAppFullyConfiguredEntrySchema } from "../payment-app-configuration/config-entry";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
import { getWebhookPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import {
  getStripeExternalUrlForIntentId,
  processStripePaymentIntentCaptureRequest,
  stripePaymentIntentToTransactionResult,
} from "../stripe/stripe-api";
import {
  getSaleorAmountFromStripeAmount,
  getStripeAmountFromSaleorMoney,
} from "../stripe/currencies";
import { type TransactionChargeRequestedResponse } from "@/schemas/TransactionChargeRequested/TransactionChargeRequestedResponse.mjs";
import {
  type TransactionChargeRequestedEventFragment,
  TransactionFlowStrategyEnum,
  TransactionActionEnum,
} from "generated/graphql";
import { invariant } from "@/lib/invariant";

export const TransactionChargeRequestedWebhookHandler = async (
  event: TransactionChargeRequestedEventFragment,
  saleorApiUrl: string,
): Promise<TransactionChargeRequestedResponse> => {
  const app = event.recipient;
  invariant(app, "Missing event.recipient!");
  invariant(
    event.action.actionType === TransactionActionEnum.Charge,
    `Incorrect action.actionType: ${event.action.actionType}`,
  );
  invariant(event.transaction, "Missing transaction");
  invariant(event.action.amount, "Missing action.amount");
  invariant(event.transaction.sourceObject, "Missing transaction.sourceObject");

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

  const pspReference = stripePaymentIntentCaptureResponse.id;
  const amount = getSaleorAmountFromStripeAmount({
    amount: stripePaymentIntentCaptureResponse.amount_received,
    currency: stripePaymentIntentCaptureResponse.currency,
  });
  const externalUrl = getStripeExternalUrlForIntentId(pspReference);

  const result = stripePaymentIntentToTransactionResult(
    TransactionFlowStrategyEnum.Charge,
    stripePaymentIntentCaptureResponse,
  );

  if (result === "CHARGE_SUCCESS" || result === "CHARGE_FAILURE") {
    // Sync flow
    const transactionChargeRequestedResponse: TransactionChargeRequestedResponse = {
      result,
      pspReference,
      amount,
      externalUrl,
      //@ts-expect-error: just for testing
      availableActions: ["REFUND"],
    };
    return transactionChargeRequestedResponse;
  } else {
    // Async flow; waiting for confirmation
    const transactionChargeRequestedResponse: TransactionChargeRequestedResponse = {
      pspReference,
    };
    return transactionChargeRequestedResponse;
  }
};
