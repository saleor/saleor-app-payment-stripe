export type JSONValue = string | number | boolean | JSONObject | JSONArray;

interface JSONObject {
  readonly [x: string]: JSONValue;
}

interface JSONArray extends ReadonlyArray<JSONValue> {}
