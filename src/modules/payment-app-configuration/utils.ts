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
  const { secretKey, publishableKey, configurationName, configurationId } = entry;

  const configValuesToObfuscate = {
    secretKey,
  } satisfies PaymentAppEncryptedConfig;

  return paymentAppUserVisibleConfigEntrySchema.parse({
    publishableKey,
    configurationId,
    configurationName,
    ...obfuscateConfig(configValuesToObfuscate),
  } satisfies PaymentAppUserVisibleConfigEntry);
};
