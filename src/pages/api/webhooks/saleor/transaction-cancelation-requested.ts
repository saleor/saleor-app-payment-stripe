import { uuidv7 } from "uuidv7";

import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { type PageConfig } from "next";
import { saleorApp } from "@/saleor-app";
import {
  UntypedTransactionCancelationRequestedDocument,
  type TransactionCancelationRequestedEventFragment,
  TransactionEventTypeEnum,
} from "generated/graphql";
import { getSyncWebhookHandler } from "@/backend-lib/api-route-utils";
import { TransactionCancelationRequestedWebhookHandler } from "@/modules/webhooks/transaction-cancelation-requested";
import ValidateTransactionCancelationRequestedResponse from "@/schemas/TransactionCancelationRequested/TransactionCancelationRequestedResponse.mjs";

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

export const transactionCancelationRequestedSyncWebhook =
  new SaleorSyncWebhook<TransactionCancelationRequestedEventFragment>({
    name: "TransactionCancelationRequested",
    apl: saleorApp.apl,
    event: "TRANSACTION_CANCELATION_REQUESTED",
    query: UntypedTransactionCancelationRequestedDocument,
    webhookPath: "/api/webhooks/saleor/transaction-cancelation-requested",
  });

export default transactionCancelationRequestedSyncWebhook.createHandler(
  getSyncWebhookHandler(
    "transactionCancelationRequestedSyncWebhook",
    TransactionCancelationRequestedWebhookHandler,
    ValidateTransactionCancelationRequestedResponse,
    (_payload, errorResponse) => {
      return {
        message: errorResponse.message,
        result: TransactionEventTypeEnum.CancelFailure,
        // @todo consider making pspReference optional https://github.com/saleor/saleor/issues/12490
        pspReference: uuidv7(),
      } as const;
    },
  ),
);
