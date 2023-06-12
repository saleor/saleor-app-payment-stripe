/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi } from "vitest";
import { type Client } from "urql";
import { type AppConfigurator } from "./app-configuration";
import {
  fetchChannels,
  getMappingFromAppConfig,
  setMappingInAppConfig,
  EntryDoesntExistError,
} from "./mapping-manager";
import { FetchChannelsDocument } from "generated/graphql";

describe("fetchChannels", () => {
  it("should make a query to Saleor GraphQL endpoint and return channels", async () => {
    const mockClient = {
      query: vi.fn().mockReturnValue({
        toPromise: () => Promise.resolve({ error: null, data: { channels: [] } }),
      }),
    } as unknown as Client;

    await fetchChannels(mockClient);

    expect(mockClient.query).toBeCalledWith(FetchChannelsDocument, {});
  });
});

describe("getMappingFromAppConfig", () => {
  it("should return correct mapping from app config", async () => {
    const mockClient = {
      query: vi.fn().mockReturnValue({
        toPromise: () => Promise.resolve({ error: null, data: { channels: [{ id: "123" }] } }),
      }),
    } as unknown as Client;

    const mockConfigurator = {
      getConfigObfuscated: vi
        .fn()
        .mockResolvedValue({ channelToConfigurationId: { "123": "config1" } }),
    } as unknown as AppConfigurator;

    const result = await getMappingFromAppConfig(mockClient, mockConfigurator);

    expect(result).toEqual({ "123": "config1" });
  });
});

describe("setMappingInAppConfig", () => {
  it("should throw error if configurationId does not exist", async () => {
    const mockConfigurator = {
      getConfig: vi.fn().mockResolvedValue({ configurations: [] }),
    } as unknown as AppConfigurator;

    await expect(
      setMappingInAppConfig({ channelId: "123", configurationId: "nonexistent" }, mockConfigurator),
    ).rejects.toThrow(EntryDoesntExistError);
  });

  it("should call setMapping if configurationId exists", async () => {
    const mockConfigurator = {
      getConfig: vi.fn().mockResolvedValue({ configurations: [{ configurationId: "exist" }] }),
      setMapping: vi.fn(),
      getConfigObfuscated: vi
        .fn()
        .mockResolvedValue({ channelToConfigurationId: { "123": "exist" } }),
    } as unknown as AppConfigurator;

    await setMappingInAppConfig({ channelId: "123", configurationId: "exist" }, mockConfigurator);

    expect(mockConfigurator.setMapping).toBeCalledWith({ "123": "exist" });
  });
});
