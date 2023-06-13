import { CheckoutAPI as AdyenCheckoutAPI } from "@adyen/api-library";
import { describe, it, expect, vi } from "vitest";
import { PaymentMethodsRequest } from "@adyen/api-library/lib/src/typings/checkout/paymentMethodsRequest";
import { type PaymentMethodsResponse } from "@adyen/api-library/lib/src/typings/checkout/paymentMethodsResponse";
import { getFakeAppConfigurator } from "../adyen-configuration-v2/__tests__/app-configuration-factory";
import { filledFakeMetadataConfig } from "../adyen-configuration-v2/__tests__/utils";
import { PaymentGatewayInitializeSessionWebhookHandler } from "./payment-gateway-initialize-session";
import { createMockPaymentGatewayInitializeSessionEvent } from "./__tests__/utils";

import { setupRecording } from "@/__tests__/polly";
import { LanguageCodeEnum } from "generated/graphql";
import { testEnv } from "@/__tests__/test-env.mjs";
import { invariant } from "@/lib/invariant";

describe(`PaymentGatewayInitializeSessionWebhookHandler`, () => {
  setupRecording({});

  it("should work", async () => {
    const event = await createMockPaymentGatewayInitializeSessionEvent();
    const result = await PaymentGatewayInitializeSessionWebhookHandler(
      event,
      testEnv.TEST_SALEOR_API_URL,
    );
    expect(result.data).toEqual(expect.any(Object));
    invariant("paymentMethodsResponse" in result.data);
    expect(result.data.clientKey).toEqual(expect.any(String));
    expect(result.data.environment).toEqual(expect.any(String));
    expect(result.data.paymentMethodsResponse).toEqual(expect.any(Object));
    expect(result.data).toMatchInlineSnapshot(`
      {
        "clientKey": "test_XWQQ2EI2SJHK7AKAAOGIDHTE4Q2K7PX7",
        "environment": "TEST",
        "paymentMethodsResponse": PaymentMethodsResponse {
          "paymentMethods": [
            PaymentMethod {
              "brand": undefined,
              "brands": [
                "visa",
                "mc",
              ],
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Karta kredytowa",
              "type": "scheme",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Paysafecard",
              "type": "paysafecard",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": [
                "mc",
                "visa",
              ],
              "configuration": {
                "merchantId": "000000000206660",
                "merchantName": "SaleorECOM2",
              },
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Apple Pay",
              "type": "applepay",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Blik",
              "type": "blik",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": [
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "154",
                  "name": "BLIK - PSP",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "31",
                  "name": "Płacę z iPKO (PKO BP)",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "243",
                  "name": "mBank - mTransfer",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "112",
                  "name": "Pay with ING",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "20",
                  "name": "Santander-Przelew24",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "65",
                  "name": "Bank PEKAO S.A.",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "85",
                  "name": "Bank Millennium",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "88",
                  "name": "Pay with Alior Bank",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "143",
                  "name": "Banki Spółdzielcze",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "26",
                  "name": "Pay with Inteligo",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "33",
                  "name": "BNP Paribas Poland",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "144",
                  "name": "Bank Nowy S.A.",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "45",
                  "name": "Credit Agricole",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "99",
                  "name": "Pay with BOŚ",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "119",
                  "name": "Pay with CitiHandlowy",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "131",
                  "name": "Pay with Plus Bank",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "64",
                  "name": "Toyota Bank",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "153",
                  "name": "VeloBank",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "141",
                  "name": "e-transfer Pocztowy24",
                },
              ],
              "name": "Przelewy online",
              "type": "onlineBanking_PL",
            },
          ],
          "storedPaymentMethods": undefined,
        },
      }
    `);
  });

  it("should call gateway initialize when provided action is invalid", async () => {
    const event = await createMockPaymentGatewayInitializeSessionEvent({
      data: {
        action: "invalid action",
      },
    });
    const result = await PaymentGatewayInitializeSessionWebhookHandler(
      event,
      testEnv.TEST_SALEOR_API_URL,
    );
    expect(result.data).toEqual(expect.any(Object));
    invariant("paymentMethodsResponse" in result.data);
    expect(result.data.clientKey).toEqual(expect.any(String));
    expect(result.data.environment).toEqual(expect.any(String));
    expect(result.data.paymentMethodsResponse).toEqual(expect.any(Object));
    expect(result.data).toMatchInlineSnapshot(`
      {
        "clientKey": "test_XWQQ2EI2SJHK7AKAAOGIDHTE4Q2K7PX7",
        "environment": "TEST",
        "paymentMethodsResponse": PaymentMethodsResponse {
          "paymentMethods": [
            PaymentMethod {
              "brand": undefined,
              "brands": [
                "visa",
                "mc",
              ],
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Karta kredytowa",
              "type": "scheme",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Paysafecard",
              "type": "paysafecard",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": [
                "mc",
                "visa",
              ],
              "configuration": {
                "merchantId": "000000000206660",
                "merchantName": "SaleorECOM2",
              },
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Apple Pay",
              "type": "applepay",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Blik",
              "type": "blik",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": [
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "154",
                  "name": "BLIK - PSP",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "31",
                  "name": "Płacę z iPKO (PKO BP)",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "243",
                  "name": "mBank - mTransfer",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "112",
                  "name": "Pay with ING",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "20",
                  "name": "Santander-Przelew24",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "65",
                  "name": "Bank PEKAO S.A.",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "85",
                  "name": "Bank Millennium",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "88",
                  "name": "Pay with Alior Bank",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "143",
                  "name": "Banki Spółdzielcze",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "26",
                  "name": "Pay with Inteligo",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "33",
                  "name": "BNP Paribas Poland",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "144",
                  "name": "Bank Nowy S.A.",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "45",
                  "name": "Credit Agricole",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "99",
                  "name": "Pay with BOŚ",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "119",
                  "name": "Pay with CitiHandlowy",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "131",
                  "name": "Pay with Plus Bank",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "64",
                  "name": "Toyota Bank",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "153",
                  "name": "VeloBank",
                },
                PaymentMethodIssuer {
                  "disabled": undefined,
                  "id": "141",
                  "name": "e-transfer Pocztowy24",
                },
              ],
              "name": "Przelewy online",
              "type": "onlineBanking_PL",
            },
          ],
          "storedPaymentMethods": undefined,
        },
      }
    `);
  });

  it("should use the provided amount instead of total", async () => {
    const event = await createMockPaymentGatewayInitializeSessionEvent({
      amount: 10.45,
      sourceObject: {
        total: {
          gross: {
            amount: 123.45,
          },
        },
      },
    });

    const spy = vi
      .spyOn(AdyenCheckoutAPI.prototype, "paymentMethods")
      .mockResolvedValue({} as PaymentMethodsResponse);
    const result = await PaymentGatewayInitializeSessionWebhookHandler(
      event,
      testEnv.TEST_SALEOR_API_URL,
    );
    expect(result.data).toEqual(expect.any(Object));
    expect(spy.mock.lastCall?.[0].amount).toEqual({
      currency: "PLN",
      value: 1045,
    });
  });

  it("should use the web channel by default", async () => {
    const event = await createMockPaymentGatewayInitializeSessionEvent({
      amount: 10.45,
      sourceObject: {
        total: {
          gross: {
            amount: 123.45,
          },
        },
      },
    });

    const spy = vi
      .spyOn(AdyenCheckoutAPI.prototype, "paymentMethods")
      .mockResolvedValue({} as PaymentMethodsResponse);
    await PaymentGatewayInitializeSessionWebhookHandler(event, testEnv.TEST_SALEOR_API_URL);
    expect(spy.mock.lastCall?.[0].channel).toEqual(PaymentMethodsRequest.ChannelEnum.Web);
  });

  it("should use the provided channel instead of default web", async () => {
    const event = await createMockPaymentGatewayInitializeSessionEvent({
      amount: 10.45,
      sourceObject: {
        total: {
          gross: {
            amount: 123.45,
          },
        },
      },
      data: {
        channel: PaymentMethodsRequest.ChannelEnum.IOs,
      },
    });

    const spy = vi
      .spyOn(AdyenCheckoutAPI.prototype, "paymentMethods")
      .mockResolvedValue({} as PaymentMethodsResponse);
    await PaymentGatewayInitializeSessionWebhookHandler(event, testEnv.TEST_SALEOR_API_URL);
    expect(spy.mock.lastCall?.[0].channel).toEqual(PaymentMethodsRequest.ChannelEnum.IOs);
  });

  it("should work with Klarna", async () => {
    const event = await createMockPaymentGatewayInitializeSessionEvent({
      sourceObject: {
        languageCode: LanguageCodeEnum.En,
        total: {
          gross: {
            amount: 100.0,
            currency: "SEK",
          },
        },
        billingAddress: {
          country: {
            code: "SE",
          },
        },
      },
    });
    const result = await PaymentGatewayInitializeSessionWebhookHandler(
      event,
      testEnv.TEST_SALEOR_API_URL,
    );
    expect(result.data).toEqual(expect.any(Object));
    invariant("paymentMethodsResponse" in result.data);
    expect(result.data.clientKey).toEqual(expect.any(String));
    expect(result.data.environment).toEqual(expect.any(String));
    expect(result.data.paymentMethodsResponse).toEqual(expect.any(Object));
    expect(result.data).toMatchInlineSnapshot(`
      {
        "clientKey": "test_XWQQ2EI2SJHK7AKAAOGIDHTE4Q2K7PX7",
        "environment": "TEST",
        "paymentMethodsResponse": PaymentMethodsResponse {
          "paymentMethods": [
            PaymentMethod {
              "brand": undefined,
              "brands": [
                "mc",
                "visa",
              ],
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Card",
              "type": "scheme",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Pay later with Klarna.",
              "type": "klarna",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Paysafecard",
              "type": "paysafecard",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Pay over time with Klarna.",
              "type": "klarna_account",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": [
                "mc",
                "visa",
              ],
              "configuration": {
                "merchantId": "000000000206660",
                "merchantName": "SaleorECOM2",
              },
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Apple Pay",
              "type": "applepay",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Pay now with Klarna.",
              "type": "klarna_paynow",
            },
          ],
          "storedPaymentMethods": undefined,
        },
      }
    `);
  });

  it("should work with Clearpay", async () => {
    const event = await createMockPaymentGatewayInitializeSessionEvent({
      sourceObject: {
        languageCode: LanguageCodeEnum.En,
        total: {
          gross: {
            amount: 100.0,
            currency: "GBP",
          },
        },
        billingAddress: {
          country: {
            code: "GB",
          },
        },
      },
    });
    const result = await PaymentGatewayInitializeSessionWebhookHandler(
      event,
      testEnv.TEST_SALEOR_API_URL,
    );
    expect(result.data).toEqual(expect.any(Object));
    invariant("paymentMethodsResponse" in result.data);
    expect(result.data.clientKey).toEqual(expect.any(String));
    expect(result.data.environment).toEqual(expect.any(String));
    expect(result.data.paymentMethodsResponse).toEqual(expect.any(Object));
    expect(
      (result.data.paymentMethodsResponse.paymentMethods as Array<any>).map((p) => p.name),
    ).toContain(`Clearpay`);
    expect(result.data).toMatchInlineSnapshot(`
      {
        "clientKey": "test_XWQQ2EI2SJHK7AKAAOGIDHTE4Q2K7PX7",
        "environment": "TEST",
        "paymentMethodsResponse": PaymentMethodsResponse {
          "paymentMethods": [
            PaymentMethod {
              "brand": undefined,
              "brands": [
                "visa",
                "mc",
              ],
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Credit Card",
              "type": "scheme",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Paysafecard",
              "type": "paysafecard",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Pay later with Klarna.",
              "type": "klarna",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": [
                "visa",
                "mc",
              ],
              "configuration": {
                "merchantId": "000000000206660",
                "merchantName": "SaleorECOM2",
              },
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Apple Pay",
              "type": "applepay",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Clearpay",
              "type": "clearpay",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Pay over time with Klarna.",
              "type": "klarna_account",
            },
          ],
          "storedPaymentMethods": undefined,
        },
      }
    `);
  });

  it("should work with Afterpay", async () => {
    const event = await createMockPaymentGatewayInitializeSessionEvent({
      sourceObject: {
        languageCode: LanguageCodeEnum.En,
        total: {
          gross: {
            amount: 49.99,
            currency: "USD",
          },
        },
        billingAddress: {
          country: {
            code: "US",
          },
        },
      },
    });
    const result = await PaymentGatewayInitializeSessionWebhookHandler(
      event,
      testEnv.TEST_SALEOR_API_URL,
    );
    expect(result.data).toEqual(expect.any(Object));
    invariant("paymentMethodsResponse" in result.data);
    expect(result.data.clientKey).toEqual(expect.any(String));
    expect(result.data.environment).toEqual(expect.any(String));
    expect(result.data.paymentMethodsResponse).toEqual(expect.any(Object));
    expect(
      (result.data.paymentMethodsResponse.paymentMethods as Array<any>).map((p) => p.name),
    ).toContain(`Afterpay`);
    expect(result.data).toMatchInlineSnapshot(`
      {
        "clientKey": "test_XWQQ2EI2SJHK7AKAAOGIDHTE4Q2K7PX7",
        "environment": "TEST",
        "paymentMethodsResponse": PaymentMethodsResponse {
          "paymentMethods": [
            PaymentMethod {
              "brand": undefined,
              "brands": [
                "visa",
                "mc",
              ],
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Credit Card",
              "type": "scheme",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Afterpay",
              "type": "afterpaytouch",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": [
                "visa",
                "mc",
              ],
              "configuration": {
                "merchantId": "000000000206660",
                "merchantName": "SaleorECOM2",
              },
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Apple Pay",
              "type": "applepay",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Pay over time with Klarna.",
              "type": "klarna_account",
            },
            PaymentMethod {
              "brand": undefined,
              "brands": undefined,
              "configuration": undefined,
              "fundingSource": undefined,
              "group": undefined,
              "inputDetails": undefined,
              "issuers": undefined,
              "name": "Paysafecard",
              "type": "paysafecard",
            },
          ],
          "storedPaymentMethods": undefined,
        },
      }
    `);
  });

  describe("APPLEPAY_onvalidatemerchant", () => {
    it("should fail if apple pay is not configured", async () => {
      const configurator = getFakeAppConfigurator(
        {
          ...filledFakeMetadataConfig,
          configurations: [
            {
              ...filledFakeMetadataConfig.configurations[0],
              applePayCertificate: undefined,
            },
          ],
        },
        testEnv.TEST_SALEOR_API_URL,
      );
      const { privateMetadata } = await configurator.getRawConfig();

      const event = await createMockPaymentGatewayInitializeSessionEvent({
        data: {
          action: "APPLEPAY_onvalidatemerchant",
          validationURL: "https://apple-pay-gateway.apple.com/paymentservices/paymentSession",
          domain: "saleor.tofw.pl",
          merchantIdentifier: "merchant.com.adyen.saleorMichal.test",
          merchantName: "Michal Miszczyszyn Test Merchant ID",
        },
        recipient: {
          privateMetadata,
        },
      });
      await expect(
        PaymentGatewayInitializeSessionWebhookHandler(event, testEnv.TEST_SALEOR_API_URL),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        '"Missing Apple Pay Merchant Identity Certificate"',
      );
    });

    it("should work", async () => {
      const configurator = getFakeAppConfigurator(
        {
          ...filledFakeMetadataConfig,
          configurations: [
            {
              ...filledFakeMetadataConfig.configurations[0],
              applePayCertificate: testEnv.TEST_ADYEN_APPLEPAY_CERTIFICATE,
            },
          ],
        },
        testEnv.TEST_SALEOR_API_URL,
      );
      const { privateMetadata } = await configurator.getRawConfig();

      const event = await createMockPaymentGatewayInitializeSessionEvent({
        data: {
          action: "APPLEPAY_onvalidatemerchant",
          validationURL: "https://apple-pay-gateway.apple.com/paymentservices/paymentSession",
          domain: "saleor.tofw.pl",
          merchantIdentifier: "merchant.com.adyen.saleorMichal.test",
          merchantName: "Michal Miszczyszyn Test Merchant ID",
        },
        recipient: {
          privateMetadata,
        },
      });
      await expect(
        PaymentGatewayInitializeSessionWebhookHandler(event, testEnv.TEST_SALEOR_API_URL),
      ).resolves.toMatchInlineSnapshot(`
        {
          "data": {
            "applePayMerchantSession": {
              "displayName": "Michal Miszczyszyn Test Merchant ID",
              "domainName": "saleor.tofw.pl",
              "epochTimestamp": 1685013516378,
              "expiresAt": 1685017116378,
              "merchantIdentifier": "482F45B7C387B70E52CF8F2C2E240E7B198C18FF3BCE2284A3FC617BDBFA16D1",
              "nonce": "4b52e9aa",
              "operationalAnalyticsIdentifier": "Michal Miszczyszyn Test Merchant ID:482F45B7C387B70E52CF8F2C2E240E7B198C18FF3BCE2284A3FC617BDBFA16D1",
              "pspId": "482F45B7C387B70E52CF8F2C2E240E7B198C18FF3BCE2284A3FC617BDBFA16D1",
              "retries": 0,
              "signature": "308006092a864886f70d010702a0803080020101310d300b0609608648016503040201308006092a864886f70d0107010000a080308203e330820388a00302010202084c304149519d5436300a06082a8648ce3d040302307a312e302c06035504030c254170706c65204170706c69636174696f6e20496e746567726174696f6e204341202d20473331263024060355040b0c1d4170706c652043657274696669636174696f6e20417574686f7269747931133011060355040a0c0a4170706c6520496e632e310b3009060355040613025553301e170d3139303531383031333235375a170d3234303531363031333235375a305f3125302306035504030c1c6563632d736d702d62726f6b65722d7369676e5f5543342d50524f4431143012060355040b0c0b694f532053797374656d7331133011060355040a0c0a4170706c6520496e632e310b30090603550406130255533059301306072a8648ce3d020106082a8648ce3d03010703420004c21577edebd6c7b2218f68dd7090a1218dc7b0bd6f2c283d846095d94af4a5411b83420ed811f3407e83331f1c54c3f7eb3220d6bad5d4eff49289893e7c0f13a38202113082020d300c0603551d130101ff04023000301f0603551d2304183016801423f249c44f93e4ef27e6c4f6286c3fa2bbfd2e4b304506082b0601050507010104393037303506082b060105050730018629687474703a2f2f6f6373702e6170706c652e636f6d2f6f63737030342d6170706c65616963613330323082011d0603551d2004820114308201103082010c06092a864886f7636405013081fe3081c306082b060105050702023081b60c81b352656c69616e6365206f6e207468697320636572746966696361746520627920616e7920706172747920617373756d657320616363657074616e6365206f6620746865207468656e206170706c696361626c65207374616e64617264207465726d7320616e6420636f6e646974696f6e73206f66207573652c20636572746966696361746520706f6c69637920616e642063657274696669636174696f6e2070726163746963652073746174656d656e74732e303606082b06010505070201162a687474703a2f2f7777772e6170706c652e636f6d2f6365727469666963617465617574686f726974792f30340603551d1f042d302b3029a027a0258623687474703a2f2f63726c2e6170706c652e636f6d2f6170706c6561696361332e63726c301d0603551d0e041604149457db6fd57481868989762f7e578507e79b5824300e0603551d0f0101ff040403020780300f06092a864886f76364061d04020500300a06082a8648ce3d0403020349003046022100be09571fe71e1e735b55e5afacb4c72feb445f30185222c7251002b61ebd6f55022100d18b350a5dd6dd6eb1746035b11eb2ce87cfa3e6af6cbd8380890dc82cddaa63308202ee30820275a0030201020208496d2fbf3a98da97300a06082a8648ce3d0403023067311b301906035504030c124170706c6520526f6f74204341202d20473331263024060355040b0c1d4170706c652043657274696669636174696f6e20417574686f7269747931133011060355040a0c0a4170706c6520496e632e310b3009060355040613025553301e170d3134303530363233343633305a170d3239303530363233343633305a307a312e302c06035504030c254170706c65204170706c69636174696f6e20496e746567726174696f6e204341202d20473331263024060355040b0c1d4170706c652043657274696669636174696f6e20417574686f7269747931133011060355040a0c0a4170706c6520496e632e310b30090603550406130255533059301306072a8648ce3d020106082a8648ce3d03010703420004f017118419d76485d51a5e25810776e880a2efde7bae4de08dfc4b93e13356d5665b35ae22d097760d224e7bba08fd7617ce88cb76bb6670bec8e82984ff5445a381f73081f4304606082b06010505070101043a3038303606082b06010505073001862a687474703a2f2f6f6373702e6170706c652e636f6d2f6f63737030342d6170706c65726f6f7463616733301d0603551d0e0416041423f249c44f93e4ef27e6c4f6286c3fa2bbfd2e4b300f0603551d130101ff040530030101ff301f0603551d23041830168014bbb0dea15833889aa48a99debebdebafdacb24ab30370603551d1f0430302e302ca02aa0288626687474703a2f2f63726c2e6170706c652e636f6d2f6170706c65726f6f74636167332e63726c300e0603551d0f0101ff0404030201063010060a2a864886f7636406020e04020500300a06082a8648ce3d040302036700306402303acf7283511699b186fb35c356ca62bff417edd90f754da28ebef19c815e42b789f898f79b599f98d5410d8f9de9c2fe0230322dd54421b0a305776c5df3383b9067fd177c2c216d964fc6726982126f54f87a7d1b99cb9b0989216106990f09921d00003182018830820184020101308186307a312e302c06035504030c254170706c65204170706c69636174696f6e20496e746567726174696f6e204341202d20473331263024060355040b0c1d4170706c652043657274696669636174696f6e20417574686f7269747931133011060355040a0c0a4170706c6520496e632e310b300906035504061302555302084c304149519d5436300b0609608648016503040201a08193301806092a864886f70d010903310b06092a864886f70d010701301c06092a864886f70d010905310f170d3233303532353131313833365a302806092a864886f70d010934311b3019300b0609608648016503040201a10a06082a8648ce3d040302302f06092a864886f70d01090431220420e78b54948f63cda74f9070a3f4bcc53a6b51dbf42d0e7eaf9f56e4fa298d5cbc300a06082a8648ce3d04030204473045022100a61a5e00f0bd19c604ee64ac44c7a53e5e46423e0b95f803a3ee16846c80fac1022018f374d7cd455924dba551f506c458e01e98f47e72d013af77f2e3c71acd1e33000000000000",
            },
          },
        }
      `);
    });
  });
});
