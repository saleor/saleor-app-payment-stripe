import urlJoin from "url-join";
import { getStripeApiClient } from "../stripe/stripe-api";
import { invariant } from "@/lib/invariant";
import { createLogger, redactLogObject } from "@/lib/logger";

const stripeWebhookEndpointRoute = "/api/webhooks/stripe";

const getWebhookUrl = (appUrl: string, saleorApiUrl: string): string => {
  const saleorUrlParam = "?saleorApiUrl=" + encodeURIComponent(saleorApiUrl);

  return urlJoin(appUrl, stripeWebhookEndpointRoute, saleorUrlParam);
};

export const createStripeWebhook = async ({
  appUrl,
  saleorApiUrl,
  secretKey,
}: {
  appUrl: string;
  saleorApiUrl: string;
  secretKey: string;
}) => {
  const logger = createLogger({ saleorApiUrl, appUrl }, { msgPrefix: "[createStripeWebhook] " });
  const stripe = getStripeApiClient(secretKey);

  const url = getWebhookUrl(appUrl, saleorApiUrl);
  logger.debug({ url }, "Creating stripe webhook");

  const stripeWebhook = await stripe.webhookEndpoints.create({
    url,
    enabled_events: [
      "payment_intent.created",
      "payment_intent.canceled",
      "payment_intent.succeeded",
      "payment_intent.processing",
      "payment_intent.payment_failed",
      "payment_intent.requires_action",
      "payment_intent.partially_funded",
      "payment_intent.amount_capturable_updated",
    ],
    description: "Saleor Stripe App",
  });

  logger.debug({ webhook: redactLogObject(stripeWebhook) }, "Webhook created");
  const secret = stripeWebhook?.secret;
  invariant(secret, "Missing webhook secret");

  return {
    webhookSecret: secret,
  };
};
