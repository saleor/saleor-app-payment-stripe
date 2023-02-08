import { describe, expect, it } from "vitest";
import { HttpStatus } from "../../../lib/api-response";

import testHandler from "../../../pages/api/test-endpoint";
import { createRequestMock } from "../../apiTestsUtils";
import { omitPathsFromJson, setupRecording } from "../../polly";

describe("test endpoint", () => {
  setupRecording({
    matchRequestsBy: {
      // this field changes with every request so we omit it from calculating the hash of the request
      body: omitPathsFromJson(["date"]),
    },
  });

  it("should return method not allowed for GET requests", async () => {
    const req = createRequestMock("GET");
    const res = await testHandler(req);
    expect(res.status).toEqual(HttpStatus.MethodNotAllowed);
  });

  it("should return bad request for requests without date", async () => {
    const req = createRequestMock("POST", {});
    const res = await testHandler(req);
    expect(res.status).toEqual(HttpStatus.BadRequest);
  });

  it("should return products for POST request", async () => {
    const req = createRequestMock("POST", { date: new Date().toISOString() });
    const res = await testHandler(req);
    expect(res.status).toEqual(HttpStatus.OK);
    const response = await res.json();
    expect(response.products.data.products).toBeTruthy();
    console.log(response.date);
  });
});
