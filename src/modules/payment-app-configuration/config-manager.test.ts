/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi } from "vitest";
import { OBFUSCATION_DOTS } from "../app-configuration/utils";
import {
  addConfigEntry,
  updateConfigEntry,
  EntryNotFoundError,
  deleteConfigEntry,
  getConfigEntryObfuscated,
  getAllConfigEntriesObfuscated,
} from "./config-manager";
import { configEntryAll } from "./__tests__/mocks";
import { obfuscateConfigEntry } from "./utils";
import { type ConfigEntryUpdate } from "./input-schemas";
import { type PaymentAppConfigurator } from "./payment-app-configuration";
import {
  type PaymentAppConfigEntryFullyConfigured,
  type PaymentAppFormConfigEntry,
} from "./config-entry";
import { deleteStripeWebhook } from "./webhook-manager";
import { testEnv } from "@/__tests__/test-env.mjs";

vi.mock("@/modules/stripe/stripe-api", async () => {
  return {
    validateStripeKeys: () => {},
  };
});

vi.mock("@/modules/payment-app-configuration/webhook-manager", () => {
  return {
    createStripeWebhook: async () => ({
      webhookSecret: "ws_secret",
      webhookId: "12345",
    }),
    deleteStripeWebhook: vi.fn(async () => {}),
  };
});

const mockConfigurator = {
  getConfig: vi.fn(async () => ({ configurations: [configEntryAll] })),
  getConfigObfuscated: vi.fn(async () => ({
    configurations: [obfuscateConfigEntry(configEntryAll)],
  })),
  setConfigEntry: vi.fn(async () => {}),
  saleorApiUrl: testEnv.TEST_SALEOR_API_URL,
  deleteConfigEntry: vi.fn(async () => {}),
} as unknown as PaymentAppConfigurator;

describe("getAllConfigEntriesObfuscated", () => {
  it("calls configurator and returns data", async () => {
    const entries = await getAllConfigEntriesObfuscated(mockConfigurator);

    expect(entries).toEqual([obfuscateConfigEntry(configEntryAll)]);
    expect(mockConfigurator.getConfigObfuscated).toHaveBeenCalledTimes(1);
  });
});

describe("findConfigEntry", () => {
  it("calls getAllConfigEntriesObfuscated and finds entry with provided ID", async () => {
    const entry = await getConfigEntryObfuscated(configEntryAll.configurationId, mockConfigurator);

    expect(entry).toEqual(obfuscateConfigEntry(configEntryAll));
    expect(mockConfigurator.getConfigObfuscated).toHaveBeenCalledTimes(1);
  });
});

describe("addConfigEntry", () => {
  it("generates random id for new config entry, creates webhook in Stripe, saves config entry in configurator, returns new config entry which has obfuscated fields", async () => {
    const input: PaymentAppFormConfigEntry = {
      configurationName: "new-config",
      secretKey: "new-key",
      publishableKey: "client-key",
    };
    const result = await addConfigEntry(input, mockConfigurator, "http://stripe.saleor.io");

    expect(result).toStrictEqual({
      configurationId: expect.any(String),
      configurationName: input.configurationName,
      secretKey: `${OBFUSCATION_DOTS}key`,
      publishableKey: "client-key",
    });
    expect(mockConfigurator.setConfigEntry).toHaveBeenCalledTimes(1);
    expect(mockConfigurator.setConfigEntry).toHaveBeenCalledWith({
      configurationId: expect.any(String),
      configurationName: input.configurationName,
      secretKey: "new-key",
      publishableKey: "client-key",
      webhookId: "12345",
      webhookSecret: "ws_secret",
    });
  });
});

describe("updateConfigEntry", () => {
  it("checks if entry exists, updates entry in configurator", async () => {
    const input = {
      configurationId: configEntryAll.configurationId,
      entry: {
        configurationName: "new-name",
        secretKey: "updated-key",
        publishableKey: configEntryAll.publishableKey,
      },
    } satisfies ConfigEntryUpdate;

    const result = await updateConfigEntry(input, mockConfigurator);

    expect(result).toEqual(
      obfuscateConfigEntry({
        ...configEntryAll,
        configurationName: "new-name",
      }),
    );
    expect(mockConfigurator.setConfigEntry).toHaveBeenCalledWith({
      ...input.entry,
      configurationId: input.configurationId,
    });
  });

  it("throws an error if config entry is not found", async () => {
    const input = {
      configurationId: "non-existing-id",
      entry: {
        configurationName: configEntryAll.configurationName,
        secretKey: "updated-key",
        publishableKey: configEntryAll.publishableKey,
      },
    } satisfies ConfigEntryUpdate;

    await expect(updateConfigEntry(input, mockConfigurator)).rejects.toThrow(EntryNotFoundError);
  });
});

describe("deleteConfigEntry", () => {
  it("checks if entry exists, deletes entry in configurator, deletes Stripe webhook", async () => {
    const result = await deleteConfigEntry(configEntryAll.configurationId, mockConfigurator);

    expect(result).toBeUndefined();
    expect(mockConfigurator.getConfig).toHaveBeenCalledOnce();
    expect(mockConfigurator.deleteConfigEntry).toHaveBeenCalledWith(configEntryAll.configurationId);
    expect(deleteStripeWebhook).toHaveBeenCalledOnce();
  });

  it("checks if entry exists, skips deleting Stripe webhook if it exists in other config", async () => {
    const additionalEntry = {
      ...configEntryAll,
      configurationId: "other-config-id",
    } satisfies PaymentAppConfigEntryFullyConfigured;

    const testMockConfigurator = {
      ...mockConfigurator,
      getConfig: vi.fn(async () => ({ configurations: [configEntryAll, additionalEntry] })),
    } as unknown as PaymentAppConfigurator;

    const result = await deleteConfigEntry(configEntryAll.configurationId, testMockConfigurator);
    expect(result).toBeUndefined();
    expect(testMockConfigurator.getConfig).toHaveBeenCalledOnce();
    expect(mockConfigurator.deleteConfigEntry).toHaveBeenCalledWith(configEntryAll.configurationId);
    expect(deleteStripeWebhook).not.toHaveBeenCalled();
  });

  it("throws an error if config entry is not found", async () => {
    await expect(deleteConfigEntry("non-existing-id", mockConfigurator)).rejects.toThrow(
      EntryNotFoundError,
    );
  });
});
