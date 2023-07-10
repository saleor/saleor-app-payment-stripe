import { type PaymentAppConfig } from "../app-config";
import {
  getFakePaymentAppConfigurator,
  type MetadataManagerOverride,
} from "./payment-app-configuration-factory";
import { testEnv } from "@/__tests__/test-env.mjs";

export const filledFakeMatadataConfig = {
  configurations: [
    {
      secretKey: testEnv.TEST_PAYMENT_APP_SECRET_KEY,
      publishableKey: testEnv.TEST_PAYMENT_APP_PUBLISHABLE_KEY,
      configurationId: "mock-id",
      configurationName: "test",
      webhookId: "webhook-id",
      webhookSecret: "ws_12345",
    },
  ],
  channelToConfigurationId: {
    "1": "mock-id",
  },
} satisfies PaymentAppConfig;

export const getFilledFakeMetadataConfigurator = (override?: MetadataManagerOverride) => {
  return getFakePaymentAppConfigurator(
    filledFakeMatadataConfig,
    testEnv.TEST_SALEOR_API_URL,
    override,
  );
};

export const getFilledMetadata = () => {
  const configurator = getFilledFakeMetadataConfigurator();
  return configurator.getRawConfig();
};
