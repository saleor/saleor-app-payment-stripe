export type JSONValue = string | number | boolean | JSONObject | JSONArray | null;

interface JSONObject {
  readonly [x: string]: JSONValue;
}

interface JSONArray extends ReadonlyArray<JSONValue> {}
