import { describe, it, expect } from "vitest";
import { TransactionFlowStrategyEnum } from "generated/graphql";
import Stripe from "stripe";
import { TransactionInitializeSessionResponse } from "@/schemas/TransactionInitializeSession/TransactionInitializeSessionResponse.mjs";
import {
  getStripeExternalUrlForIntentId,
  stripePaymentIntentToTransactionResult,
} from "./stripe-api";

describe(`stripe-api`, () => {
  describe(`stripeResultCodeToTransactionResult`, () => {
    type ResultWithoutPrefix =
      TransactionInitializeSessionResponse["result"] extends `${infer Prefix}_${infer Result}`
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
});
