import { type MetadataEntry } from "@saleor/app-sdk/settings-manager";
import { type Client } from "urql";
import {
  createPrivateSettingsManager,
  createWebhookPrivateSettingsManager,
} from "../app-configuration/metadata-manager";
import { AppConfigurator } from "./app-configuration";

export const getAppConfigurator = (client: Client, saleorApiUrl: string) => {
  return new AppConfigurator(createPrivateSettingsManager(client), saleorApiUrl);
};

export const getWebhookAppConfigurator = (
  data: {
    privateMetadata: readonly Readonly<MetadataEntry>[];
  },
  saleorApiUrl: string,
) => {
  return new AppConfigurator(
    createWebhookPrivateSettingsManager(data.privateMetadata as MetadataEntry[]),
    saleorApiUrl,
  );
};
