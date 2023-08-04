import { Box } from "@saleor/macaw-ui/next";
import { ChipSuccess, ChipStripeOrange, ChipInfo } from "@/modules/ui/atoms/Chip/Chip";
import { type PaymentAppUserVisibleConfigEntry } from "@/modules/payment-app-configuration/config-entry";
import { getEnvironmentFromKey, getStripeWebhookDashboardLink } from "@/modules/stripe/stripe-api";
import { appBridgeInstance } from "@/app-bridge-instance";

export const ConfigurationSummary = ({ config }: { config: PaymentAppUserVisibleConfigEntry }) => {
  return (
    <Box
      as="dl"
      display="grid"
      __gridTemplateColumns="max-content 1fr"
      rowGap={2}
      columnGap={2}
      alignItems="center"
      margin={0}
    >
      <Box as="dt" margin={0} fontSize="captionSmall" color="textNeutralSubdued">
        Environment
      </Box>
      <Box as="dd" margin={0} textAlign="right">
        {getEnvironmentFromKey(config.publishableKey) === "live" ? (
          <ChipSuccess>LIVE</ChipSuccess>
        ) : (
          <ChipStripeOrange>TESTING</ChipStripeOrange>
        )}
      </Box>
      <Box as="dt" margin={0} fontSize="captionSmall" color="textNeutralSubdued">
        Webhook ID
      </Box>
      <Box as="dd" margin={0} textAlign="right">
        <a
          href={getStripeWebhookDashboardLink(
            config.webhookId,
            getEnvironmentFromKey(config.publishableKey),
          )}
          onClick={() =>
            void appBridgeInstance?.dispatch({
              type: "redirect",
              payload: {
                actionId: "getStripeWebhookDashboardLink",
                to: getStripeWebhookDashboardLink(
                  config.webhookId,
                  getEnvironmentFromKey(config.publishableKey),
                ),
                newContext: true,
              },
            })
          }
          target="_blank"
        >
          <ChipInfo>{config.webhookId}</ChipInfo>
        </a>
      </Box>
    </Box>
  );
};
