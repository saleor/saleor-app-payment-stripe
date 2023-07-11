import { describe, it, expect } from "vitest";

import { getStripeApiClient } from "../stripe/stripe-api";
import { TransactionChargeRequestedWebhookHandler } from "./transaction-charge-requested";
import {
  createMockTransactionChargeRequestedEvent,
  createMockStripeDataActionNotRequired,
  createMockTransactionInitializeSessionEvent,
} from "./__tests__/utils";
import { TransactionInitializeSessionWebhookHandler } from "./transaction-initialize-session";
import { setupRecording } from "@/__tests__/polly";
import { testEnv } from "@/__tests__/test-env.mjs";

import { TransactionEventTypeEnum, TransactionFlowStrategyEnum } from "generated/graphql";
import { invariant } from "@/lib/invariant";

describe("TransactionChargeRequestedWebhookHandler", () => {
  setupRecording({});

  // https://stripe.com/docs/testing?testing-method=payment-methods#visa
  // ${"JCB"}                  | ${"pm_card_jcb"}
  // @todo JCB is omitted because it doesn't work
  describe.each`
    brand                     | paymentMethod
    ${"Visa"}                 | ${"pm_card_visa"}
    ${"Visa (debit)"}         | ${"pm_card_visa_debit"}
    ${"Mastercard"}           | ${"pm_card_mastercard"}
    ${"Mastercard (debit)"}   | ${"pm_card_mastercard_debit"}
    ${"Mastercard (prepaid)"} | ${"pm_card_mastercard_prepaid"}
    ${"American Express"}     | ${"pm_card_amex"}
    ${"Discover"}             | ${"pm_card_discover"}
    ${"Diners Club"}          | ${"pm_card_diners"}
    ${"UnionPay"}             | ${"pm_card_unionpay"}
  `("$brand $paymentMethod", ({ paymentMethod }) => {
    it("should charge pre-authorized card", async () => {
      // preauthorize
      const data = createMockStripeDataActionNotRequired();
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

      expect(chargeResult.amount).toEqual(222.99);
      expect(chargeResult.result).toEqual(TransactionEventTypeEnum.ChargeSuccess);
      const pspReference = chargeResult.pspReference;
      expect(pspReference).toEqual(expect.any(String));
      expect(chargeResult.externalUrl).toContain(pspReference);
    });

    it("should partially charge pre-authorized card", async () => {
      // preauthorize
      const data = createMockStripeDataActionNotRequired();
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

      expect(chargeResult.amount).toEqual(49.99);
      expect(chargeResult.result).toEqual(TransactionEventTypeEnum.ChargeSuccess);
      const pspReference = chargeResult.pspReference;
      expect(pspReference).toEqual(expect.any(String));
      expect(chargeResult.externalUrl).toContain(pspReference);
    });
  });
});
