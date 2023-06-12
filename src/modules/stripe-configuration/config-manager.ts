import { uuidv7 } from "uuidv7";
import { entryWebhookActions } from "../adyen-resources-v2/webhook-service";
import { type AppConfigurator } from "./app-configuration";
import {
  type AdyenEntryConfigUpdate,
  type AdyenEntryConfig,
  type AdyenInitEntryInput,
} from "./stripe-entries-config";
import { type AdyenConfigEntryUpdate } from "./input-schemas";
import { obfuscateConfigEntry } from "./utils";
import { checkAdyenApiKey } from "./adyen-key-utils";
import { createLogger, redactLogObject } from "@/lib/logger";
import { BaseError } from "@/errors";

export const EntryNotFoundError = BaseError.subclass("EntryNotFoundError");

export const getAllConfigEntriesObfuscated = async (configurator: AppConfigurator) => {
  const logger = createLogger(
    { saleorApiUrl: configurator.saleorApiUrl },
    { msgPrefix: "[getAllConfigEntriesObfuscated] " },
  );

  const config = await configurator.getConfigObfuscated();
  logger.debug("Got obfuscated config");

  return config.configurations;
};
export const getAllConfigEntriesDecrypted = async (configurator: AppConfigurator) => {
  const logger = createLogger(
    { saleorApiUrl: configurator.saleorApiUrl },
    { msgPrefix: "[getAllConfigEntriesDecrypted] " },
  );

  const config = await configurator.getConfig();
  logger.debug("Got config");

  return config.configurations;
};

const getConfigEntries = async (
  configurationId: string,
  configurator: AppConfigurator,
  obfuscated = true,
) => {
  const logger = createLogger(
    { configurationId, saleorApiUrl: configurator.saleorApiUrl, obfuscated },
    { msgPrefix: "[getConfigEntries] " },
  );

  logger.debug("Fetching all config entries");
  const entries = await (obfuscated
    ? getAllConfigEntriesObfuscated(configurator)
    : getAllConfigEntriesDecrypted(configurator));
  logger.debug("Got entries");

  const entry = entries.find((entry) => entry.configurationId === configurationId);

  if (!entry) {
    logger.warn("Entry was not found");
    throw new EntryNotFoundError(`Entry with id ${configurationId} was not found`);
  }

  logger.debug({ entryName: entry.configurationName }, "Found entry");
  return entry;
};

export const getConfigEntryObfuscated = async (
  configurationId: string,
  configurator: AppConfigurator,
) => getConfigEntries(configurationId, configurator, true);

export const getConfigEntryDecrypted = async (
  configurationId: string,
  configurator: AppConfigurator,
) => getConfigEntries(configurationId, configurator, false);

export const addConfigEntry = async (
  newConfigEntry: AdyenInitEntryInput,
  configurator: AppConfigurator,
) => {
  const logger = createLogger(
    { saleorApiUrl: configurator.saleorApiUrl },
    { msgPrefix: "[addConfigEntry] " },
  );

  const uuid = uuidv7();

  const key = await checkAdyenApiKey(newConfigEntry.apiKey, newConfigEntry.environment);

  const config = {
    ...newConfigEntry,
    configurationId: uuid,
    apiKeyId: key.id,
    companyId: key.companyName,
    apiKeyUsername: key.username,
    apiKeyScope: key.scope,
    merchantAccount: key.scope === "merchant" ? key.merchantId : undefined,
    clientKey: key.clientKey,
  } satisfies AdyenEntryConfig;

  logger.debug({ config: redactLogObject(config) }, "Adding new config entry");
  await configurator.setConfigEntry(config);
  logger.info({ configurationId: config.configurationId }, "Config entry added");

  return obfuscateConfigEntry(config);
};

export const updateConfigEntry = async (
  input: AdyenConfigEntryUpdate,
  configurator: AppConfigurator,
  appUrl: string,
) => {
  const logger = createLogger(
    { saleorApiUrl: configurator.saleorApiUrl },
    { msgPrefix: "[updateConfigEntry] " },
  );

  const { entry, configurationId } = input;
  logger.debug("Checking if config entry with provided ID exists");
  const existingEntry = await getConfigEntryDecrypted(configurationId, configurator);
  logger.debug({ existingEntry: redactLogObject(existingEntry) }, "Found entry");

  await configurator.setConfigEntry({
    ...entry,
    configurationId,
  });
  logger.info({ configurationId }, "Config entry updated");

  if ((entry.merchantAccount || existingEntry.merchantAccount) && !existingEntry.webhookId) {
    logger.info("Configuring webhook");
    const webhookResult = await entryWebhookActions.autoConfigure({
      entry: {
        ...existingEntry,
        ...entry,
      },
      saleorApiUrl: configurator.saleorApiUrl,
      appUrl,
    });

    const entryWebhookConfig: AdyenEntryConfigUpdate = {
      webhookId: webhookResult.webhook.id,
      webhookUsername: webhookResult.username,
      webhookPassword: webhookResult.password,
      webhookHmacKey: webhookResult.hmac,
      webhookHmacHash: webhookResult.hmacHash,
      configurationId,
    };

    await configurator.setConfigEntry(entryWebhookConfig);

    return obfuscateConfigEntry({
      ...existingEntry,
      ...entry,
      ...entryWebhookConfig,
    });
  }

  return obfuscateConfigEntry({
    ...existingEntry,
    ...entry,
  });
};

export const deleteConfigEntry = async (configurationId: string, configurator: AppConfigurator) => {
  const logger = createLogger(
    { configurationId, saleorApiUrl: configurator.saleorApiUrl },
    { msgPrefix: "[deleteConfigEntry] " },
  );

  logger.debug("Checking if config entry with provided ID exists");
  const existingEntry = await getConfigEntryDecrypted(configurationId, configurator);
  logger.debug({ existingEntry: redactLogObject(existingEntry) }, "Found entry");

  await configurator.deleteConfigEntry(configurationId);
  logger.info({ configurationId }, "Config entry deleted");
};
