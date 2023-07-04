import { Readable } from "node:stream";
import merge from "lodash-es/merge";
import { describe, it, vi, expect } from "vitest";
import { type NextApiRequest } from "next";
import type Stripe from "stripe";
import type * as configurationFactoryModule from "../payment-app-configuration/payment-app-configuration-factory";
import { getFilledFakeMetadataConfigurator } from "../payment-app-configuration/__tests__/utils";
import { getStripeApiClient } from "../stripe/stripe-api";
import { stripeWebhookHandler } from "./stripe-webhook";
import { testEnv } from "@/__tests__/test-env.mjs";
import { setupRecording } from "@/__tests__/polly";
import { TransactionActionEnum } from "generated/graphql";

vi.mock("../payment-app-configuration/payment-app-configuration-factory", async () => {
  const actual = await vi.importActual<typeof configurationFactoryModule>(
    "../payment-app-configuration/payment-app-configuration-factory",
  );

  return {
    ...actual,
    getPaymentAppConfigurator: vi.fn(() => getFilledFakeMetadataConfigurator()),
  };
});

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

const createMockStripeEvent = (
  overrides: DeepPartial<Stripe.DiscriminatedEvent.PaymentIntentEvent>,
) => {
  return merge(
    {
      id: "evt_3NQ63WEosEcNBN5m1g4vSCvI",
      object: "event",
      api_version: "2022-08-01",
      created: Date.now() / 1000,
      data: {
        object: {
          id: "pi_3NQ63WEosEcNBN5m1AB4zgVN",
          object: "payment_intent",
          amount: 2000,
          amount_capturable: 0,
          amount_details: {
            tip: {},
          },
          amount_received: 2000,
          application: null,
          application_fee_amount: null,
          automatic_payment_methods: null,
          canceled_at: null,
          cancellation_reason: null,
          capture_method: "automatic",
          charges: {
            object: "list",
            data: [
              {
                id: "ch_3NQ63WEosEcNBN5m1xPmXlzQ",
                object: "charge",
                amount: 2000,
                amount_captured: 2000,
                amount_refunded: 0,
                application: null,
                application_fee: null,
                application_fee_amount: null,
                balance_transaction: "txn_3NQ63WEosEcNBN5m1kuFOTeH",
                billing_details: {
                  address: {
                    city: null,
                    country: null,
                    line1: null,
                    line2: null,
                    postal_code: null,
                    state: null,
                  },
                  email: null,
                  name: null,
                  phone: null,
                },
                calculated_statement_descriptor: "Stripe",
                captured: true,
                created: Date.now() / 1000,
                currency: "usd",
                customer: null,
                description: "(created by Stripe CLI)",
                destination: null,
                dispute: null,
                disputed: false,
                failure_balance_transaction: null,
                failure_code: null,
                failure_message: null,
                fraud_details: {},
                invoice: null,
                livemode: false,
                metadata: {
                  channelId: "1",
                  transactionId: "420",
                },
                on_behalf_of: null,
                order: null,
                outcome: {
                  network_status: "approved_by_network",
                  reason: null,
                  risk_level: "normal",
                  risk_score: 17,
                  seller_message: "Payment complete.",
                  type: "authorized",
                },
                paid: true,
                payment_intent: "pi_3NQ63WEosEcNBN5m1AB4zgVN",
                payment_method: "pm_1NQ63WEosEcNBN5mAQ9JNokZ",
                payment_method_details: {
                  card: {
                    brand: "visa",
                    checks: {
                      address_line1_check: null,
                      address_postal_code_check: null,
                      cvc_check: null,
                    },
                    country: "US",
                    exp_month: 7,
                    exp_year: 2024,
                    fingerprint: "7aB2lHdoeemL4wct",
                    funding: "credit",
                    installments: null,
                    last4: "4242",
                    mandate: null,
                    network: "visa",
                    network_token: {
                      used: false,
                    },
                    three_d_secure: null,
                    wallet: null,
                  },
                  type: "card",
                },
                receipt_email: null,
                receipt_number: null,
                receipt_url:
                  "https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xTFZad3hFb3NFY05CTjVtKJfcj6UGMgZNVOI-RcQ6LBbbB8smhr5AzEmXDebHf65GAxmk_bkMFUCp1ZB_c9cU2w_X8KR0H0Mm5j3u",
                refunded: false,
                refunds: {
                  object: "list",
                  data: [],
                  has_more: false,
                  total_count: 0,
                  url: "/v1/charges/ch_3NQ63WEosEcNBN5m1xPmXlzQ/refunds",
                },
                review: null,
                shipping: {
                  address: {
                    city: "San Francisco",
                    country: "US",
                    line1: "510 Townsend St",
                    line2: null,
                    postal_code: "94103",
                    state: "CA",
                  },
                  carrier: null,
                  name: "Jenny Rosen",
                  phone: null,
                  tracking_number: null,
                },
                source: null,
                source_transfer: null,
                statement_descriptor: null,
                statement_descriptor_suffix: null,
                status: "succeeded",
                transfer_data: null,
                transfer_group: null,
              },
            ],
            has_more: false,
            total_count: 1,
            url: "/v1/charges?payment_intent=pi_3NQ63WEosEcNBN5m1AB4zgVN",
          },
          client_secret: "pi_3NQ63WEosEcNBN5m1AB4zgVN_secret_0Pm1FhPHo2j7SVOxd2enckIkb",
          confirmation_method: "automatic",
          created: 1688464918,
          currency: "usd",
          customer: null,
          description: "(created by Stripe CLI)",
          invoice: null,
          last_payment_error: null,
          latest_charge: "ch_3NQ63WEosEcNBN5m1xPmXlzQ",
          livemode: false,
          metadata: {
            channelId: "1",
            transactionId: "420",
          },
          next_action: null,
          on_behalf_of: null,
          payment_method: "pm_1NQ63WEosEcNBN5mAQ9JNokZ",
          payment_method_options: {
            card: {
              installments: null,
              mandate_options: null,
              network: null,
              request_three_d_secure: "automatic",
            },
          },
          payment_method_types: ["card"],
          processing: null,
          receipt_email: null,
          review: null,
          setup_future_usage: null,
          shipping: {
            address: {
              city: "San Francisco",
              country: "US",
              line1: "510 Townsend St",
              line2: null,
              postal_code: "94103",
              state: "CA",
            },
            carrier: null,
            name: "Jenny Rosen",
            phone: null,
            tracking_number: null,
          },
          source: null,
          statement_descriptor: null,
          statement_descriptor_suffix: null,
          status: "succeeded",
          transfer_data: null,
          transfer_group: null,
        },
      },
      livemode: false,
      pending_webhooks: 2,
      request: {
        id: "req_eQqf484VGeHAYm",
        idempotency_key: "947cdd9e-03d7-4e8f-b79e-b1fecff78c7f",
      },
      type: "payment_intent.succeeded",
    },
    overrides,
  );
};

