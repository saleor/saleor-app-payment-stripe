import {
  type PaymentAppConfigEntry,
  type PaymentAppConfigEntryFullyConfigured,
} from "../config-entry";

export const configEntryRequired: PaymentAppConfigEntry = {
  configurationName: "test",
  apiKey: "super-secret-key",
  configurationId: "mock-id",
};

export const configEntryAll: PaymentAppConfigEntryFullyConfigured = {
  configurationName: "test",
  apiKey: "super-secret-key",
  apiKeyId: "1234",
  clientKey: "not-that-secret-key",
  configurationId: "mock-id",
  webhookPassword: "password",
};
