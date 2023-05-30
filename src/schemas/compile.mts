import Fs from "node:fs/promises";
import Path from "node:path";
import { compileSchemaToJs, compileSchemaToTypes } from "./compiler.mjs";
import type { JSONValue } from "@/types.js";

const __filename = new URL("", import.meta.url).pathname;
const __dirname = new URL(".", import.meta.url).pathname;

async function run() {
  const allSchemas = (await listdir(__dirname)).filter((path) => path.endsWith(`.schema.json`));

  await Promise.all(
    allSchemas.map(async (filepath) => {
      const schema = await readJson(filepath);

      const filename = Path.basename(filepath);
      const schemaName = filename.replace(/\.schema\.json$/, "");
      const dirname = Path.dirname(filepath);

      const jsCode = await compileSchemaToJs(schemaName, schema);
      const jsFilename = schemaName + ".mjs";
      await Fs.writeFile(Path.join(dirname, jsFilename), jsCode, "utf-8");

      const typescriptCode = await compileSchemaToTypes(schemaName, schema);
      const tsFilename = schemaName + ".d.mts";
      await Fs.writeFile(Path.join(dirname, tsFilename), typescriptCode, "utf-8");
    }),
  );
}

async function readJson(filepath: string): Promise<JSONValue> {
  const file = await Fs.readFile(filepath, "utf-8");
  return JSON.parse(file) as JSONValue;
}

async function listdir(dir: string): Promise<readonly string[]> {
  const dirs = await Fs.readdir(dir, { withFileTypes: true });
  const nestedDirs = await Promise.all(
    dirs.map((d) => {
      const path = Path.join(dir, d.name);
      if (d.isDirectory()) {
        return listdir(path);
      }
      if (d.isFile()) {
        return path;
      }
    }),
  );
  return nestedDirs.flat().filter((el): el is Exclude<typeof el, undefined> => el !== undefined);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
