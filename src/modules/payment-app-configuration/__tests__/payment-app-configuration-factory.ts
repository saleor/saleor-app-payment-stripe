import { encrypt, type MetadataEntry } from "@saleor/app-sdk/settings-manager";
import {
  type BrandedEncryptedMetadataManager,
  type BrandedMetadataManager,
  createWebhookPrivateSettingsManager,
  createWebhookPublicSettingsManager,
} from "../../app-configuration/metadata-manager";
import { serializeSettingsToMetadata } from "../../app-configuration/app-configuration";
import {
  type PaymentAppConfig,
  type PaymentAppEncryptedConfig,
  type PaymentAppInternalConfig,
  type PaymentAppPublicConfig,
} from "../payment-app-config";
import {
  PaymentAppConfigurator,
  hiddenMetadataKey,
  privateMetadataKey,
  publicMetadataKey,
} from "../payment-app-configuration";
import { env } from "@/lib/env.mjs";

export type MetadataManagerOverride = {
  private?: (metadata: MetadataEntry[]) => BrandedEncryptedMetadataManager;
  public?: (metadata: MetadataEntry[]) => BrandedMetadataManager;
};

export const getFakePaymentAppConfigurator = (
  config: PaymentAppConfig,
  saleorApiUrl: string,
  metadataManager?: MetadataManagerOverride,
) => {
  const { apiKey, apiKeyId, clientKey, ...remainingConfig } = config;

  const exhaustiveCheck: Record<string, never> = remainingConfig;
  exhaustiveCheck;

  const hiddenConfig: Partial<PaymentAppInternalConfig> = {
    apiKeyId,
  };

  const publicConfig: Partial<PaymentAppPublicConfig> = {
    clientKey,
  };

  const privateConfig: Partial<PaymentAppEncryptedConfig> = {
    apiKey,
  };

  const privateConfigEntries: MetadataEntry[] = [
    serializeSettingsToMetadata({
      key: privateMetadataKey,
      value: encrypt(JSON.stringify(privateConfig), env.SECRET_KEY),
      domain: saleorApiUrl,
    }),
    serializeSettingsToMetadata({
      key: hiddenMetadataKey,
      value: encrypt(JSON.stringify(hiddenConfig), env.SECRET_KEY),
      domain: saleorApiUrl,
    }),
  ];

  const publicConfigEntries: MetadataEntry[] = [
    serializeSettingsToMetadata({
      key: publicMetadataKey,
      value: JSON.stringify(publicConfig),
      domain: saleorApiUrl,
    }),
  ];

  const getPublicSettingsManager = () => {
    if (metadataManager?.public) {
      return metadataManager.public(publicConfigEntries);
    }
    return createWebhookPublicSettingsManager(publicConfigEntries);
  };

  const getPrivateSettingsManager = () => {
    if (metadataManager?.private) {
      return metadataManager.private(privateConfigEntries);
    }
    return createWebhookPrivateSettingsManager(privateConfigEntries);
  };

  return new PaymentAppConfigurator(
    getPrivateSettingsManager(),
    getPublicSettingsManager(),
    saleorApiUrl,
  );
};
