import { useAppBridge, withAuthorization } from "@saleor/app-sdk/app-bridge";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Text } from "@saleor/macaw-ui/next";
import { type NextPage } from "next";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { checkTokenPermissions } from "../modules/jwt/check-token-offline";
import {
  type PaymentAppFormConfigEntry,
  paymentAppCombinedFormSchema,
  paymentAppConfigEntrySchema,
} from "../modules/payment-app-configuration/config-entry";
import { FetchError, useFetch, usePost } from "../lib/use-fetch";
import { AppLayout } from "@/modules/ui/templates/AppLayout";
import { FormInput } from "@/modules/ui/atoms/macaw-ui/FormInput";

const actionId = "payment-form";

const ConfigPage: NextPage = () => {
  const { appBridgeState, appBridge } = useAppBridge();
  const { token } = appBridgeState ?? {};

  const hasPermissions = checkTokenPermissions(token, ["MANAGE_APPS", "MANAGE_SETTINGS"]);

  const [isLoading, setIsLoading] = useState(true);

  const formMethods = useForm<PaymentAppFormConfigEntry>({
    resolver: zodResolver(paymentAppCombinedFormSchema),
    defaultValues: {
      secretKey: "",
      configurationName: "",
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    setError,
    formState: { isSubmitting },
    resetField,
  } = formMethods;

  useFetch("/api/config", {
    schema: paymentAppConfigEntrySchema,
    onFinished: () => setIsLoading(false),
    onSuccess: (data) => {
      reset(data);
    },
    onError: async (err) => {
      const message = err instanceof FetchError ? err.body : err.message;
      await appBridge?.dispatch({
        type: "notification",
        payload: {
          title: "Form error",
          text: "Error while fetching initial form data",
          status: "error",
          actionId,
          apiMessage: message,
        },
      });
    },
  });

  const postForm = usePost("/api/config", {
    schema: z.unknown(),
    onSuccess: async () => {
      await appBridge?.dispatch({
        type: "notification",
        payload: {
          title: "Form saved",
          text: "App configuration was saved successfully",
          status: "success",
          actionId: "payment-form",
        },
      });
    },
    onError: async (err) => {
      const apiMessage = err instanceof FetchError ? err.body : err.name;
      await appBridge?.dispatch({
        type: "notification",
        payload: {
          title: "Form error",
          text: err.message,
          status: "error",
          actionId,
          apiMessage,
        },
      });
      setError("root", { message: err.message });
    },
  });

  if (!hasPermissions) {
    return (
      <AppLayout title="">
        <Text variant="hero">{"You don't have permissions to configure this app"}</Text>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="">
      <Box display="flex" flexDirection="column" gap={8}>
        <FormProvider {...formMethods}>
          <form
            method="POST"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSubmit={handleSubmit((data) => postForm(data))}
          >
            <Text variant="heading">Payment Provider settings</Text>

            <Box display="flex" gap={6} alignItems="flex-end">
              <FormInput control={control} label="API_KEY" name="secretKey" disabled={isLoading} />
              <Button
                variant="secondary"
                size="small"
                type="button"
                onClick={() => resetField("secretKey")}
              >
                Reset
              </Button>
            </Box>

            <div>
              <Button type="submit" disabled={isLoading || isSubmitting}>
                {isLoading ? "Loading" : isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </Box>
    </AppLayout>
  );
};

export default withAuthorization()(ConfigPage);
