import "../styles/global.css";
import "@saleor/macaw-ui/next/style";

import { AppBridgeProvider, useAppBridge } from "@saleor/app-sdk/app-bridge";
import { RoutePropagator } from "@saleor/app-sdk/app-bridge/next";
import { ThemeProvider } from "@saleor/macaw-ui/next";
import { type AppProps } from "next/app";

import { Provider } from "urql";
import { type ReactNode } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"; // note: it's imported only in dev mode
import { ThemeSynchronizer } from "../modules/ui/theme-synchronizer";
import { NoSSRWrapper } from "../modules/ui/no-ssr-wrapper";

import { appBridgeInstance } from "@/app-bridge-instance";
import { ErrorModal } from "@/modules/ui/organisms/GlobalErrorModal/modal";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { createClient } from "@/lib/create-graphq-client";

const UrqlProvider = ({ children }: { children: ReactNode }) => {
  const { appBridgeState } = useAppBridge();
  if (!appBridgeState?.saleorApiUrl) {
    return <>{children}</>;
  }

  const client = createClient(appBridgeState?.saleorApiUrl, async () =>
    appBridgeState?.token ? { token: appBridgeState.token } : null,
  );
  return <Provider value={client}>{children}</Provider>;
};

function NextApp({ Component, pageProps }: AppProps) {
  return (
    <NoSSRWrapper>
      <AppBridgeProvider appBridgeInstance={appBridgeInstance}>
        <UrqlProvider>
          <ThemeProvider>
            <ThemeSynchronizer />
            <RoutePropagator />
            <Component {...pageProps} />
            <ErrorModal />
            <ReactQueryDevtools position="top-right" />
          </ThemeProvider>
        </UrqlProvider>
      </AppBridgeProvider>
    </NoSSRWrapper>
  );
}

export default trpcClient.withTRPC(NextApp);
