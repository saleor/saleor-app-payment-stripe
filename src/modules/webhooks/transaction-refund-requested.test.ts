import { describe, it, expect } from "vitest";
import { getStripeApiClient } from "../stripe/stripe-api";
import { TransactionRefundRequestedWebhookHandler } from "./transaction-refund-requested";
import {
  createMockStripeDataActionNotRequired,
  createMockTransactionChargeRequestedEvent,
  createMockTransactionInitializeSessionEvent,
  createMockTransactionRefundRequestedEvent,
} from "./__tests__/utils";
import { TransactionInitializeSessionWebhookHandler } from "./transaction-initialize-session";
import { TransactionChargeRequestedWebhookHandler } from "./transaction-charge-requested";
import { testEnv } from "@/__tests__/test-env.mjs";
import { TransactionEventTypeEnum, TransactionFlowStrategyEnum } from "generated/graphql";
import { setupRecording } from "@/__tests__/polly";
import { invariant } from "@/lib/invariant";

describe("TransactionRefundRequestedWebhookHandler", () => {
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
    it("should request a refund in Stripe after authorize and charge", async () => {
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

      invariant(initializeResult.pspReference, `Missing initializeResult.pspReference`);

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

      expect(refundResult.amount).toEqual(222.99);
      expect(refundResult.result).toEqual(TransactionEventTypeEnum.RefundSuccess);
      const pspReference = refundResult.pspReference;
      expect(pspReference).toEqual(expect.any(String));
      expect(refundResult.externalUrl).toContain(pspReference);
    });

    it("should request a refund in Stripe after a charge", async () => {
      // charge
      const data = createMockStripeDataActionNotRequired();
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

      invariant(initializeResult.pspReference, `Missing initializeResult.pspReference`);

      // mock frontend action – adding payment method details (card)
      const stripeClient = getStripeApiClient(testEnv.TEST_PAYMENT_APP_SECRET_KEY);
      await stripeClient.paymentIntents.confirm(initializeResult.pspReference, {
        payment_method: paymentMethod,
      });

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

      expect(refundResult.amount).toEqual(222.99);
      expect(refundResult.result).toEqual(TransactionEventTypeEnum.RefundSuccess);
      const pspReference = refundResult.pspReference;
      expect(pspReference).toEqual(expect.any(String));
      expect(refundResult.externalUrl).toContain(pspReference);
    });

    it("should request a partial refund in Stripe after authorize and charge", async () => {
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

      invariant(initializeResult.pspReference, `Missing initializeResult.pspReference`);

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

      expect(refundResult.amount).toEqual(49.99);
      expect(refundResult.result).toEqual(TransactionEventTypeEnum.RefundSuccess);
      const pspReference = refundResult.pspReference;
      expect(pspReference).toEqual(expect.any(String));
      expect(refundResult.externalUrl).toContain(pspReference);
    });

    it("should request a partial refund in Stripe after a charge", async () => {
      // charge
      const data = createMockStripeDataActionNotRequired();
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

      invariant(initializeResult.pspReference, `Missing initializeResult.pspReference`);

      // mock frontend action – adding payment method details (card)
      const stripeClient = getStripeApiClient(testEnv.TEST_PAYMENT_APP_SECRET_KEY);
      await stripeClient.paymentIntents.confirm(initializeResult.pspReference, {
        payment_method: paymentMethod,
      });

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

      expect(refundResult.amount).toEqual(49.99);
      expect(refundResult.result).toEqual(TransactionEventTypeEnum.RefundSuccess);
      const pspReference = refundResult.pspReference;
      expect(pspReference).toEqual(expect.any(String));
      expect(refundResult.externalUrl).toContain(pspReference);
    });
  });
});
