import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import { type AppManifest } from "@saleor/app-sdk/types";

import packageJson from "../../../package.json";

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
        /**
         * Configure webhooks here. They will be created in Saleor during installation
         * Read more
         * https://docs.saleor.io/docs/3.x/developer/api-reference/objects/webhook
         *
         * Easiest way to create webhook is to use app-sdk
         * https://github.com/saleor/saleor-app-sdk/blob/main/docs/saleor-async-webhook.md
         */
        // TODO: Add webhooks
      ],
      extensions: [],
    };

    return manifest;
  },
});
