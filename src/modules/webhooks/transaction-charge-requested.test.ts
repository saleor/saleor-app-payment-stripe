import { describe, it, expect } from "vitest";

import { TransactionChargeRequestedWebhookHandler } from "./transaction-charge-requested";
import {
  createMockTransactionChargeRequestedEvent,
  createMockAdyenDataActionNotRequired,
  createMockTransactionInitializeSessionEvent,
} from "./__tests__/utils";
import { TransactionInitializeSessionWebhookHandler } from "./transaction-initialize-session";
import { setupRecording } from "@/__tests__/polly";
import { testEnv } from "@/__tests__/test-env.mjs";

import { TransactionFlowStrategyEnum } from "generated/graphql";

describe(`TransactionChargeRequestedWebhookHandler`, () => {
  setupRecording({});

  it(`should charge pre-authorized card`, async () => {
    // preauthorize
    const data = createMockAdyenDataActionNotRequired();
    const transactionInitializeEvent = await createMockTransactionInitializeSessionEvent({
      data,
      action: {
        actionType: TransactionFlowStrategyEnum.Authorization,
      },
    });
    const initializeResult = await TransactionInitializeSessionWebhookHandler(
      transactionInitializeEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    // charge
    const transactionChargeEvent = await createMockTransactionChargeRequestedEvent({
      transaction: {
        pspReference: initializeResult.pspReference,
      },
    });
    const chargeResult = await TransactionChargeRequestedWebhookHandler(
      transactionChargeEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    expect(chargeResult).toMatchInlineSnapshot(`
      {
        "pspReference": "D7N25HN2DVTFWR82",
      }
    `);
  });

  it(`should partially charge pre-authorized card`, async () => {
    // preauthorize
    const data = createMockAdyenDataActionNotRequired();
    const transactionInitializeEvent = await createMockTransactionInitializeSessionEvent({
      data,
      action: {
        actionType: TransactionFlowStrategyEnum.Authorization,
      },
    });
    const initializeResult = await TransactionInitializeSessionWebhookHandler(
      transactionInitializeEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    // charge
    const transactionChargeEvent = await createMockTransactionChargeRequestedEvent({
      action: {
        amount: 49.99,
      },
      transaction: {
        pspReference: initializeResult.pspReference,
      },
    });
    const chargeResult = await TransactionChargeRequestedWebhookHandler(
      transactionChargeEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    expect(chargeResult).toMatchInlineSnapshot(`
      {
        "pspReference": "JS295HN2DVTFWR82",
      }
    `);
  });
});
