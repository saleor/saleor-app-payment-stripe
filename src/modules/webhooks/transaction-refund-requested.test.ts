import { describe, it, expect } from "vitest";
import { TransactionRefundRequestedWebhookHandler } from "./transaction-refund-requested";
import {
  createMockAdyenDataActionNotRequired,
  createMockTransactionChargeRequestedEvent,
  createMockTransactionInitializeSessionEvent,
  createMockTransactionRefundRequestedEvent,
} from "./__tests__/utils";
import { TransactionInitializeSessionWebhookHandler } from "./transaction-initialize-session";
import { TransactionChargeRequestedWebhookHandler } from "./transaction-charge-requested";
import { testEnv } from "@/__tests__/test-env.mjs";
import { TransactionFlowStrategyEnum } from "generated/graphql";
import { setupRecording } from "@/__tests__/polly";

describe("TransactionRefundRequestedWebhookHandler", () => {
  setupRecording({});

  it("should request a refund in Adyen after authorize and charge", async () => {
    // authorize
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
    await TransactionChargeRequestedWebhookHandler(
      transactionChargeEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    // refund
    const transactionRefundEvent = await createMockTransactionRefundRequestedEvent({
      transaction: {
        pspReference: initializeResult.pspReference,
      },
    });

    const refundResult = await TransactionRefundRequestedWebhookHandler(
      transactionRefundEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    expect(refundResult).toMatchInlineSnapshot(`
      {
        "pspReference": "J6JC4HN2DVTFWR82",
      }
    `);
  });

  it("should request a refund in Adyen after a charge", async () => {
    // charge
    const data = createMockAdyenDataActionNotRequired();
    const transactionInitializeEvent = await createMockTransactionInitializeSessionEvent({
      data,
      action: {
        actionType: TransactionFlowStrategyEnum.Charge,
      },
    });
    const initializeResult = await TransactionInitializeSessionWebhookHandler(
      transactionInitializeEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    // refund
    const transactionRefundEvent = await createMockTransactionRefundRequestedEvent({
      transaction: {
        pspReference: initializeResult.pspReference,
      },
    });

    const refundResult = await TransactionRefundRequestedWebhookHandler(
      transactionRefundEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    expect(refundResult).toMatchInlineSnapshot(`
      {
        "pspReference": "NTPHWQ9SSGNG5S82",
      }
    `);
  });

  it("should request a partial refund in Adyen after authorize and charge", async () => {
    // authorize
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
    await TransactionChargeRequestedWebhookHandler(
      transactionChargeEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    // refund
    const transactionRefundEvent = await createMockTransactionRefundRequestedEvent({
      action: {
        amount: 49.99,
      },
      transaction: {
        pspReference: initializeResult.pspReference,
      },
    });

    const refundResult = await TransactionRefundRequestedWebhookHandler(
      transactionRefundEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    expect(refundResult).toMatchInlineSnapshot(`
      {
        "pspReference": "PMX4K46VN8NKGK82",
      }
    `);
  });

  it("should request a partial refund in Adyen after a charge", async () => {
    // charge
    const data = createMockAdyenDataActionNotRequired();
    const transactionInitializeEvent = await createMockTransactionInitializeSessionEvent({
      data,
      action: {
        actionType: TransactionFlowStrategyEnum.Charge,
      },
    });
    const initializeResult = await TransactionInitializeSessionWebhookHandler(
      transactionInitializeEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    // refund
    const transactionRefundEvent = await createMockTransactionRefundRequestedEvent({
      action: {
        amount: 49.99,
      },
      transaction: {
        pspReference: initializeResult.pspReference,
      },
    });

    const refundResult = await TransactionRefundRequestedWebhookHandler(
      transactionRefundEvent,
      testEnv.TEST_SALEOR_API_URL,
    );

    expect(refundResult).toMatchInlineSnapshot(`
      {
        "pspReference": "D9CCK46VN8NKGK82",
      }
    `);
  });
});
