import { Box } from "@saleor/macaw-ui/next";
import { ChipNeutral, ChipSuccess, ChipDanger, ChipInfo } from "../../atoms/Chip/Chip";
import { type PaymentAppConfigEntry } from "@/modules/payment-app-configuration/config-entry";

export const ConfigurationSummary = ({ config }: { config: PaymentAppConfigEntry }) => {
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
        Username
      </Box>
      <Box as="dd" margin={0} textAlign="right">
        <ChipNeutral>{config.apiKeyUsername}</ChipNeutral>
      </Box>
      <Box as="dt" margin={0} fontSize="captionSmall" color="textNeutralSubdued">
        Merchant Account
      </Box>
      <Box as="dd" margin={0} textAlign="right">
        <ChipNeutral>{config.merchantAccount || "—"}</ChipNeutral>
      </Box>
      <Box as="dt" margin={0} fontSize="captionSmall" color="textNeutralSubdued">
        Environment
      </Box>
      <Box as="dd" margin={0} textAlign="right">
        {config.environment === "LIVE" ? (
          <ChipSuccess>LIVE</ChipSuccess>
        ) : (
          <ChipDanger>TESTING</ChipDanger>
        )}
      </Box>
      <Box as="dt" margin={0} fontSize="captionSmall" color="textNeutralSubdued">
        Apple Pay
      </Box>
      <Box as="dd" margin={0} textAlign="right">
        {config.applePayCertificate ? (
          <ChipInfo>Enabled</ChipInfo>
        ) : (
          <ChipNeutral>Disabled</ChipNeutral>
        )}
      </Box>
    </Box>
  );
};
