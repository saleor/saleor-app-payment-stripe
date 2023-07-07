import urlJoin from "url-join";
import { type Stripe } from "stripe";
import { getStripeApiClient } from "../stripe/stripe-api";
import { invariant } from "@/lib/invariant";
import { createLogger, redactLogObject } from "@/lib/logger";

const stripeWebhookEndpointRoute = "/api/webhooks/stripe";

const enabledEvents: Array<Stripe.WebhookEndpointCreateParams.EnabledEvent> = [
  "payment_intent.created",
  "payment_intent.canceled",
  "payment_intent.succeeded",
  "payment_intent.processing",
  "payment_intent.payment_failed",
  "payment_intent.requires_action",
  "payment_intent.partially_funded",
  "payment_intent.amount_capturable_updated",
  "charge.refund.updated",
  "charge.refunded",
];

const getWebhookUrl = (appUrl: string, saleorApiUrl: string): string => {
  const saleorUrlParam = "?saleorApiUrl=" + encodeURIComponent(saleorApiUrl);

  return urlJoin(appUrl, stripeWebhookEndpointRoute, saleorUrlParam);
};

interface StripeWebhookResult {
  webhookSecret: string;
  webhookId: string;
}

export const createStripeWebhook = async ({
  appUrl,
  saleorApiUrl,
  secretKey,
}: {
  appUrl: string;
  saleorApiUrl: string;
  secretKey: string;
}): Promise<StripeWebhookResult> => {
  const logger = createLogger({ saleorApiUrl, appUrl }, { msgPrefix: "[createStripeWebhook] " });
  const stripe = getStripeApiClient(secretKey);

  const url = getWebhookUrl(appUrl, saleorApiUrl);

  const existingWebhook = await findExistingWebhook({ appUrl, saleorApiUrl, secretKey });
  if (existingWebhook) {
    // We cannot retreive webhook secret after it was created, so we need to delete it and create a new one
    await deleteStripeWebhook({ webhookId: existingWebhook.id, secretKey });
  }

  logger.debug({ url }, "Creating stripe webhook");
  const stripeWebhook = await stripe.webhookEndpoints.create({
    url,
    enabled_events: enabledEvents,
    description: "Saleor Stripe App",
  });

  logger.debug({ webhook: redactLogObject(stripeWebhook) }, "Webhook created");
  const { secret, id } = stripeWebhook;
  invariant(secret, "Missing webhook secret");

  return {
    webhookSecret: secret,
    webhookId: id,
  };
};

export const findExistingWebhook = async ({
  appUrl,
  saleorApiUrl,
  secretKey,
}: {
  appUrl: string;
  saleorApiUrl: string;
  secretKey: string;
}) => {
  const logger = createLogger({ saleorApiUrl, appUrl }, { msgPrefix: "[findExistingWebhook] " });
  const stripe = getStripeApiClient(secretKey);

  const url = getWebhookUrl(appUrl, saleorApiUrl);
  logger.debug({ url }, "Finding existing stripe webhook");

  const webhooks = await stripe.webhookEndpoints.list();
  logger.debug({ webhooksLength: webhooks.data.length }, "Found webhooks");

  const existingWebhook = webhooks.data.find((webhook) => webhook.url === url);
  if (existingWebhook) {
    logger.debug({ webhook: redactLogObject(existingWebhook) }, "Found existing webhook");
  }

  return existingWebhook;
};

export const deleteStripeWebhook = async ({
  webhookId,
  secretKey,
}: {
  webhookId: string;
  secretKey: string;
}) => {
  const logger = createLogger({ webhookId }, { msgPrefix: "[deleteStripeWebhook] " });
  const stripe = getStripeApiClient(secretKey);

  logger.debug("Deleting stripe webhook");
  await stripe.webhookEndpoints.del(webhookId);
  logger.debug("Webhook was deleted");
};
