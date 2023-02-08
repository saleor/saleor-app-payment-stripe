import { PageConfig } from "next";
import * as Yup from "yup";
import { badRequest, methodNotAllowed, ok } from "../../lib/api-response";
import { parseJsonRequest } from "../../lib/api-route-utils";
import { JSONValue } from "../../types";

export const config: PageConfig = {
  runtime: "experimental-edge",
};

const schema = Yup.object({
  date: Yup.date().required(),
}).required();

const testHandler = async (req: Request) => {
  if (req.method !== "POST") {
    return methodNotAllowed([`POST`]);
  }
  const [err, body] = await parseJsonRequest(req, schema);
  if (err) {
    return badRequest(`Invalid request body`);
  }

  if (!body.date) {
    return badRequest(`Missing date in body`);
  }

  const result = await fetch("https://demo.saleor.io/graphql/", {
    body: JSON.stringify({
      date: body.date.toISOString(),
      query: `
    {
      products(first: 5, channel: \"default-channel\") {
        edges {
          node {
            id
            name
            description
          }
        }
      }
    }
      `.trim(),
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const products = (await result.json()) as JSONValue;

  return ok({
    products,
    date: body.date.toISOString(),
  });
};

export default testHandler;
