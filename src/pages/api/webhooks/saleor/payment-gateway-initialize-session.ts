import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import { type PageConfig } from "next";
import { saleorApp } from "@/saleor-app";
import {
  UntypedPaymentGatewayInitializeSessionDocument,
  type PaymentGatewayInitializeSessionEventFragment,
} from "generated/graphql";
import { PaymentGatewayInitializeSessionWebhookHandler } from "@/modules/webhooks/payment-gateway-initialize-session";
import { getSyncWebhookHandler } from "@/backend-lib/api-route-utils";
import ValidatePaymentGatewayInitializeSessionResponse from "@/schemas/PaymentGatewayInitializeSession/PaymentGatewayInitializeSessionResponse.mjs";

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

export const paymentGatewayInitializeSessionSyncWebhook =
  new SaleorSyncWebhook<PaymentGatewayInitializeSessionEventFragment>({
    name: "PaymentGatewayInitializeSession",
    apl: saleorApp.apl,
    event: "PAYMENT_GATEWAY_INITIALIZE_SESSION",
    query: UntypedPaymentGatewayInitializeSessionDocument,
    webhookPath: "/api/webhooks/saleor/payment-gateway-initialize-session",
  });

export default paymentGatewayInitializeSessionSyncWebhook.createHandler(
  getSyncWebhookHandler(
    "paymentGatewayInitializeSessionSyncWebhook",
    PaymentGatewayInitializeSessionWebhookHandler,
    ValidatePaymentGatewayInitializeSessionResponse,
    (payload, errorResponse) => {
      return {
        message: errorResponse.message,
        data: {
          errors: errorResponse.errors,
          paymentMethodsResponse: {},
          publishableKey: "",
          environment: "TEST",
        },
      } as const;
    },
  ),
);