const createMockRequest = ({
  body,
  query,
  headers,
}: {
  body: string;
  query: Record<string, string>;
  headers: Record<string, string>;
}) => {
  const request = Readable.from([body]) as NextApiRequest;
  request.query = query;
  request.headers = headers;
  return request;
};

describe("stripe-webhook", () => {
  setupRecording({});

  describe("stripeWebhookHandler", () => {
    it(`throw if saleorApiUrl is not provided in query`, async () => {
      const stripe = getStripeApiClient(testEnv.TEST_PAYMENT_APP_SECRET_KEY);
      const body = JSON.stringify(createMockStripeEvent({ type: "payment_intent.succeeded" }));
      const signature = stripe.webhooks.generateTestHeaderString({
        payload: body,
        secret: testEnv.TEST_PAYMENT_APP_WEBHOOK_SECRET,
      });

      await expect(
        stripeWebhookHandler(
          createMockRequest({
            body,
            query: {},
            headers: {
              "stripe-signature": signature,
            },
          }),
        ),
      ).rejects.toMatch(/MissingSaleorApiUrlError/);
    });

    it(`throw if Stripe signature header is not provided`, async () => {
      await expect(
        stripeWebhookHandler(
          createMockRequest({
            body: JSON.stringify(createMockStripeEvent({ type: "payment_intent.succeeded" })),
            query: {
              saleorApiUrl: testEnv.TEST_SALEOR_API_URL,
            },
            headers: {},
          }),
        ),
      ).rejects.toMatch(/MissingSignatureError/);
    });

    it(`ignores misconfigured requests`, async () => {
      const stripe = getStripeApiClient(testEnv.TEST_PAYMENT_APP_SECRET_KEY);
      const body = JSON.stringify(
        createMockStripeEvent({
          type: "payment_intent.succeeded",
          data: { object: { metadata: { channelId: "some-channel-420" } } },
        }),
      );
      const signature = stripe.webhooks.generateTestHeaderString({
        payload: body,
        secret: testEnv.TEST_PAYMENT_APP_WEBHOOK_SECRET,
      });

      await expect(
        stripeWebhookHandler(
          createMockRequest({
            body,
            query: {
              saleorApiUrl: testEnv.TEST_SALEOR_API_URL,
            },
            headers: {
              "stripe-signature": signature,
            },
          }),
        ),
      ).resolves.toBeNull();
    });

    it(`handles payment_intent.succeeded`, async (ctx) => {
      const localGraphqlUrl = testEnv.TEST_SALEOR_API_URL;
      const event = createMockStripeEvent({ type: "payment_intent.succeeded" });

      ctx.polly?.server.post(localGraphqlUrl).on("request", (req) => {
        expect(req.headers["authorization-bearer"]).toEqual(testEnv.TEST_SALEOR_APP_TOKEN);
        // @todo maybe we should parse graphql to AST here?
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(req.jsonBody().query).toMatch(`transactionEventReport(`);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const variables = req.jsonBody().variables;
        expect(variables).toEqual({
          transactionId: "420",
          amount: 20,
          externalUrl: `https://dashboard.stripe.com/payments/${event.data.object.id}`,
          message: "(created by Stripe CLI)",
          pspReference: event.data.object.id,
          time: expect.any(String),
          type: "CHARGE_SUCCESS",
          availableActions: [TransactionActionEnum.Refund],
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expect(Date.parse(variables.time)).not.toBeNaN();
      });

      ctx.polly?.server.post(localGraphqlUrl).intercept((_req, res) => {
        res.json({
          data: { transactionEventReport: { alreadyProcessed: false, errors: [] } },
        });
      });

      const stripe = getStripeApiClient(testEnv.TEST_PAYMENT_APP_SECRET_KEY);
      const body = JSON.stringify(event);
      const signature = stripe.webhooks.generateTestHeaderString({
        payload: body,
        secret: testEnv.TEST_PAYMENT_APP_WEBHOOK_SECRET,
      });

      await expect(
        stripeWebhookHandler(
          createMockRequest({
            body,
            query: {
              saleorApiUrl: testEnv.TEST_SALEOR_API_URL,
            },
            headers: {
              "stripe-signature": signature,
            },
          }),
        ),
      ).resolves.toMatchInlineSnapshot(`
        {
          "data": {
            "transactionEventReport": {
              "alreadyProcessed": false,
              "errors": [],
            },
          },
          "errors": [],
        }
      `);
    });

    it(`handles payment_intent.payment_failed`, async (ctx) => {
      const localGraphqlUrl = testEnv.TEST_SALEOR_API_URL;
      const event = createMockStripeEvent({ type: "payment_intent.payment_failed" });

      ctx.polly?.server.post(localGraphqlUrl).on("request", (req) => {
        expect(req.headers["authorization-bearer"]).toEqual(testEnv.TEST_SALEOR_APP_TOKEN);
        // @todo maybe we should parse graphql to AST here?
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(req.jsonBody().query).toMatch(`transactionEventReport(`);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const variables = req.jsonBody().variables;
        expect(variables).toEqual({
          transactionId: "420",
          amount: 20,
          externalUrl: `https://dashboard.stripe.com/payments/${event.data.object.id}`,
          message: "(created by Stripe CLI)",
          pspReference: event.data.object.id,
          time: expect.any(String),
          type: "CHARGE_FAILURE",
          availableActions: [],
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        expect(Date.parse(variables.time)).not.toBeNaN();
      });

      ctx.polly?.server.post(localGraphqlUrl).intercept((_req, res) => {
        res.json({
          data: { transactionEventReport: { alreadyProcessed: false, errors: [] } },
        });
      });

      const stripe = getStripeApiClient(testEnv.TEST_PAYMENT_APP_SECRET_KEY);
      const body = JSON.stringify(event);
      const signature = stripe.webhooks.generateTestHeaderString({
        payload: body,
        secret: testEnv.TEST_PAYMENT_APP_WEBHOOK_SECRET,
      });

      await expect(
        stripeWebhookHandler(
          createMockRequest({
            body,
            query: {
              saleorApiUrl: testEnv.TEST_SALEOR_API_URL,
            },
            headers: {
              "stripe-signature": signature,
            },
          }),
        ),
      ).resolves.toMatchInlineSnapshot(`
        {
          "data": {
            "transactionEventReport": {
              "alreadyProcessed": false,
              "errors": [],
            },
          },
          "errors": [],
        }
      `);
    });
  });
});
