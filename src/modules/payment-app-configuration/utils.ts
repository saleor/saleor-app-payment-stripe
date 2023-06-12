import { obfuscateConfig } from "../app-configuration/utils";
import {
  type PaymentAppConfigEntry,
  type PaymentAppEncryptedConfig,
  type PaymentAppUserVisibleConfigEntry,
  paymentAppUserVisibleConfigEntrySchema,
} from "./config-entry";

export const obfuscateConfigEntry = (
  entry: PaymentAppConfigEntry,
): PaymentAppUserVisibleConfigEntry => {
  const { apiKey, apiKeyId, clientKey, configurationName, configurationId } = entry;

  const configValuesToObfuscate = {
    apiKey,
  } satisfies PaymentAppEncryptedConfig;

  return paymentAppUserVisibleConfigEntrySchema.parse({
    apiKeyId,
    clientKey,
    configurationId,
    configurationName,
    ...obfuscateConfig(configValuesToObfuscate),
  } satisfies PaymentAppUserVisibleConfigEntry);
};
