import { Stripe } from "stripe";
import { getStripeAmountFromSaleorMoney } from "./currencies";
import {
  TransactionFlowStrategyEnum,
  type TransactionProcessSessionEventFragment,
  type TransactionInitializeSessionEventFragment,
} from "generated/graphql";
import { invariant } from "@/lib/invariant";
import type { TransactionInitializeSessionResponse } from "@/schemas/TransactionInitializeSession/TransactionInitializeSessionResponse.mjs";

const getStripeApiClient = (secretKey: string) => {
  const stripe = new Stripe(secretKey, {
    apiVersion: "2022-11-15",
    typescript: true,
    httpClient: Stripe.createFetchHttpClient(fetch),
  });
  return stripe;
};

export const getEnvironmentFromKey = (secretKeyOrPublishableKey: string) => {
  return secretKeyOrPublishableKey.startsWith("sk_live_") ||
    secretKeyOrPublishableKey.startsWith("pk_live_")
    ? "live"
    : "test";
};

export const transactionSessionEventToStripe = (
  event: TransactionInitializeSessionEventFragment | TransactionProcessSessionEventFragment,
): Stripe.PaymentIntentCreateParams => {
  const data = event.data as Partial<Stripe.PaymentIntentCreateParams>;

  return {
    ...data,
    amount: getStripeAmountFromSaleorMoney({
      amount: event.sourceObject.total.gross.amount,
      currency: event.sourceObject.total.gross.currency,
    }),
    currency: event.sourceObject.total.gross.currency,
    automatic_payment_methods: {
      enabled: true,
    },
    capture_method:
      event.action.actionType === TransactionFlowStrategyEnum.Charge ? "automatic" : "manual",
    metadata: {
      ...data.metadata,
      transactionId: event.transaction.id,
      channelId: event.sourceObject.channel.id,
      ...(event.sourceObject.__typename === "Checkout" && { checkoutId: event.sourceObject.id }),
      ...(event.sourceObject.__typename === "Order" && { orderId: event.sourceObject.id }),
    },
  };
};

export const stripePaymentIntentToTransactionResult = (
  transactionFlowStrategy: TransactionFlowStrategyEnum,
  stripePaymentIntent: Stripe.PaymentIntent,
): TransactionInitializeSessionResponse["result"] => {
  const stripeResult = stripePaymentIntent.status;
  const prefix =
    transactionFlowStrategy === TransactionFlowStrategyEnum.Authorization
      ? "AUTHORIZATION"
      : transactionFlowStrategy === TransactionFlowStrategyEnum.Charge
      ? "CHARGE"
      : /* c8 ignore next */
        null;
  invariant(prefix, `Unsupported transactionFlowStrategy: ${transactionFlowStrategy}`);

  switch (stripeResult) {
    case "requires_payment_method":
    case "processing":
      return `${prefix}_REQUESTED`;
    case "requires_action":
    case "requires_capture":
    case "requires_confirmation":
      return `${prefix}_ACTION_REQUIRED`;
    case "canceled":
      return `${prefix}_FAILURE`;
    case "succeeded":
      return `${prefix}_SUCCESS`;
  }
};

export const initializeStripePaymentIntent = ({
  paymentIntentCreateParams,
  secretKey,
}: {
  paymentIntentCreateParams: Stripe.PaymentIntentCreateParams;
  secretKey: string;
}) => {
  const stripe = getStripeApiClient(secretKey);
  return stripe.paymentIntents.create(paymentIntentCreateParams);
};

export const updateStripePaymentIntent = ({
  intentId,
  paymentIntentUpdateParams,
  secretKey,
}: {
  intentId: string;
  paymentIntentUpdateParams: Stripe.PaymentIntentUpdateParams;
  secretKey: string;
}) => {
  const stripe = getStripeApiClient(secretKey);
  return stripe.paymentIntents.update(intentId, paymentIntentUpdateParams);
};

export const getStripeExternalUrlForIntentId = (intentId: string) => {
  const externalUrl = `https://dashboard.stripe.com/payments/${encodeURIComponent(intentId)}`;
  return externalUrl;
};
