import { type MetadataEntry, encrypt } from "@saleor/app-sdk/settings-manager";
import { type AdyenAppConfig } from "../app-config";
import { AppConfigurator, appMetadataKey } from "../app-configuration";
import {
  type BrandedEncryptedMetadataManager,
  createWebhookPrivateSettingsManager,
} from "@/modules/app-configuration/metadata-manager";
import { env } from "@/lib/env.mjs";
import { serializeSettingsToMetadata } from "@/modules/app-configuration/app-configuration";

export type MetadataManagerOverride = (
  metadata: MetadataEntry[],
) => BrandedEncryptedMetadataManager;

export const getFakeAppConfigurator = (
  config: AdyenAppConfig,
  saleorApiUrl: string,
  metadataManagerOverride?: MetadataManagerOverride,
) => {
  const privateConfigEntries: MetadataEntry[] = [
    serializeSettingsToMetadata({
      key: appMetadataKey,
      value: encrypt(JSON.stringify(config), env.SECRET_KEY),
      domain: saleorApiUrl,
    }),
  ];

  const getPrivateMetadataManager = () => {
    if (metadataManagerOverride) {
      return metadataManagerOverride(privateConfigEntries);
    }

    return createWebhookPrivateSettingsManager(privateConfigEntries);
  };

  return new AppConfigurator(getPrivateMetadataManager(), saleorApiUrl);
};
