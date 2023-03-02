import {
  createProtectedHandler,
  type ProtectedHandlerContext,
} from "@saleor/app-sdk/handlers/next";
import { type NextApiRequest, type NextApiResponse } from "next";
import { HttpStatus } from "../../lib/api-response";
import { parseRawBodyToJson, unpackPromise } from "../../lib/api-route-utils";
import { createClient } from "../../lib/create-graphq-client";
import { createSettingsManager } from "../../modules/app-configuration/metadata-manager";
import {
  type PaymentProviderConfig,
  paymentProviderSchema,
} from "../../modules/payment-configuration/payment-config";
import { PaymentProviderConfiguratior } from "../../modules/payment-configuration/payment-configuration";
import { saleorApp } from "../../saleor-app";

type GetPaymentProviderConfigResponse = PaymentProviderConfig;

type PostPaymentProviderConfigResponse = {
  ok: true;
};

interface ErrorPaymentProviderConfigResponse {
  ok: false;
  message: string;
}

type OkPaymentProviderConfigResponse =
  | GetPaymentProviderConfigResponse
  | PostPaymentProviderConfigResponse;

export const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<OkPaymentProviderConfigResponse | ErrorPaymentProviderConfigResponse>,
  ctx: ProtectedHandlerContext,
) => {
  if (req.method === "POST") {
    await handlePostRequest(req, res, ctx);
    return;
  }

  if (req.method === "GET") {
    await handleGetRequest(req, res, ctx);
    return;
  }

  res.setHeader("allow", "GET, POST");
  return res.status(HttpStatus.MethodNotAllowed).json({
    ok: false,
    message: `Method ${req.method ?? ""} Not Allowed`,
  });
};

export default createProtectedHandler(handler, saleorApp.apl, ["MANAGE_SETTINGS", "MANAGE_APPS"]);

async function handleGetRequest(
  _req: NextApiRequest,
  res: NextApiResponse<GetPaymentProviderConfigResponse | ErrorPaymentProviderConfigResponse>,
  ctx: ProtectedHandlerContext,
) {
  const client = createClient(ctx.authData.saleorApiUrl, async () => ({
    token: ctx.authData.token,
  }));

  const configurator = new PaymentProviderConfiguratior(
    createSettingsManager(client),
    ctx.authData.saleorApiUrl,
  );

  const [err, obfuscatedConfig] = await unpackPromise(configurator.getConfigObfuscated());

  if (err) {
    return res.status(HttpStatus.InternalServerError).json({
      ok: false,
      message: "Error while fetching config",
    });
  }

  if (obfuscatedConfig) {
    return res.status(HttpStatus.OK).json(obfuscatedConfig);
  }

  return res.status(HttpStatus.OK).json({ fakeApiKey: "" });
}

async function handlePostRequest(
  req: NextApiRequest,
  res: NextApiResponse<PostPaymentProviderConfigResponse | ErrorPaymentProviderConfigResponse>,
  ctx: ProtectedHandlerContext,
) {
  const [err, json] = await parseRawBodyToJson(req, paymentProviderSchema);

  if (err) {
    return res.status(HttpStatus.BadRequest).json({
      ok: false,
      message: err.message,
    });
  }

  if (!json) {
    return res.status(HttpStatus.BadRequest).json({
      ok: false,
      message: "No input provided",
    });
  }

  const client = createClient(ctx.authData.saleorApiUrl, async () =>
    Promise.resolve({ token: ctx.authData.token }),
  );

  const configurator = new PaymentProviderConfiguratior(
    createSettingsManager(client),
    ctx.authData.saleorApiUrl,
  );

  await configurator.setConfig(json);

  return res.status(HttpStatus.OK).json({
    ok: true,
  });
}
