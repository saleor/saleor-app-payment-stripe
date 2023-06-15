export type JSONValue = string | number | boolean | JSONObject | JSONArray | null;

export interface JSONObject {
  readonly [x: string]: JSONValue;
}

export interface JSONArray extends ReadonlyArray<JSONValue> {}

export type StrictRequired<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

export type Channel = {
  readonly id: string;
  readonly name: string;
};
