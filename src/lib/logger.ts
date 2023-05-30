// We have to use process.env, otherwise pino doesn't work
/* eslint-disable node/no-process-env */
import pino from "pino";

/* c8 ignore start */
export const logger = pino({
  level: process.env.APP_DEBUG ?? "info",
  transport:
    process.env.NODE_ENV === "development" || process.env.CI || process.env.NODE_ENV === "test"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
});
/* c8 ignore stop */

export const createLogger = logger.child.bind(logger);
