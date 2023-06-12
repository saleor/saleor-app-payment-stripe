import { obfuscateConfig } from "../app-configuration/utils";
import {
  type AdyenEntryConfig,
  type AdyenEntryEncryptedConfig,
  type AdyenUserVisibleEntryConfig,
  adyenUserVisibleEntryConfig,
} from "./stripe-entries-config";

export const obfuscateConfigEntry = (entry: AdyenEntryConfig): AdyenUserVisibleEntryConfig => {
  const {
    apiKey,
    apiKeyId,
    apiKeyUsername,
    webhookHmacHash,
    webhookId,
    configurationName,
    configurationId,
    environment,
    apiKeyScope,
    merchantAccount,
    companyId,
    clientKey,
    applePayCertificate,
  } = entry;

  const configValuesToObfuscate = {
    applePayCertificate,
    apiKey,
  } satisfies AdyenEntryEncryptedConfig;

  return adyenUserVisibleEntryConfig.parse({
    ...obfuscateConfig(configValuesToObfuscate),
    apiKeyId,
    apiKeyUsername,
    webhookHmacHash,
    webhookId,
    configurationName,
    configurationId,
    environment,
    apiKeyScope,
    merchantAccount,
    companyId,
    clientKey,
  } satisfies AdyenUserVisibleEntryConfig);
};
