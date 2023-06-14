import { describe, it, expect } from "vitest";
import { PaymentGatewayInitializeSessionWebhookHandler } from "./payment-gateway-initialize-session";
import { createMockPaymentGatewayInitializeSessionEvent } from "./__tests__/utils";

import { setupRecording } from "@/__tests__/polly";
import { testEnv } from "@/__tests__/test-env.mjs";

describe(`PaymentGatewayInitializeSessionWebhookHandler`, () => {
  setupRecording({});

  it("should work", async () => {
    const event = await createMockPaymentGatewayInitializeSessionEvent();
    const result = await PaymentGatewayInitializeSessionWebhookHandler(
      event,
      testEnv.TEST_SALEOR_API_URL,
    );
    expect(result.data).toEqual(expect.any(Object));
    expect(result.data.publishableKey).toEqual(expect.any(String));
    expect(result.data).toMatchInlineSnapshot(`
      {
        "publishableKey": "pk_test_51LVZwxEosEcNBN5mTKD5afBfOzEF1S1T9tMGyfG4sw6vC6adm8VaKph9EGee1Dk1rlSWz9LgOj4nNNLb2CxJS3HT00x3Dx44oB",
      }
    `);
  });
});
