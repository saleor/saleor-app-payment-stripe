import { type MetadataEntry, encrypt } from "@saleor/app-sdk/settings-manager";
import {
  type GenericAppConfigurator,
  PrivateMetadataAppConfigurator,
} from "../app-configuration/app-configuration";
import { type BrandedEncryptedMetadataManager } from "../app-configuration/metadata-manager";
import { obfuscateConfigEntry } from "./utils";
import { type StripeEntryFullyConfigured } from "./stripe-entries-config";
import { type StripeAppConfig, stripeAppConfigSchema, type ChannelMapping } from "./app-config";
import { env } from "@/lib/env.mjs";
import { createLogger } from "@/lib/logger";

export const appMetadataKey = "stripe-app-config-v2";

export class AppConfigurator implements GenericAppConfigurator<StripeAppConfig> {
  private configurator: PrivateMetadataAppConfigurator<StripeAppConfig>;
  public saleorApiUrl: string;

  constructor(metadataManager: BrandedEncryptedMetadataManager, saleorApiUrl: string) {
    this.configurator = new PrivateMetadataAppConfigurator(
      metadataManager,
      saleorApiUrl,
      appMetadataKey,
    );
    this.saleorApiUrl = saleorApiUrl;
  }

  async getConfig(): Promise<StripeAppConfig> {
    const config = await this.configurator.getConfig();
    return stripeAppConfigSchema.parse(config);
  }

  async getConfigEntry(
    configurationId: string,
  ): Promise<StripeEntryFullyConfigured | null | undefined> {
    const config = await this.configurator.getConfig();
    return config?.configurations.find((entry) => entry.configurationId === configurationId);
  }

  async getRawConfig(): Promise<{ privateMetadata: MetadataEntry[] }> {
    const encryptFn = (data: string) => encrypt(data, env.SECRET_KEY);
    const config = await this.configurator.getRawConfig(encryptFn);

    return {
      privateMetadata: config,
    };
  }

  async getConfigObfuscated(): Promise<StripeAppConfig> {
    const { configurations, channelToConfigurationId } = await this.getConfig();

    return {
      configurations: configurations.map((entry) => obfuscateConfigEntry(entry)),
      channelToConfigurationId,
    };
  }

  /** Adds new config entry or updates existing one */
  async setConfigEntry(newConfiguration: StripeEntryFullyConfigured) {
    const { configurations } = await this.getConfig();

    const existingEntryIndex = configurations.findIndex(
      (entry) => entry.configurationId === newConfiguration.configurationId,
    );

    if (existingEntryIndex !== -1) {
      const existingEntry = configurations[existingEntryIndex];
      const mergedEntry = {
        ...existingEntry,
        ...newConfiguration,
      };

      const newConfigurations = configurations.slice(0);
      newConfigurations[existingEntryIndex] = mergedEntry;
      return this.setConfig({ configurations: newConfigurations });
    }

    return this.setConfig({
      configurations: [...configurations, newConfiguration],
    });
  }

  async deleteConfigEntry(configurationId: string) {
    const oldConfig = await this.getConfig();
    const newConfigurations = oldConfig.configurations.filter(
      (entry) => entry.configurationId !== configurationId,
    );
    const newMappings = Object.fromEntries(
      Object.entries(oldConfig.channelToConfigurationId).filter(
        ([, configId]) => configId !== configurationId,
      ),
    );
    await this.setConfig(
      { ...oldConfig, configurations: newConfigurations, channelToConfigurationId: newMappings },
      true,
    );
  }

  /** Adds new mappings or updates exsting ones */
  async setMapping(newMapping: ChannelMapping) {
    const { channelToConfigurationId } = await this.getConfig();
    return this.setConfig({
      channelToConfigurationId: { ...channelToConfigurationId, ...newMapping },
    });
  }

  async deleteMapping(channelId: string) {
    const { channelToConfigurationId } = await this.getConfig();
    const newMapping = { ...channelToConfigurationId };
    delete newMapping[channelId];
    return this.setConfig({ channelToConfigurationId: newMapping });
  }

  /** Method that directly updates the config in MetadataConfigurator.
   *  You should probably use setConfigEntry or setMapping instead */
  async setConfig(newConfig: Partial<StripeAppConfig>, replace = false) {
    return this.configurator.setConfig(newConfig, replace);
  }

  async clearConfig() {
    const defaultConfig = stripeAppConfigSchema.parse(undefined);
    return this.setConfig(defaultConfig, true);
  }
}

export const getConfigurationForChannel = (
  appConfig: StripeAppConfig,
  channelId?: string | undefined | null,
) => {
  const logger = createLogger({ channelId }, { msgPrefix: `[getConfigurationForChannel] ` });
  if (!channelId) {
    logger.warn("Missing channelId");
    return null;
  }

  const configurationId = appConfig.channelToConfigurationId[channelId];
  if (!configurationId) {
    logger.warn("Missing mapping for channelId");
    return null;
  }

  const stripeConfig = appConfig.configurations.find(
    (config) => config.configurationId === configurationId,
  );
  if (!stripeConfig) {
    logger.warn({ configurationId }, "Missing configuration for configurationId");
    return null;
  }
  return stripeConfig;
};
