import { describe, it, expect } from "vitest";

import { TransactionInitializeSessionWebhookHandler } from "./transaction-initialize-session";
import {
  createMockTransactionInitializeSessionEvent,
  createMockTransactionInitializeSessionSourceObjectCheckout,
  createMockTransactionInitializeSessionSourceObjectOrder,
} from "./__tests__/utils";
import { setupRecording } from "@/__tests__/polly";
import { testEnv } from "@/__tests__/test-env.mjs";

import { TransactionFlowStrategyEnum } from "generated/graphql";

describe("TransactionInitializeSessionWebhookHandler", () => {
  setupRecording({
    matchRequestsBy: {
      headers: {
        exclude: [
          "date",
          "idempotency-key",
          "original-request",
          "request-id",
          "content-length",
          "x-stripe-client-user-agent",
        ],
      },
      method: false,
      body: false,
      order: false,
      url: false,
    },
  });

  describe.each([
    {
      name: "Checkout",
      getSourceObject: createMockTransactionInitializeSessionSourceObjectCheckout,
    },
    { name: "Order", getSourceObject: createMockTransactionInitializeSessionSourceObjectOrder },
  ])("$name", ({ getSourceObject }) => {
    it.each([
      {
        title: "should work authorization",
        data: {},
        result: "AUTHORIZATION_REQUESTED",
        amount: 99.99 + 123.0,
        actionType: TransactionFlowStrategyEnum.Authorization,
      },
      {
        title: "should work charge",
        data: {},
        result: "CHARGE_REQUESTED",
        amount: 99.99 + 123.0,
        actionType: TransactionFlowStrategyEnum.Charge,
      },
    ])("$title", async ({ title, data, result, amount, actionType }) => {
      const event = await createMockTransactionInitializeSessionEvent({
        data,
        sourceObject: getSourceObject(),
        action: {
          actionType,
        },
      });
      const initializeResult = await TransactionInitializeSessionWebhookHandler(
        event,
        testEnv.TEST_SALEOR_API_URL,
      );
      expect(initializeResult.data).toEqual(expect.any(Object));
      expect(initializeResult.result).toEqual(result);
      expect(initializeResult.amount).toEqual(amount);
      expect(initializeResult.data).toMatchSnapshot(
        {
          paymentIntent: {
            client_secret: expect.any(String),
          },
        },
        title,
      );
    });
  });
});
