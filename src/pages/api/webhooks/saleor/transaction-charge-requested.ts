import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { type PageConfig } from "next";
import { uuidv7 } from "uuidv7";
import { saleorApp } from "@/saleor-app";
import {
  UntypedTransactionChargeRequestedDocument,
  type TransactionChargeRequestedEventFragment,
  TransactionEventTypeEnum,
} from "generated/graphql";
import { getSyncWebhookHandler } from "@/backend-lib/api-route-utils";
import { TransactionChargeRequestedWebhookHandler } from "@/modules/webhooks/transaction-charge-requested";
import ValidateTransactionChargeRequestedResponse from "@/schemas/TransactionChargeRequested/TransactionChargeRequestedResponse.mjs";

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

export const transactionChargeRequestedSyncWebhook =
  new SaleorSyncWebhook<TransactionChargeRequestedEventFragment>({
    name: "TransactionChargeRequested",
    apl: saleorApp.apl,
    event: "TRANSACTION_CHARGE_REQUESTED",
    query: UntypedTransactionChargeRequestedDocument,
    webhookPath: "/api/webhooks/saleor/transaction-charge-requested",
  });

export default transactionChargeRequestedSyncWebhook.createHandler(
  getSyncWebhookHandler(
    "transactionChargeRequestedSyncWebhook",
    TransactionChargeRequestedWebhookHandler,
    ValidateTransactionChargeRequestedResponse,
    (_payload, errorResponse) => {
      return {
        message: errorResponse.message,
        result: TransactionEventTypeEnum.ChargeFailure,
        // @todo consider making pspReference optional https://github.com/saleor/saleor/issues/12490
        pspReference: uuidv7(),
      } as const;
    },
  ),
);
