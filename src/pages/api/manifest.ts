import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { type AppManifest } from "@saleor/app-sdk/types";

import packageJson from "../../../package.json";
import { paymentGatewayInitializeSessionSyncWebhook } from "./webhooks/saleor/payment-gateway-initialize-session";
import { transactionInitializeSessionSyncWebhook } from "./webhooks/saleor/transaction-initialize-session";

export default createManifestHandler({
  async manifestFactory(context) {
    const manifest: AppManifest = {
      id: "app.saleor.stripe",
      name: "Stripe",
      about: packageJson.description,
      tokenTargetUrl: `${context.appBaseUrl}/api/register`,
      appUrl: `${context.appBaseUrl}`,
      permissions: ["HANDLE_PAYMENTS"],
      version: packageJson.version,
      requiredSaleorVersion: ">=3.13",
      webhooks: [
        paymentGatewayInitializeSessionSyncWebhook.getWebhookManifest(context.appBaseUrl),
        transactionInitializeSessionSyncWebhook.getWebhookManifest(context.appBaseUrl),
      ],
      extensions: [],
    };

    return manifest;
  },
});
