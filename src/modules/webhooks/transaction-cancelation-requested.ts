import { getWebhookPaymentAppConfigurator } from "../payment-app-configuration/payment-app-configuration-factory";
import { paymentAppFullyConfiguredEntrySchema } from "../payment-app-configuration/config-entry";
import { getConfigurationForChannel } from "../payment-app-configuration/payment-app-configuration";
import {
  getStripeExternalUrlForIntentId,
  processStripePaymentIntentCancelRequest,
} from "../stripe/stripe-api";
import { getSaleorAmountFromStripeAmount } from "../stripe/currencies";
import { type TransactionCancelationRequestedResponse } from "@/schemas/TransactionCancelationRequested/TransactionCancelationRequestedResponse.mjs";
import {
  TransactionEventTypeEnum,
  type TransactionCancelationRequestedEventFragment,
} from "generated/graphql";
import { invariant } from "@/lib/invariant";
import { TransactionActionEnum } from "generated/graphql";

export const TransactionCancelationRequestedWebhookHandler = async (
  event: TransactionCancelationRequestedEventFragment,
  saleorApiUrl: string,
): Promise<TransactionCancelationRequestedResponse> => {
  const app = event.recipient;
  invariant(app, `Missing event.recipient!`);
  invariant(
    event.action.actionType === TransactionActionEnum.Cancel,
    `Incorrect action.actionType: ${event.action.actionType}`,
  );
  invariant(event.action.amount, `Missing action.amount`);
  invariant(event.transaction, `Missing transaction`);

  const { privateMetadata } = app;
  const configurator = getWebhookPaymentAppConfigurator({ privateMetadata }, saleorApiUrl);
  const appConfig = await configurator.getConfig();
  const stripeConfig = paymentAppFullyConfiguredEntrySchema.parse(
    getConfigurationForChannel(appConfig, event.transaction.sourceObject?.channel.id),
  );

  const stripePaymentIntentCancelResponse = await processStripePaymentIntentCancelRequest({
    paymentIntentId: event.transaction.pspReference,
    secretKey: stripeConfig.secretKey,
  });

  const transactionCancelationRequestedResponse: TransactionCancelationRequestedResponse =
    stripePaymentIntentCancelResponse.status === "canceled"
      ? // Sync flow
        {
          pspReference: stripePaymentIntentCancelResponse.id,
          amount: getSaleorAmountFromStripeAmount({
            amount: stripePaymentIntentCancelResponse.amount,
            currency: stripePaymentIntentCancelResponse.currency,
          }),
          result: TransactionEventTypeEnum.CancelSuccess,
          externalUrl: getStripeExternalUrlForIntentId(stripePaymentIntentCancelResponse.id),
        }
      : // Async flow; waiting for confirmation
        {
          pspReference: stripePaymentIntentCancelResponse.id,
        };

  return transactionCancelationRequestedResponse;
};
