import { type MetadataEntry } from "@saleor/app-sdk/settings-manager";
import { type Client } from "urql";
import {
  createPrivateSettingsManager,
  createPublicSettingsManager,
  createWebhookPrivateSettingsManager,
  createWebhookPublicSettingsManager,
} from "../app-configuration/metadata-manager";
import { PaymentAppConfigurator } from "./payment-app-configuration";

export const getPaymentAppConfigurator = (client: Client, saleorApiUrl: string) => {
  return new PaymentAppConfigurator(
    createPrivateSettingsManager(client),
    createPublicSettingsManager(client),
    saleorApiUrl,
  );
};

export const getWebhookPaymentAppConfigurator = (
  data: {
    privateMetadata: readonly Readonly<MetadataEntry>[];
    metadata: readonly Readonly<MetadataEntry>[];
  },
  saleorApiUrl: string,
) => {
  return new PaymentAppConfigurator(
    createWebhookPrivateSettingsManager(data.privateMetadata as MetadataEntry[]),
    createWebhookPublicSettingsManager(data.metadata as MetadataEntry[]),
    saleorApiUrl,
  );
};
