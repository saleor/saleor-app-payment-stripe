import { describe, it, expect, vi } from "vitest";
import type * as settingsManagerModule from "@saleor/app-sdk/settings-manager";
import { MetadataManager } from "@saleor/app-sdk/settings-manager";
import { PaymentAppConfigurator } from "./payment-app-configuration";
import { testEnv } from "@/__tests__/test-env.mjs";
import { createClient } from "@/lib/create-graphq-client";
import { setupRecording } from "@/__tests__/polly";

describe("PaymentApp configuration factory", () => {
  setupRecording({});

  describe("getPaymentAppConfigurator", () => {
    it("returns working PaymentAppConfigurator instance", async (ctx) => {
      const { getPaymentAppConfigurator } = await import("./payment-app-configuration-factory");
      const client = createClient(testEnv.TEST_SALEOR_API_URL, async () =>
        Promise.resolve({ token: testEnv.TEST_SALEOR_APP_TOKEN }),
      );

      const configurator = getPaymentAppConfigurator(client, testEnv.TEST_SALEOR_API_URL);

      ctx.polly?.server.post(testEnv.TEST_SALEOR_API_URL).on("request", (req) => {
        expect(req.headers["authorization-bearer"]).toEqual(testEnv.TEST_SALEOR_APP_TOKEN);
        // @todo maybe we should parse graphql to AST here?
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(req.jsonBody().query).toMatch(`app {`);
      });

      ctx.polly?.server.post(testEnv.TEST_SALEOR_API_URL).intercept((_req, res) => {
        res.json({
          data: { app: {} },
        });
      });

      expect(configurator).toBeInstanceOf(PaymentAppConfigurator);
      await configurator.getConfig(); // trigger fetch request to Saleor
    });
  });

  describe("getWebhookPaymentAppConfigurator", () => {
    vi.doMock("@saleor/app-sdk/settings-manager", async () => {
      const actual = await vi.importActual<typeof settingsManagerModule>(
        "@saleor/app-sdk/settings-manager",
      );
      return {
        ...actual,
        EncryptedMetadataManager: MetadataManager,
        encrypt: vi.fn((data: string, _key: string) => {
          console.log(data, _key);
          return data;
        }),
        decrypt: vi.fn((data: string, _key: string) => {
          console.log(data, _key);
          return data;
        }),
      };
    });
    it("returns working PaymentAppConfigurator that uses app metadata from webhook requests", async () => {
      const { getWebhookPaymentAppConfigurator } = await import(
        "./payment-app-configuration-factory"
      );
      const configurator = getWebhookPaymentAppConfigurator(
        {
          metadata: [
            {
              key: `payment-app-config-public__${testEnv.TEST_SALEOR_API_URL}`,
              value: JSON.stringify({
                environment: "TEST" as const,
              }),
            },
          ],
          privateMetadata: [
            {
              key: `payment-app-config-hidden__${testEnv.TEST_SALEOR_API_URL}`,
              value: JSON.stringify({ apiKey: testEnv.TEST_PAYMENT_APP_API_KEY }),
            },
            {
              key: `payment-app-config-private__${testEnv.TEST_SALEOR_API_URL}`,
              value: JSON.stringify({}),
            },
          ],
        },
        testEnv.TEST_SALEOR_API_URL,
      );

      await expect(configurator.getConfig()).resolves.toStrictEqual({
        environment: "TEST",
        apiKey: testEnv.TEST_PAYMENT_APP_API_KEY,
      });
    });
  });
});
