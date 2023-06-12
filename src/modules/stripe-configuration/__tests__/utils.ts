import { type AdyenAppConfig } from "../app-config";
import { getFakeAppConfigurator } from "./app-configuration-factory";
import { testEnv } from "@/__tests__/test-env.mjs";

export const filledFakeMetadataConfig = {
  configurations: [
    {
      apiKey: testEnv.TEST_ADYEN_API_KEY,
      apiKeyId: testEnv.TEST_ADYEN_API_KEY_ID,
      clientKey: testEnv.TEST_ADYEN_CLIENT_KEY,
      companyId: testEnv.TEST_ADYEN_COMPANY_ID,
      environment: "TEST" as const,
      apiKeyScope: testEnv.TEST_ADYEN_API_KEY_SCOPE,
      configurationId: "1234-test",
      configurationName: "test",
      merchantAccount: testEnv.TEST_ADYEN_MERCHANT_ACCOUNT,
      apiKeyUsername: "ws_978780@Company.Saleor",
      webhookId: testEnv.TEST_ADYEN_WEBHOOK_ID,
      webhookUsername: testEnv.TEST_ADYEN_WEBHOOK_USERNAME,
      webhookHmacKey: testEnv.TEST_ADYEN_WEBHOOK_HMAC,
      webhookHmacHash: testEnv.TEST_ADYEN_WEBHOOK_HMAC_HASH,
      webhookPassword: testEnv.TEST_ADYEN_WEBHOOK_PASSWORD,
      applePayCertificate: testEnv.TEST_ADYEN_APPLEPAY_CERTIFICATE,
    },
  ],
  channelToConfigurationId: {
    "1": "1234-test",
  },
} satisfies AdyenAppConfig;

export const getFilledFakeAppConfigurator = () => {
  return getFakeAppConfigurator(filledFakeMetadataConfig, testEnv.TEST_SALEOR_API_URL);
};

export const getFilledMetadata = () => {
  const configurator = getFilledFakeAppConfigurator();
  return configurator.getRawConfig();
};
