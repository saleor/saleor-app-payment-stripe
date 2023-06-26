import * as trpcNext from "@trpc/server/adapters/next";
import * as Sentry from "@sentry/nextjs";
import { appRouter } from "../../../modules/trpc/trpc-app-router";
import { createTrpcContext } from "../../../modules/trpc/trpc-context";
import { logger, redactError } from "@/lib/logger";
import { BaseTrpcError, FieldError } from "@/errors";
import { isDevelopment } from "@/lib/isEnv";

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: createTrpcContext,
  onError: ({ path, error, type, ctx, input }) => {
    const cause = error?.cause;
    if (cause instanceof BaseTrpcError || cause instanceof FieldError) {
      // don't log expected errors
      return;
    }

    if (isDevelopment()) {
      // eslint-disable-next-line @saleor/saleor-app/logger-leak
      return logger.error({ input, path, error, type, ctx }, "TRPC failed");
    }
    logger.error({ path, error: redactError(error), type }, "TRPC failed");
    Sentry.captureException(error);
  },
});
