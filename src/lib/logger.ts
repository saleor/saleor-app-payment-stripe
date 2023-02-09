import pino from "pino";

const availableLevels = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;
const level = availableLevels.includes(process.env.APP_DEBUG) ? process.env.APP_DEBUG : "error";

export const logger = pino({
  level,
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
});

export const createLogger = logger.child.bind(logger);
