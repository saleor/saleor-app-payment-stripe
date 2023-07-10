import urlJoin from "url-join";
import { type Stripe } from "stripe";
import { getStripeApiClient } from "../stripe/stripe-api";
import { type PaymentAppConfigurator } from "./payment-app-configuration";
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
  const url = new URL(appUrl);
  url.pathname = stripeWebhookEndpointRoute;
  url.searchParams.set("saleorApiUrl", saleorApiUrl);
	return url.toString();
};

interface StripeWebhookResult {
  webhookSecret: string;
  webhookId: string;
}

export const createStripeWebhook = async ({
  appUrl,
  saleorApiUrl,
  secretKey,
  configurator,
}: {
  appUrl: string;
  saleorApiUrl: string;
  secretKey: string;
  configurator: PaymentAppConfigurator;
}): Promise<StripeWebhookResult> => {
  const logger = createLogger({ saleorApiUrl, appUrl }, { msgPrefix: "[createStripeWebhook] " });
  const stripe = getStripeApiClient(secretKey);

  const url = getWebhookUrl(appUrl, saleorApiUrl);

  const existingStripeWebhook = await findExistingWebhook({ appUrl, saleorApiUrl, secretKey });
  if (existingStripeWebhook) {
    const existingAppWebhook = await checkWebhookUsage({
      webhookId: existingStripeWebhook.id,
      configurator,
    });

    if (existingAppWebhook) {
      // There's already a webhook for this app, so we can just
      return existingAppWebhook;
    }

    // We cannot retrieve webhook secret after it was created, so we need to delete it and create a new one
    await deleteStripeWebhook({ webhookId: existingStripeWebhook.id, secretKey });
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

export const checkWebhookUsage = async ({
  webhookId,
  configurator,
}: {
  webhookId: string;
  configurator: PaymentAppConfigurator;
}) => {
  const logger = createLogger(
    { webhookId, saleorApiUrl: configurator.saleorApiUrl },
    { msgPrefix: "[checkWebhookUsage] " },
  );

  logger.debug("Fetching all config entries");

  const config = await configurator.getConfig();
  const entries = config.configurations;

  logger.debug("Got all entries");
  const entry = entries.find((entry) => entry.webhookId === webhookId);

  if (entry) {
    logger.debug("Found entry with matching webhook id");
    return {
      webhookId: entry.webhookId,
      webhookSecret: entry.webhookSecret,
    };
  }

  logger.debug("Entry with matching webhook id was not found");
  return null;
};
