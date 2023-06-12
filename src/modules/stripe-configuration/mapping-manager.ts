import { type Client } from "urql";
import { type AppConfigurator } from "./app-configuration";
import { type MappingUpdate } from "./input-schemas";
import { createLogger } from "@/lib/logger";
import { BaseError, FieldError } from "@/errors";
import { FetchChannelsDocument, type FetchChannelsQuery } from "generated/graphql";

export const EntryDoesntExistError = FieldError.subclass("EntryDoesntExistError", {
  props: { fieldName: "configurationId" },
});

export const FetchChannelsError = BaseError.subclass("FetchChannelsError");

export const fetchChannels = async (client: Client) => {
  const { error, data } = await client
    .query<FetchChannelsQuery>(FetchChannelsDocument, {})
    .toPromise();

  if (error) {
    throw new FetchChannelsError("Error while fetching channels", { cause: error });
  }

  return data?.channels ?? [];
};

export const getMappingFromAppConfig = async (client: Client, configurator: AppConfigurator) => {
  const logger = createLogger(
    { saleorApiUrl: configurator.saleorApiUrl },
    { msgPrefix: "[getMappingFromAppConfig] " },
  );
  logger.debug("Fetching channels from Saleor and config");

  const [channels, config] = await Promise.all([
    fetchChannels(client),
    configurator.getConfigObfuscated(),
  ]);
  logger.debug({ channels: channels, config: config.channelToConfigurationId }, "Received data");

  const emptyMapping = Object.fromEntries(channels.map((channel) => [channel.id, null]));
  logger.debug({ emptyMapping: emptyMapping }, "Prepared empty mapping");

  return {
    ...emptyMapping,
    ...config.channelToConfigurationId,
  };
};

export const setMappingInAppConfig = async (
  input: MappingUpdate,
  configurator: AppConfigurator,
) => {
  const { configurationId, channelId } = input;
  const logger = createLogger(
    { input: { configurationId, channelId }, saleorApiUrl: configurator.saleorApiUrl },
    { msgPrefix: "[setMappingInAppConfig] " },
  );
  const config = await configurator.getConfig();
  logger.debug("Got app config");

  const entry = config.configurations.find(
    (entry) => entry.configurationId === input.configurationId,
  );

  if (!entry) {
    logger.error("Entry with configurationId doesn't exist");
    throw new EntryDoesntExistError(
      `Entry with configurationId ${input.configurationId} doesn't exist`,
    );
  }
  logger.info("Entry with configurationId exists, updating app config");

  await configurator.setMapping({
    [input.channelId]: input.configurationId,
  });

  logger.debug("Updated app config");

  const updatedConfig = await configurator.getConfigObfuscated();
  return updatedConfig.channelToConfigurationId;
};
