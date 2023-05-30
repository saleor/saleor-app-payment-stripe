import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFakePaymentAppConfigurator } from "./__tests__/payment-app-configuration-factory";
import { defaultPaymentAppConfig } from "./payment-app-config";
import { getPaymentAppConfig } from "./get-configuration";
import { filledFakeMetadataConfig } from "./__tests__/utils";
import { testEnv } from "@/__tests__/test-env.mjs";

describe("getConfiguration", () => {
  const configurator = getFakePaymentAppConfigurator(
    defaultPaymentAppConfig,
    testEnv.TEST_SALEOR_API_URL,
  );
  const settings: Parameters<typeof getPaymentAppConfig>[0] = {
    configurator,
  };
  const getConfigFn = vi.spyOn(configurator, "getConfigObfuscated");

  beforeEach(() => {
    getConfigFn.mockClear();
  });

  it("returns null if config is null", async () => {
    // @ts-expect-error make tests easier
    getConfigFn.mockImplementationOnce(async () => null);
    await expect(getPaymentAppConfig(settings)).resolves.toBeNull();
    expect(getConfigFn).toHaveBeenCalledOnce();
  });

  it("returns null if config is empty", async () => {
    // @ts-expect-error make tests easier
    getConfigFn.mockImplementationOnce(async () => ({}));
    await expect(getPaymentAppConfig(settings)).resolves.toBeNull();
    expect(getConfigFn).toHaveBeenCalledOnce();
  });

  it("returns obfuscated config if config is not empty", async () => {
    getConfigFn.mockImplementationOnce(async () => filledFakeMetadataConfig);
    await expect(getPaymentAppConfig(settings)).resolves.toEqual(filledFakeMetadataConfig);
    expect(getConfigFn).toHaveBeenCalledOnce();
  });
});
