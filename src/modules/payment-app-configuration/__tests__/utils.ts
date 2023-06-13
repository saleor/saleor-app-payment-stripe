import { type PaymentAppConfig } from "../app-config";
import {
  getFakePaymentAppConfigurator,
  type MetadataManagerOverride,
} from "./payment-app-configuration-factory";
import { testEnv } from "@/__tests__/test-env.mjs";

export const filledFakeMatadataConfig = {
  configurations: [
    {
      secretKey: "sk_secret-key",
      publishableKey: "pk_so-secret-key",
      configurationId: "mock-id",
      configurationName: "test",
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
