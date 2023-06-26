import { Text } from "@saleor/macaw-ui/next";
import { withAuthorization } from "@saleor/app-sdk/app-bridge";
import { useRouter } from "next/router";
import { AppLayout } from "@/modules/ui/templates/AppLayout";
import { StripeConfigurationForm } from "@/modules/ui/organisms/AddStripeConfigurationForm/AddStripeConfigurationForm";

const EditConfigurationPage = () => {
  const router = useRouter();
  if (typeof router.query.configurationId !== "string" || !router.query.configurationId) {
    // TODO: Add loading
    return <div />;
  }

  return (
    <AppLayout
      title="Stripe > Edit configuration"
      description={
        <>
          <Text as="p" variant="body" size="medium">
            Edit Stripe configuration.
          </Text>
          <Text as="p" variant="body" size="medium">
            Note: Stripe Webhooks will be created automatically.
          </Text>
        </>
      }
    >
      <StripeConfigurationForm configurationId={router.query.configurationId} />
    </AppLayout>
  );
};

export default withAuthorization()(EditConfigurationPage);
