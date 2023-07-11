import { paymentAppFullyConfiguredEntrySchema } from "../payment-app-configuration/config-entry";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
import { getWebhookPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import {
  getSaleorAmountFromStripeAmount,
  getStripeAmountFromSaleorMoney,
} from "../stripe/currencies";
import {
  getStripeExternalUrlForIntentId,
  processStripePaymentIntentRefundRequest,
} from "../stripe/stripe-api";
import { invariant } from "@/lib/invariant";
import { type TransactionRefundRequestedResponse } from "@/schemas/TransactionRefundRequesed/TransactionRefundRequestedResponse.mjs";
import {
  TransactionActionEnum,
  TransactionEventTypeEnum,
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

  const configurator = getWebhookPaymentAppConfigurator({ privateMetadata }, saleorApiUrl);
  const appConfig = await configurator.getConfig();
  const stripeConfig = paymentAppFullyConfiguredEntrySchema.parse(
    getConfigurationForChannel(appConfig, event.transaction.sourceObject?.channel.id),
  );

  const stripePaymentIntentRefundResponse = await processStripePaymentIntentRefundRequest({
    stripeAmount:
      event.action.amount && event.transaction.sourceObject?.total?.gross?.currency
        ? getStripeAmountFromSaleorMoney({
            amount: event.action.amount,
            currency: event.transaction.sourceObject.total.gross.currency,
          })
        : undefined,
    paymentIntentId: event.transaction.pspReference,
    secretKey: stripeConfig.secretKey,
  });

  const pspReference = stripePaymentIntentRefundResponse.id;
  const amount = getSaleorAmountFromStripeAmount({
    amount: stripePaymentIntentRefundResponse.amount,
    currency: stripePaymentIntentRefundResponse.currency,
  });
  const externalUrl = getStripeExternalUrlForIntentId(pspReference);

  switch (stripePaymentIntentRefundResponse.status) {
    case "succeeded": {
      const transactionRefundRequestedResponse: TransactionRefundRequestedResponse = {
        result: TransactionEventTypeEnum.RefundSuccess,
        pspReference,
        amount,
        externalUrl,
      };
      return transactionRefundRequestedResponse;
    }
    case "canceled":
    case "failed": {
      const transactionRefundRequestedResponse: TransactionRefundRequestedResponse = {
        result: TransactionEventTypeEnum.RefundFailure,
        pspReference,
        amount,
        externalUrl,
      };
      return transactionRefundRequestedResponse;
    }
    case "requires_action": {
      const transactionRefundRequestedResponse: TransactionRefundRequestedResponse = {
        pspReference,
        message: `requires_action`,
      };
      return transactionRefundRequestedResponse;
    }
    case "pending":
    default: {
      const transactionRefundRequestedResponse: TransactionRefundRequestedResponse = {
        pspReference,
      };
      return transactionRefundRequestedResponse;
    }
  }
};
