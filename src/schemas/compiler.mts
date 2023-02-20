import StandaloneCode from "ajv/dist/standalone";
import type { AnySchemaObject } from "ajv";
import { compile } from "json-schema-to-typescript";
import { getAjv } from "./ajv.mjs";
import { JSONValue } from "@/types.js";

type JSONSchema4 = Parameters<typeof compile>[0];

const getAjvForCodegen = () =>
  getAjv({
    code: {
      source: true,
      esm: true,
      optimize: true,
    },
  });

export async function compileSchemaToTypes(schemaName: string, schema: JSONValue) {
  const types = await compile(schema as JSONSchema4, schemaName, { unknownAny: true });
  const typesWithDefaultExport = [
    `import type { ValidateFunction } from "ajv";`,
    `import type { JSONObject } from '../../types';`,
    types,
    `declare const Validate${schemaName}: ValidateFunction<${schemaName}>;`,
    `export default Validate${schemaName};`,
  ].join("\n");
  return typesWithDefaultExport;
}

export async function compileSchemaToJs(_schemaName: string, schema: JSONValue) {
  const ajv = getAjvForCodegen();
  const validate = ajv.compile(schema as AnySchemaObject);
  const sourceCode = StandaloneCode(ajv, validate);
  return sourceCode;
}
