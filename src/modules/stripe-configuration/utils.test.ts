import { describe, it, expect } from "vitest";
import { OBFUSCATION_DOTS, obfuscateConfigEntry } from "./utils";
import { testEnv } from "@/__tests__/test-env.mjs";

describe("obfuscateConfigEntry", () => {
  it("obfuscates config entries", () => {
    const result = obfuscateConfigEntry({
      configurationId: "mock-id",
      apiKey: "test-test-test",
      environment: "TEST",
      configurationName: "test",
      clientKey: "test_1234",
      webhookUsername: "adyen_webhook_username",
      webhookPassword: "adyen_webhook_password",
      webhookHmacKey: "adyen_webhook_hmac",
      webhookHmacHash: "ABCD",
      apiKeyId: testEnv.TEST_ADYEN_API_KEY_ID,
      companyId: testEnv.TEST_ADYEN_COMPANY_ID,
      webhookId: testEnv.TEST_ADYEN_WEBHOOK_ID,
      apiKeyScope: testEnv.TEST_ADYEN_API_KEY_SCOPE,
      apiKeyUsername: "ws.1234@Saleor",
      merchantAccount: testEnv.TEST_ADYEN_MERCHANT_ACCOUNT,
      applePayCertificate: "adyen_apple_pay_cert",
    });

    expect(result).toStrictEqual({
      configurationId: "mock-id",
      apiKey: `${OBFUSCATION_DOTS}test`,
      environment: "TEST",
      configurationName: "test",
      clientKey: "test_1234",
      // webhookUsername: undefined,
      // webhookPassword: undefined,
      // webhookHmacKey: undefined,
      webhookHmacHash: "ABCD",
      apiKeyId: testEnv.TEST_ADYEN_API_KEY_ID,
      companyId: testEnv.TEST_ADYEN_COMPANY_ID,
      webhookId: testEnv.TEST_ADYEN_WEBHOOK_ID,
      apiKeyScope: testEnv.TEST_ADYEN_API_KEY_SCOPE,
      apiKeyUsername: "ws.1234@Saleor",
      merchantAccount: testEnv.TEST_ADYEN_MERCHANT_ACCOUNT,
      applePayCertificate: `${OBFUSCATION_DOTS}cert`,
    });
  });
});
