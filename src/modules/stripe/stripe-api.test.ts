import { describe, it, expect } from "vitest";
import type Stripe from "stripe";
import {
  getStripeExternalUrlForIntentId,
  stripePaymentIntentToTransactionResult,
  validateStripeKeys,
} from "./stripe-api";
import { TransactionFlowStrategyEnum } from "generated/graphql";
import { type TransactionInitializeSessionResponse } from "@/schemas/TransactionInitializeSession/TransactionInitializeSessionResponse.mjs";
import { setupRecording } from "@/__tests__/polly";
import { testEnv } from "@/__tests__/test-env.mjs";

describe(`stripe-api`, () => {
  describe(`stripeResultCodeToTransactionResult`, () => {
    type ResultWithoutPrefix =
      TransactionInitializeSessionResponse["result"] extends `${infer _Prefix}_${infer Result}`
        ? Result
        : never;

    // exhaustiveCheck is used to ensure that all Stripe.PaymentIntent.Status are covered
    const exhaustiveCheck = {
      canceled: "FAILURE",
      processing: "REQUESTED",
      requires_action: "ACTION_REQUIRED",
      requires_capture: "ACTION_REQUIRED",
      requires_confirmation: "ACTION_REQUIRED",
      requires_payment_method: "REQUESTED",
      succeeded: "SUCCESS",
    } satisfies Record<Stripe.PaymentIntent.Status, ResultWithoutPrefix>;

    describe.each(Object.entries(exhaustiveCheck))(
      "$resultCode",
      (stripeResult, expectedResult) => {
        it.each([
          {
            strategy: TransactionFlowStrategyEnum.Authorization,
            expectedAction: "AUTHORIZATION",
          },
          {
            strategy: TransactionFlowStrategyEnum.Charge,
            expectedAction: "CHARGE",
          },
        ])("%p", async ({ strategy, expectedAction }) => {
          const returned = stripePaymentIntentToTransactionResult(strategy, {
            status: stripeResult,
          } as Stripe.PaymentIntent);

          expect(returned).toBe(`${expectedAction}_${expectedResult}`);
        });
      },
    );
  });

  describe(`getStripeExternalUrlForIntentId`, () => {
    it(`should get external url for intentId`, () => {
      expect(getStripeExternalUrlForIntentId("pi_3MmHAnLE6YuwiJ1e0lqUR2OC")).toMatchInlineSnapshot(
        '"https://dashboard.stripe.com/payments/pi_3MmHAnLE6YuwiJ1e0lqUR2OC"',
      );
    });
  });

  describe("validateStripeKeys", () => {
    setupRecording();

    it("should throw error if secret key is invalid", async () => {
      return expect(
        validateStripeKeys("blabla", testEnv.TEST_PAYMENT_APP_PUBLISHABLE_KEY),
      ).rejects.toThrowErrorMatchingInlineSnapshot('"Provided secret key is invalid"');
    });

    it("should throw error if publishable key is invalid", async () => {
      return expect(
        validateStripeKeys(testEnv.TEST_PAYMENT_APP_SECRET_KEY, "blabla"),
      ).rejects.toThrowErrorMatchingInlineSnapshot('"Provided publishable key is invalid"');
    });

    it("should throw error if both keys are invalid", async () => {
      return expect(
        validateStripeKeys("blabla", "blabla"),
      ).rejects.toThrowErrorMatchingInlineSnapshot('"Provided secret key is invalid"');
    });

    it("not throw error if both keys are correct", async () => {
      return expect(
        validateStripeKeys(
          testEnv.TEST_PAYMENT_APP_SECRET_KEY,
          testEnv.TEST_PAYMENT_APP_PUBLISHABLE_KEY,
        ),
      ).resolves.toMatchInlineSnapshot("undefined");
    });
  });
});
