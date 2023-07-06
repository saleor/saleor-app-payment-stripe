import { describe, it, expect } from "vitest";

import { TransactionCancelationRequestedWebhookHandler } from "./transaction-cancelation-requested";
import {
  createMockTransactionCancelationRequestedEvent,
  createMockAdyenDataActionNotRequired,
  createMockTransactionInitializeSessionEvent,
} from "./__tests__/utils";
import { TransactionInitializeSessionWebhookHandler } from "./transaction-initialize-session";
import { setupRecording } from "@/__tests__/polly";
import { testEnv } from "@/__tests__/test-env.mjs";

import { TransactionFlowStrategyEnum } from "generated/graphql";

describe(`TransactionCancelationRequestedWebhookHandler`, () => {
  setupRecording({});

  it(`should cancel pre-authorized card`, async () => {
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

    // cancelation
    const transactionCancelationEvent = await createMockTransactionCancelationRequestedEvent({
      transaction: {
        pspReference: initializeResult.pspReference,
      },
    });
    const cancelationResult = await TransactionCancelationRequestedWebhookHandler(
      transactionCancelationEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    expect(cancelationResult).toMatchInlineSnapshot(`
      {
        "pspReference": "L8SP5HN2DVTFWR82",
      }
    `);
  });
});
