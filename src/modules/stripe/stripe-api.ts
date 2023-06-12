import { Stripe } from "stripe";
import { TransactionInitializeSessionEventFragment } from "generated/graphql";

const getStripeApiClient = (secretKey: string) => {
  const stripe = new Stripe(secretKey, { apiVersion: "2022-11-15" });
  return stripe;
};

export const getEnvironmentFromKey = (secretKeyOrPublishableKey: string) => {
  return secretKeyOrPublishableKey.startsWith("sk_live_") ||
    secretKeyOrPublishableKey.startsWith("pk_live_")
    ? "live"
    : "test";
};

export const transactionInitializeSessionEventToStripe = (
  event: TransactionInitializeSessionEventFragment,
): Stripe.PaymentIntentCreateParams => {
  const data = event.data as Partial<Stripe.PaymentIntentCreateParams>;

  return {
    ...data,
    amount: event.sourceObject.total.gross.amount,
    currency: event.sourceObject.total.gross.currency,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      ...data.metadata,
      transactionId: event.transaction.id,
      channelId: event.sourceObject.channel.id,
      ...(event.sourceObject.__typename === "Checkout" && { checkoutId: event.sourceObject.id }),
      ...(event.sourceObject.__typename === "Order" && { orderId: event.sourceObject.id }),
    },
  };
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

export const getStripeExternalUrlForIntentId = (intentId: string) => {
  const externalUrl = `https://dashboard.stripe.com/payments/${encodeURIComponent(intentId)}`;
  return externalUrl;
};
