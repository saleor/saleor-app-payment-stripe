import { Text } from "@saleor/macaw-ui/next";
import { withAuthorization } from "@saleor/app-sdk/app-bridge";
import { AppLayout } from "@/modules/ui/templates/AppLayout";
import { StripeConfigurationForm } from "@/modules/ui/organisms/AddStripeConfigurationForm/AddStripeConfigurationForm";

const AddConfigurationPage = () => {
  return (
    <AppLayout
      title="Stripe > Add configuration"
      description={
        <>
          <Text as="p" variant="body" size="medium">
            Create new Stripe configuration.
          </Text>
          <Text as="p" variant="body" size="medium">
            Stripe Webhooks will be created automatically.
          </Text>
        </>
      }
    >
      <StripeConfigurationForm configurationId={undefined} />
    </AppLayout>
  );
};

export default withAuthorization()(AddConfigurationPage);
