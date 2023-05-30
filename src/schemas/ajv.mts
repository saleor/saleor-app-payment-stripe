import Ajv, { Options } from "ajv";
import addAjvFormats from "ajv-formats";

export const getAjv = (options?: Options) => {
  const ajv = addAjvFormats(new Ajv(options));
  ajv.addKeyword("tsType");
  return ajv;
};
