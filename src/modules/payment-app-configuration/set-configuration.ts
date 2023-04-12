import { merge } from "lodash-es";
import { createLogger } from "../../lib/logger";
import { type PaymentAppConfig, type PaymentAppFormConfig } from "./payment-app-config";
import { type PaymentAppConfigurator } from "./payment-app-configuration";

export async function setPaymentAppConfiguration({
  config,
  configurator,
  replace,
}: {
  config: PaymentAppFormConfig;
  configurator: PaymentAppConfigurator;
  replace: boolean;
}) {
  const logger = createLogger(
    { saleorApiUrl: configurator.saleorApiUrl },
    { msgPrefix: "[setPaymentAppConfiguration] " },
  );
  if (config.apiKey) {
    logger.debug("New privatateKey passed in config, checking if valid");
    const existingConfig = await configurator.getConfig();

    const combinedConfig: PaymentAppConfig = merge(existingConfig, config);
    logger.debug({ combinedConfig }, "Setting config from user with generated data");

    return configurator.setConfig(combinedConfig);
  }

  logger.debug({ config }, "Setting config from user");
  return configurator.setConfigPublic(config, replace);
}
