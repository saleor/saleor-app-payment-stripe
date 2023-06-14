import { withAuthorization } from "@saleor/app-sdk/app-bridge";
import { AppLayout } from "@/modules/ui/templates/AppLayout";

function ListConfigurationPage() {
  return <AppLayout title="Stripe">TODO</AppLayout>;
}

export default withAuthorization()(ListConfigurationPage);
