import { encrypt, type MetadataEntry } from "@saleor/app-sdk/settings-manager";
import {
  type AppConfigurator,
  PrivateMetadataAppConfigurator,
  PublicMetadataAppConfiguration,
} from "../app-configuration/app-configuration";
import {
  type BrandedEncryptedMetadataManager,
  type BrandedMetadataManager,
} from "../app-configuration/metadata-manager";
import {
  type PaymentAppConfigFullyConfigured,
  paymentAppFullyConfiguredSchema,
  type PaymentAppConfig,
  type PaymentAppEncryptedConfig,
  type PaymentAppFormConfig,
  type PaymentAppInternalConfig,
  type PaymentAppPublicConfig,
} from "./payment-app-config";
import { env } from "@/lib/env.mjs";
import { BaseError } from "@/errors";

export const privateMetadataKey = "payment-app-config-private";
export const hiddenMetadataKey = "payment-app-config-hidden";
export const publicMetadataKey = "payment-app-config-public";

export const AppNotConfiguredError = BaseError.subclass(`AppNotConfiguredError`);

export class PaymentAppConfigurator implements AppConfigurator<PaymentAppConfig> {
  private privateConfigurator: PrivateMetadataAppConfigurator<PaymentAppEncryptedConfig>;
  private publicConfigurator: PublicMetadataAppConfiguration<PaymentAppPublicConfig>;
  private hiddenConfigurator: PrivateMetadataAppConfigurator<PaymentAppInternalConfig>;
  public saleorApiUrl: string;

  constructor(
    privateMetadataManager: BrandedEncryptedMetadataManager,
    publicMetadataManager: BrandedMetadataManager,
    saleorApiUrl: string,
  ) {
    this.privateConfigurator = new PrivateMetadataAppConfigurator(
      privateMetadataManager,
      saleorApiUrl,
      privateMetadataKey,
    );
    this.hiddenConfigurator = new PrivateMetadataAppConfigurator(
      privateMetadataManager,
      saleorApiUrl,
      hiddenMetadataKey,
    );
    this.publicConfigurator = new PublicMetadataAppConfiguration(
      publicMetadataManager,
      saleorApiUrl,
      publicMetadataKey,
    );
    this.saleorApiUrl = saleorApiUrl;
  }

  async getConfig(): Promise<PaymentAppConfig | undefined> {
    const [hiddenConfig, privateConfig, publicConfig] = await Promise.all([
      this.hiddenConfigurator.getConfig(),
      this.privateConfigurator.getConfig(),
      this.publicConfigurator.getConfig(),
    ]);

    if (privateConfig && publicConfig) {
      return {
        ...hiddenConfig,
        ...privateConfig,
        ...publicConfig,
      };
    }

    return undefined;
  }

  async getConfigSafe(): Promise<PaymentAppConfigFullyConfigured> {
    const config = await this.getConfig();
    const result = paymentAppFullyConfiguredSchema.safeParse(config);

    if (result.success) {
      return result.data;
    }

    throw new AppNotConfiguredError("App is missing configuration fields", { cause: result.error });
  }

  async getRawConfig(): Promise<{ metadata: MetadataEntry[]; privateMetadata: MetadataEntry[] }> {
    const encryptFn = (data: string) => encrypt(data, env.SECRET_KEY);

    const [hiddenConfig, privateConfig, publicConfig] = await Promise.all([
      this.hiddenConfigurator.getRawConfig(encryptFn),
      this.privateConfigurator.getRawConfig(encryptFn),
      this.publicConfigurator.getRawConfig(),
    ]);

    return {
      metadata: publicConfig,
      privateMetadata: [...hiddenConfig, ...privateConfig],
    };
  }

  async getConfigObfuscated() {
    const [privateConfigObfuscated, publicConfig] = await Promise.all([
      this.privateConfigurator.getConfigObfuscated(),
      this.publicConfigurator.getConfig(),
    ]);

    if (privateConfigObfuscated && publicConfig) {
      return {
        ...privateConfigObfuscated,
        ...publicConfig,
      };
    }
  }

  /** Saves config that is available to user */
  async setConfigPublic(newConfig: PaymentAppFormConfig, replace = false) {
    const { apiKey, clientKey: clientKey } = newConfig;

    const publicConfig: Partial<PaymentAppPublicConfig> = {
      clientKey: clientKey,
    };

    const privateConfig: Partial<PaymentAppEncryptedConfig> = {
      apiKey,
    };

    await Promise.all([
      this.privateConfigurator.setConfig(privateConfig, replace),
      this.publicConfigurator.setConfig(publicConfig, replace),
    ]);
  }

  /** Saves config including hidden fields */
  async setConfig(newConfig: Partial<PaymentAppConfig>, replace = false) {
    const { apiKey, apiKeyId: apiKeyId, clientKey, ...remainingConfig } = newConfig;

    const exhaustiveCheck: Record<string, never> = remainingConfig;
    exhaustiveCheck;

    const hiddenConfig: Partial<PaymentAppInternalConfig> = {
      apiKeyId: apiKeyId,
    };

    const publicConfig: Partial<PaymentAppPublicConfig> = {
      clientKey: clientKey,
    };

    const privateConfig: Partial<PaymentAppEncryptedConfig> = {
      apiKey,
    };

    await Promise.all([
      this.hiddenConfigurator.setConfig(hiddenConfig, replace),
      this.privateConfigurator.setConfig(privateConfig, replace),
      this.publicConfigurator.setConfig(publicConfig, replace),
    ]);
  }

  async clearConfig() {
    await Promise.all([
      this.hiddenConfigurator.clearConfig(),
      this.privateConfigurator.clearConfig(),
      this.publicConfigurator.clearConfig(),
    ]);
  }
}
