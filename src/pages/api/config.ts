import {
  createProtectedHandler,
  type ProtectedHandlerContext,
} from "@saleor/app-sdk/handlers/next";
import { type NextApiRequest, type NextApiResponse } from "next";
import { HttpStatus } from "../../lib/api-response";
import { createClient } from "../../lib/create-graphq-client";
import {
  type PaymentAppConfig,
  paymentAppCombinedSchema,
} from "../../modules/payment-app-configuration/payment-app-config";
import { saleorApp } from "../../saleor-app";
import { unpackPromise } from "@/lib/utils";
import { parseRawBodyToJson } from "@/backend-lib/api-route-utils";
import { getPaymentAppConfigurator } from "@/modules/payment-app-configuration/payment-app-configuration-factory";

type GetPaymentAppConfigResponse = PaymentAppConfig;

type PostPaymentAppConfigResponse = {
  ok: true;
};

interface ErrorPaymentAppConfigResponse {
  ok: false;
  message: string;
}

type OkPaymentAppConfigResponse = GetPaymentAppConfigResponse | PostPaymentAppConfigResponse;

export const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<OkPaymentAppConfigResponse | ErrorPaymentAppConfigResponse>,
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
  res: NextApiResponse<GetPaymentAppConfigResponse | ErrorPaymentAppConfigResponse>,
  ctx: ProtectedHandlerContext,
) {
  const client = createClient(ctx.authData.saleorApiUrl, async () => ({
    token: ctx.authData.token,
  }));

  const configurator = getPaymentAppConfigurator(client, ctx.authData.saleorApiUrl);

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

  return res.status(HttpStatus.OK).json({ apiKey: "" });
}

async function handlePostRequest(
  req: NextApiRequest,
  res: NextApiResponse<PostPaymentAppConfigResponse | ErrorPaymentAppConfigResponse>,
  ctx: ProtectedHandlerContext,
) {
  const [err, json] = await parseRawBodyToJson(req, paymentAppCombinedSchema);

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

  const configurator = getPaymentAppConfigurator(client, ctx.authData.saleorApiUrl);

  await configurator.setConfig(json);

  return res.status(HttpStatus.OK).json({
    ok: true,
  });
}
