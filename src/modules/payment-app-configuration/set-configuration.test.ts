import { describe, it, expect, vi, beforeEach } from "vitest";
import { getFakePaymentAppConfigurator } from "./__tests__/payment-app-configuration-factory";
import { setPaymentAppConfiguration } from "./set-configuration";
import { defaultPaymentAppConfig } from "./payment-app-config";
import { testEnv } from "@/__tests__/test-env.mjs";
import { setupRecording } from "@/__tests__/polly";

describe("Set configuration module", () => {
  setupRecording({});

  const configurator = getFakePaymentAppConfigurator(
    defaultPaymentAppConfig,
    testEnv.TEST_SALEOR_API_URL,
  );

  describe("setConfiguration", () => {
    vi.spyOn(configurator, "getConfig").mockImplementation(() =>
      Promise.resolve(defaultPaymentAppConfig),
    );
    const setConfig = vi
      .spyOn(configurator, "setConfig")
      .mockImplementation(() => Promise.resolve());

    beforeEach(() => {
      setConfig.mockClear();
    });

    it("updates private api key metadata if it is included in new config", async () => {
      const settings = {
        configurator,
        config: {
          apiKey: testEnv.TEST_PAYMENT_APP_API_KEY,
        },
        replace: false,
      } as Parameters<typeof setPaymentAppConfiguration>[0];
      await setPaymentAppConfiguration(settings);
      expect(setConfig).toHaveBeenCalledWith({
        apiKey: testEnv.TEST_PAYMENT_APP_API_KEY,
        apiKeyId: null,
        clientKey: null,
      });
    });
  });
});
