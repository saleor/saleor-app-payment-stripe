import { type PageConfig } from "next";
import { badRequest, methodNotAllowed, ok } from "../../lib/api-response";
import { parseJsonRequest } from "../../lib/api-route-utils";
import { type JSONValue } from "../../types";
import TestSchema from "@/schemas/Test/Test.mjs";

export const config: PageConfig = {
  runtime: "edge",
};

const testHandler = async (req: Request) => {
  if (req.method !== "POST") {
    return methodNotAllowed([`POST`]);
  }
  const [err, body] = await parseJsonRequest(req, TestSchema);
  if (err) {
    return badRequest(`Invalid request body`);
  }

  if (!body.date) {
    return badRequest(`Missing date in body`);
  }

  const result = await fetch("https://demo.saleor.io/graphql/", {
    body: JSON.stringify({
      date: body.date,
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
    date: body.date,
  });
};

export default testHandler;
