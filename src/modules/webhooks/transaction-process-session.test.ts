import { describe, it, expect } from "vitest";

import { TransactionProcessSessionWebhookHandler } from "./transaction-process-session";
import {
  createMockTransactionProcessSessionEvent,
  createMockTransactionInitializeSessionSourceObjectCheckout,
  createMockTransactionInitializeSessionSourceObjectOrder,
  createMockTransactionInitializeSessionEvent,
} from "./__tests__/utils";
import { TransactionInitializeSessionWebhookHandler } from "./transaction-initialize-session";
import { setupRecording } from "@/__tests__/polly";
import { testEnv } from "@/__tests__/test-env.mjs";

import { TransactionFlowStrategyEnum } from "generated/graphql";

describe(`TransactionProcessSessionWebhookHandler`, () => {
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
  ])(`$name`, ({ getSourceObject }) => {
    it.each([
      {
        title: `should work authorization`,
        data: {},
        result: "AUTHORIZATION_REQUESTED",
        amount: 99.99 + 123.0,
        actionType: TransactionFlowStrategyEnum.Authorization,
      },
      {
        title: `should work charge`,
        data: {},
        result: "CHARGE_REQUESTED",
        amount: 99.99 + 123.0,
        actionType: TransactionFlowStrategyEnum.Charge,
      },
    ])(`$title`, async ({ title, data, result, amount, actionType }) => {
      // Create payment
      const initializeEvent = await createMockTransactionInitializeSessionEvent({
        data,
        sourceObject: getSourceObject(),
        action: {
          actionType,
        },
      });
      const initializeResult = await TransactionInitializeSessionWebhookHandler(
        initializeEvent,
        testEnv.TEST_SALEOR_API_URL,
      );

      // Update payment
      const processEvent = await createMockTransactionProcessSessionEvent({
        data,
        sourceObject: getSourceObject(),
        action: {
          amount: amount + 100,
          actionType,
        },
        transaction: {
          pspReference: initializeResult.pspReference,
        },
      });
      const processResult = await TransactionProcessSessionWebhookHandler(
        processEvent,
        testEnv.TEST_SALEOR_API_URL,
      );
      expect(processResult.data).toEqual(expect.any(Object));
      expect(processResult.result).toEqual(result);
      expect(processResult.amount).toEqual(amount);
      expect(processResult.data).toMatchSnapshot(
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
