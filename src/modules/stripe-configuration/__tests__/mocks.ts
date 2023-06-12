import { type AdyenEntryConfig, type AdyenEntryFullyConfigured } from "../stripe-entries-config";
import { testEnv } from "@/__tests__/test-env.mjs";

export const configEntryRequired: AdyenEntryConfig = {
  configurationId: "mock-id",
  apiKey: "super-secret-key",
  environment: "TEST",
  configurationName: "test",
};

export const configEntryAll: AdyenEntryFullyConfigured = {
  configurationId: "mock-id",
  apiKey: testEnv.TEST_ADYEN_API_KEY,
  environment: "TEST",
  configurationName: "test",
  clientKey: testEnv.TEST_ADYEN_CLIENT_KEY,
  webhookUsername: testEnv.TEST_ADYEN_WEBHOOK_USERNAME,
  webhookPassword: testEnv.TEST_ADYEN_WEBHOOK_PASSWORD,
  webhookHmacKey: testEnv.TEST_ADYEN_WEBHOOK_HMAC,
  webhookHmacHash: testEnv.TEST_ADYEN_WEBHOOK_HMAC_HASH,
  apiKeyId: testEnv.TEST_ADYEN_API_KEY_ID,
  companyId: testEnv.TEST_ADYEN_COMPANY_ID,
  webhookId: testEnv.TEST_ADYEN_WEBHOOK_ID,
  apiKeyScope: testEnv.TEST_ADYEN_API_KEY_SCOPE,
  apiKeyUsername: "ws.1234@Saleor",
  merchantAccount: testEnv.TEST_ADYEN_MERCHANT_ACCOUNT,
  applePayCertificate: testEnv.TEST_ADYEN_APPLEPAY_CERTIFICATE,
};
