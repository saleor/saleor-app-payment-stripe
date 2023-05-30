// @ts-check
/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * Environment variables validation from t3-oss/create-t3-app
 * https://github.com/t3-oss/create-t3-app/blob/next/cli/template/base/src/env.mjs
 * Copyright (c) 2022 Shoubhit Dash
 * Licensed under MIT License
 * */
import { z } from "zod";

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
const server = z.object({
  SECRET_KEY: z.string().min(8, { message: "Cannot be too short" }),
  SENTRY_DSN: z.string().min(1).optional(),
  APL: z.enum(["saleor-cloud", "upstash", "file"]).optional().default("file"),
  CI: z.coerce.boolean().optional().default(false),
  APP_DEBUG: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .optional()
    .default("error"),
  VERCEL_URL: z.string().optional(),
  PORT: z.coerce.number().optional(),
  UPSTASH_URL: z.string().optional(),
  UPSTASH_TOKEN: z.string().optional(),
  REST_APL_ENDPOINT: z.string().optional(),
  REST_APL_TOKEN: z.string().optional(),
});

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
const client = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXT_PUBLIC_SENTRY_DSN: z.optional(z.string().min(1)),
});

const clientKeys = new Set(Object.keys(client.shape));
/** @param {string} key */
const isClientKey = (key) => clientKeys.has(key);

/**
 * You can't destruct `process.env` as a regular object in the Next.js
 * edge runtimes (e.g. middlewares) or client-side so we need to destruct manually.
 * @type {Record<keyof z.infer<typeof server> | keyof z.infer<typeof client>, string | undefined>}
 */
const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,

  SECRET_KEY: process.env.SECRET_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  APL: process.env.APL,
  CI: process.env.CI,
  APP_DEBUG: process.env.APP_DEBUG,
  VERCEL_URL: process.env.VERCEL_URL,
  PORT: process.env.PORT,
  UPSTASH_URL: process.env.UPSTASH_URL,
  UPSTASH_TOKEN: process.env.UPSTASH_TOKEN,
  REST_APL_ENDPOINT: process.env.REST_APL_ENDPOINT,
  REST_APL_TOKEN: process.env.REST_APL_TOKEN,
};

/* c8 ignore start */
// Don't touch the part below
// --------------------------

const merged = server.merge(client);
/** @type z.infer<merged>
 *  @ts-ignore - can't type this properly in jsdoc */
// eslint-disable-next-line import/no-mutable-exports
let env = process.env;

if (!!process.env.SKIP_ENV_VALIDATION == false) {
  const isServer = typeof window === "undefined" || process.env.NODE_ENV === "test";

  const parsed = isServer
    ? merged.safeParse(processEnv) // on server we can validate all env vars
    : client.safeParse(processEnv); // on client we can only validate the ones that are exposed

  if (parsed.success === false) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  /** @type z.infer<merged>
   *  @ts-ignore - can't type this properly in jsdoc */
  env = new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      // Throw a descriptive error if a server-side env var is accessed on the client
      // Otherwise it would just be returning `undefined` and be annoying to debug
      if (!isServer && !isClientKey(prop))
        throw new Error(
          process.env.NODE_ENV === "production"
            ? "❌ Attempted to access a server-side environment variable on the client"
            : `❌ Attempted to access server-side environment variable '${prop}' on the client`,
        );
      /*  @ts-ignore - can't type this properly in jsdoc */
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return target[prop];
    },
  });
}

export { env };
