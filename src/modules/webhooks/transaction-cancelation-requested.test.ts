import { describe, it, expect } from "vitest";

import { getStripeApiClient } from "../stripe/stripe-api";
import { TransactionCancelationRequestedWebhookHandler } from "./transaction-cancelation-requested";
import {
  createMockTransactionCancelationRequestedEvent,
  createMockTransactionInitializeSessionEvent,
} from "./__tests__/utils";
import { TransactionInitializeSessionWebhookHandler } from "./transaction-initialize-session";
import { setupRecording } from "@/__tests__/polly";
import { testEnv } from "@/__tests__/test-env.mjs";

import { TransactionEventTypeEnum, TransactionFlowStrategyEnum } from "generated/graphql";
import { invariant } from "@/lib/invariant";

describe("TransactionCancelationRequestedWebhookHandler", () => {
  setupRecording({});

  // https://stripe.com/docs/testing?testing-method=payment-methods#visa
  // ${"JCB"}                  | ${"pm_card_jcb"}
  // ${"American Express"}     | ${"pm_card_amex"}
  // @todo JCB and amex are omitted because they don't work
  describe.each`
    brand                     | paymentMethod
    ${"Visa"}                 | ${"pm_card_visa"}
    ${"Visa (debit)"}         | ${"pm_card_visa_debit"}
    ${"Mastercard"}           | ${"pm_card_mastercard"}
    ${"Mastercard (debit)"}   | ${"pm_card_mastercard_debit"}
    ${"Mastercard (prepaid)"} | ${"pm_card_mastercard_prepaid"}
    ${"Discover"}             | ${"pm_card_discover"}
    ${"Diners Club"}          | ${"pm_card_diners"}
    ${"UnionPay"}             | ${"pm_card_unionpay"}
  `("$brand $paymentMethod", ({ paymentMethod }) => {
    it("should cancel pre-authorized card", async () => {
      // preauthorize
      const data = {};
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

      invariant(initializeResult.pspReference, "Missing initializeResult.pspReference");

      // mock frontend action – adding payment method details (card)
      const stripeClient = getStripeApiClient(testEnv.TEST_PAYMENT_APP_SECRET_KEY);
      await stripeClient.paymentIntents.confirm(initializeResult.pspReference, {
        payment_method: paymentMethod,
      });

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

      expect(cancelationResult.amount).toEqual(222.99);
      expect(cancelationResult.result).toEqual(TransactionEventTypeEnum.CancelSuccess);
      const pspReference = cancelationResult.pspReference;
      expect(pspReference).toEqual(expect.any(String));
      expect(cancelationResult.externalUrl).toContain(pspReference);
    });
  });
});
