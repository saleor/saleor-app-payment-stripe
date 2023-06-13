import { describe, it, expect, vi } from "vitest";
import { type ValidateFunction } from "ajv";
import { type NextApiResponse, type NextApiRequest } from "next/types";
import { type NextWebhookApiHandler } from "@saleor/app-sdk/handlers/next";
import { getAuthDataForRequest, getSyncWebhookHandler, validateData } from "./api-route-utils";
import { testEnv } from "@/__tests__/test-env.mjs";
import { BaseError, MissingSaleorApiUrlError } from "@/errors";

describe("api-route-utils", () => {
  describe("validateData", () => {
    it("should return data if it validates", async () => {
      const data = { a: 1, b: "c" };
      await expect(
        validateData(data, (() => true) as unknown as ValidateFunction),
      ).resolves.toEqual(data);
    });

    it("should throw error if it doesn't validate", async () => {
      const data = { a: 1, b: "c" };
      await expect(
        validateData(data, (() => false) as unknown as ValidateFunction),
      ).rejects.toMatchInlineSnapshot("[UnknownError: JsonSchemaError]");
    });

    it("should throw error if it throws", async () => {
      const data = { a: 1, b: "c" };
      await expect(
        validateData(data, (() => {
          throw new Error("some error");
        }) as unknown as ValidateFunction),
      ).rejects.toMatchInlineSnapshot("[UnknownError: some error]");
    });
  });

  describe("getSyncWebhookHandler", () => {
    type WebhookContext = Parameters<NextWebhookApiHandler>[2];

    it(`should return a function`, () => {
      expect(
        getSyncWebhookHandler(
          "TestWebhook",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          (() => {}) as any,
          (() => true) as unknown as ValidateFunction,
          () => ({}),
        ),
      ).toEqual(expect.any(Function));
    });

    it(`calls handler with payload and saleorApiUrl from context`, async () => {
      const handler = vi.fn();
      const webhookHandler = getSyncWebhookHandler(
        "TestWebhook",
        handler,
        (() => true) as unknown as ValidateFunction,
        () => ({}),
      );

      type WebhookContext = Parameters<NextWebhookApiHandler>[2];

      const payload = {};
      const authData = {
        saleorApiUrl: testEnv.TEST_SALEOR_API_URL,
      };

      await webhookHandler(
        {} as NextApiRequest,
        { json() {} } as unknown as NextApiResponse,
        {
          authData,
          payload,
        } as unknown as WebhookContext,
      );

      expect(handler).toHaveBeenCalledWith(payload, authData.saleorApiUrl);
    });

    it(`returns json with result`, async () => {
      const handler = vi.fn().mockReturnValue({
        some: "json",
      });
      const json = vi.fn();
      const webhookHandler = getSyncWebhookHandler(
        "TestWebhook",
        handler,
        (() => true) as unknown as ValidateFunction,
        () => ({}),
      );

      const payload = {};
      const authData = {
        saleorApiUrl: testEnv.TEST_SALEOR_API_URL,
      };

      await webhookHandler(
        {} as NextApiRequest,
        { json } as unknown as NextApiResponse,
        {
          authData,
          payload,
        } as unknown as WebhookContext,
      );

      expect(json).toHaveBeenCalledWith({
        some: "json",
      });
    });

    it(`catches known errors and returns 200 with details`, async () => {
      const handler = vi.fn().mockImplementation(() => {
        throw new BaseError(`This is a known error`, {
          props: {
            errorCode: 123,
            statusCode: 422,
          },
          errors: [new Error(`Initial problem`)],
        });
      });
      const errorMapper = vi.fn();
      const json = vi.fn();
      const status = vi.fn().mockReturnValue({ json });
      const webhookHandler = getSyncWebhookHandler(
        "TestWebhook",
        handler,
        (() => true) as unknown as ValidateFunction,
        errorMapper,
      );

      type WebhookContext = Parameters<NextWebhookApiHandler>[2];

      const payload = {};
      const authData = {
        saleorApiUrl: testEnv.TEST_SALEOR_API_URL,
      };

      await webhookHandler(
        {} as NextApiRequest,
        { json, status } as unknown as NextApiResponse,
        {
          authData,
          payload,
        } as unknown as WebhookContext,
      );

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalled();
      expect(errorMapper.mock.lastCall[1]).toMatchInlineSnapshot(`
        {
          "errors": [
            {
              "code": "BaseError",
              "details": {},
              "message": "This is a known error",
            },
            {
              "code": "Error",
              "message": "Initial problem",
            },
          ],
          "message": "This is a known error",
          "sentry": [
            [BaseError: This is a known error],
            {
              "extra": {
                "errors": [
                  [Error: Initial problem],
                ],
              },
            },
          ],
        }
      `);
    });

    it(`catches known errors and responds with whatever the errorMapper returns`, async () => {
      const handler = vi.fn().mockImplementation(() => {
        throw new MissingSaleorApiUrlError(`Missing`);
      });
      const errorMapper = vi.fn().mockImplementation((payload, error) => {
        return {
          errors: error.errors,
          message: error.message,
        };
      });
      const json = vi.fn();
      const status = vi.fn().mockReturnValue({ json });
      const webhookHandler = getSyncWebhookHandler(
        "TestWebhook",
        handler,
        (() => true) as unknown as ValidateFunction,
        errorMapper,
      );

      type WebhookContext = Parameters<NextWebhookApiHandler>[2];

      const payload = {};
      const authData = {
        saleorApiUrl: testEnv.TEST_SALEOR_API_URL,
      };

      await webhookHandler(
        {} as NextApiRequest,
        { json, status } as unknown as NextApiResponse,
        {
          authData,
          payload,
        } as unknown as WebhookContext,
      );

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalled();
      expect(json.mock.lastCall[0]).toMatchInlineSnapshot(`
        {
          "errors": [
            {
              "code": "MissingSaleorApiUrlError",
              "details": {},
              "message": "Missing",
            },
          ],
          "message": "Missing",
        }
      `);
    });

    it(`catches unknown errors and returns 500`, async () => {
      const handler = vi.fn().mockImplementation(() => {
        throw new Error(`Some error`);
      });
      const json = vi.fn();
      const status = vi.fn().mockReturnValue({ json });
      const webhookHandler = getSyncWebhookHandler(
        "TestWebhook",
        handler,
        (() => true) as unknown as ValidateFunction,
        () => ({}),
      );

      type WebhookContext = Parameters<NextWebhookApiHandler>[2];

      const payload = {};
      const authData = {
        saleorApiUrl: testEnv.TEST_SALEOR_API_URL,
      };

      await webhookHandler(
        {} as NextApiRequest,
        { json, status } as unknown as NextApiResponse,
        {
          authData,
          payload,
        } as unknown as WebhookContext,
      );

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalled();
      expect(BaseError.normalize(json.mock.lastCall[0])).toMatchInlineSnapshot(
        "[BaseError: Some error]",
      );
    });
  });

  describe("getAuthDataForRequest", () => {
    it(`should throw if there's no saleroApiUrl in the query`, async () => {
      await expect(
        getAuthDataForRequest({ query: {} } as NextApiRequest),
      ).rejects.toMatchInlineSnapshot(
        "[MissingSaleorApiUrlError: Missing saleorApiUrl query param]",
      );
    });

    it(`should throw if data doesn't exist in APL`, async () => {
      await expect(
        getAuthDataForRequest({ query: { saleorApiUrl: "someurl" } } as unknown as NextApiRequest),
      ).rejects.toMatchInlineSnapshot("[MissingAuthDataError: APL for someurl not found]");
    });

    it(`should return data from apl if it exists`, async () => {
      await expect(
        getAuthDataForRequest({
          query: { saleorApiUrl: testEnv.TEST_SALEOR_API_URL },
        } as unknown as NextApiRequest),
      ).resolves.toMatchInlineSnapshot(`
        {
          "appId": "QXBwOjQyMw==",
          "domain": "saleor.localhost",
          "jwks": "",
          "saleorApiUrl": "https://saleor.localhost:8080/graphql/",
          "token": "UztpGrbmghOWwc3HVCnAGVByqLyESP",
        }
      `);
    });
  });
});
