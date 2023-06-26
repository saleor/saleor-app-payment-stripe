import {
  type PaymentAppConfigEntry,
  type PaymentAppConfigEntryFullyConfigured,
} from "../config-entry";

export const configEntryRequired: PaymentAppConfigEntry = {
  configurationName: "test",
  secretKey: "sk_secret-key",
  publishableKey: "pk_that-secret-key",
  configurationId: "mock-id",
};

export const configEntryAll: PaymentAppConfigEntryFullyConfigured = {
  configurationName: "test",
  secretKey: "sk_secret-key",
  publishableKey: "pk_that-secret-key",
  configurationId: "mock-id",
};
