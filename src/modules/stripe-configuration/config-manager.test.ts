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
import { type AppConfigurator } from "./app-configuration";
import { configEntryAll } from "./__tests__/mocks";
import { type AdyenConfigEntryUpdate } from "./input-schemas";
import { type AdyenInitEntryInput } from "./stripe-entries-config";
import { obfuscateConfigEntry } from "./utils";
import { testEnv } from "@/__tests__/test-env.mjs";

vi.mock("@/modules/adyen-configuration-v2/adyen-key-utils", () => {
  return {
    checkAdyenApiKey: () => {
      return {
        apiKeyId: "1",
        companyId: "2",
        apiKeyUsername: "3",
        apiKeyScope: "4",
        merchantAccount: "merchant",
        clientKey: "5",
      };
    },
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
} as unknown as AppConfigurator;

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
  it("generates random id for new config entry, saves config entry in configurator, returns new config entry which has obfuscated fields", async () => {
    const input: AdyenInitEntryInput = {
      configurationName: "new-config",
      apiKey: "new-key",
      environment: "TEST" as const,
    };
    const result = await addConfigEntry(input, mockConfigurator);

    expect(result).toStrictEqual({
      configurationName: input.configurationName,
      apiKey: `${OBFUSCATION_DOTS}key`,
      environment: input.environment,
      configurationId: expect.any(String),
      clientKey: expect.any(String),

      // other fields should be undefined
      apiKeyId: undefined,
      apiKeyUsername: undefined,
      webhookHmacHash: undefined,
      webhookId: undefined,
      apiKeyScope: undefined,
      merchantAccount: undefined,
      companyId: undefined,
      applePayCertificate: undefined,
    });
    expect(mockConfigurator.setConfigEntry).toHaveBeenCalledTimes(1);
  });
});

describe("updateConfigEntry", () => {
  it("checks if entry exists, updates entry in configurator", async () => {
    const input = {
      configurationId: configEntryAll.configurationId,
      entry: {
        configurationName: "new-name",
        environment: "TEST",
      },
    } satisfies AdyenConfigEntryUpdate;

    const result = await updateConfigEntry(input, mockConfigurator, "");

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
        merchantAccount: configEntryAll.merchantAccount,
        configurationName: configEntryAll.configurationName,
        applePayCertificate: "newCertificate",
        environment: "TEST",
      },
    } satisfies AdyenConfigEntryUpdate;

    await expect(updateConfigEntry(input, mockConfigurator, "")).rejects.toThrow(
      EntryNotFoundError,
    );
  });
});

describe("deleteConfigEntry", () => {
  it("checks if entry exists, deletes entry in configurator", async () => {
    const result = await deleteConfigEntry(configEntryAll.configurationId, mockConfigurator);

    expect(result).toBeUndefined();
    expect(mockConfigurator.getConfig).toHaveBeenCalledOnce();
    expect(mockConfigurator.deleteConfigEntry).toHaveBeenCalledWith(configEntryAll.configurationId);
  });

  it("throws an error if config entry is not found", async () => {
    await expect(deleteConfigEntry("non-existing-id", mockConfigurator)).rejects.toThrow(
      EntryNotFoundError,
    );
  });
});
