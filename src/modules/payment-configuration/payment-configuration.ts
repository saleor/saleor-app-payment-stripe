import { type SettingsManager } from "@saleor/app-sdk/settings-manager";
import { PrivateMetadataAppConfigurator } from "../app-configuration/app-configuration";
import { type PaymentProviderConfig } from "./payment-config";

export class PaymentProviderConfiguratior extends PrivateMetadataAppConfigurator<PaymentProviderConfig> {
  constructor(metadataManager: SettingsManager, saleorApiUrl: string) {
    super(metadataManager, saleorApiUrl, "payment-provider");
  }
}
