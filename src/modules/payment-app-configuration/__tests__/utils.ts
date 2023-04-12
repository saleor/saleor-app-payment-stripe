import { defaultPaymentAppConfig } from "../payment-app-config";
import {
  getFakePaymentAppConfigurator,
  type MetadataManagerOverride,
} from "./payment-app-configuration-factory";
import { testEnv } from "@/__tests__/test-env.mjs";

export const getEmptyMetadata = () => {
  const configurator = getFakePaymentAppConfigurator(
    defaultPaymentAppConfig,
    testEnv.TEST_SALEOR_API_URL,
  );
  return configurator.getRawConfig();
};

export const filledFakePrivateMetadataConfig = {
  apiKey: testEnv.TEST_PAYMENT_APP_API_KEY,
};

export const filledFakePublicMetadataConfig = {
  clientKey: testEnv.TEST_PAYMENT_APP_CLIENT_KEY,
};

export const filledFakeHiddenMetadataConfig = {
  apiKeyId: testEnv.TEST_PAYMENT_APP_API_KEY_ID,
};

export const filledFakeMetadataConfig = {
  ...filledFakePrivateMetadataConfig,
  ...filledFakePublicMetadataConfig,
  ...filledFakeHiddenMetadataConfig,
};

export const getFilledFakeMetadataConfigurator = (override?: MetadataManagerOverride) => {
  return getFakePaymentAppConfigurator(
    filledFakeMetadataConfig,
    testEnv.TEST_SALEOR_API_URL,
    override,
  );
};

export const getFilledMetadata = () => {
  const configurator = getFilledFakeMetadataConfigurator();
  return configurator.getRawConfig();
};
