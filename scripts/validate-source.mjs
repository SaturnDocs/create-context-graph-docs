import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateBundleSemanticsAsync,
  validateBundleStructure,
} from "../../saturndocs/packages/source-abi/dist/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "site");
const paths = await sourcePaths(site);
const files = new Map();
for (const sourcePath of paths) files.set(sourcePath, await readFile(path.join(site, sourcePath)));

const violations = [
  ...validateBundleStructure(paths.map((sourcePath) => ({ path: sourcePath, size: files.get(sourcePath).byteLength }))),
  ...(await validateBundleSemanticsAsync({
    docsJson: files.get("docs.json"),
    modelsToml: files.get("models.toml"),
    pagePaths: paths.filter((sourcePath) => sourcePath.startsWith("pages/")),
    readFile: async (sourcePath) => files.get(sourcePath) ?? null,
  })),
];
const errors = violations.filter((violation) => violation.severity === "error");
for (const violation of violations) {
  const output = `${violation.severity}: ${violation.path ?? "bundle"}: ${violation.code}: ${violation.message}`;
  (violation.severity === "error" ? console.error : console.warn)(output);
}
if (errors.length > 0) process.exitCode = 1;
else console.log(`SaturnDocs source validation passed for ${paths.length} files.`);

async function sourcePaths(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const paths = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const sourcePath = relative ? `${relative}/${entry.name}` : entry.name;
    const stats = await lstat(path.join(directory, sourcePath));
    if (stats.isSymbolicLink()) throw new Error(`${sourcePath}: symbolic links are not admissible`);
    if (stats.isDirectory()) paths.push(...(await sourcePaths(directory, sourcePath)));
    else if (stats.isFile()) paths.push(sourcePath);
  }
  return paths;
}
