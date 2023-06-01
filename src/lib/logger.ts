// We have to use process.env, otherwise pino doesn't work
/* eslint-disable node/no-process-env */
import pino from "pino";
import { isDevelopment, isTest } from "./isEnv";

/* c8 ignore start */
export const logger = pino({
  level: process.env.APP_DEBUG ?? "info",
  transport:
    process.env.CI || isDevelopment() || isTest()
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
