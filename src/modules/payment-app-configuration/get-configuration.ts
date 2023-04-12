import { createLogger } from "../../lib/logger";
import { paymentAppCombinedSchema, defaultPaymentAppConfig } from "./payment-app-config";
import { type PaymentAppConfigurator } from "./payment-app-configuration";

interface Settings {
  configurator: PaymentAppConfigurator;
}

export async function getPaymentAppConfig({ configurator }: Settings) {
  const logger = createLogger(
    { saleorApiUrl: configurator.saleorApiUrl },
    { msgPrefix: "[getPaymentAppConfig] " },
  );
  const obfuscatedConfig = await configurator.getConfigObfuscated();

  logger.debug("Got PaymentApp obfuscated cofnig", { obfuscatedConfig });

  if (Object.keys(obfuscatedConfig ?? {}).length > 0) {
    logger.debug("Obfuscated config is not empty, parsing", { obfuscatedConfig });
    const parsedConfig = paymentAppCombinedSchema.parse(obfuscatedConfig);

    return {
      ...defaultPaymentAppConfig,
      ...parsedConfig,
    };
  }

  logger.debug("Config doesn't exist, returning null");
  return null;
}
