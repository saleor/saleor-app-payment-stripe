import StandaloneCode from "ajv/dist/standalone";
import type { AnySchemaObject } from "ajv";
import { compile } from "json-schema-to-typescript";
import { getAjv } from "./ajv.mjs";
import { JSONValue } from "@/types.js";
import definitions from "./definitions.json" assert { type: "json" };

type JSONSchema4 = Parameters<typeof compile>[0];

const getAjvForCodegen = () => {
  const ajv = getAjv({
    code: {
      source: true,
      esm: true,
      optimize: true,
    },
  });
  ajv.addSchema(definitions);
  return ajv;
};

export async function compileSchemaToTypes(schemaName: string, schema: JSONValue) {
  const types = await compile(schema as JSONSchema4, schemaName, { unknownAny: true, cwd: 'src/schemas' });
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
  return `/* c8 ignore start */\n` + sourceCode;
}
