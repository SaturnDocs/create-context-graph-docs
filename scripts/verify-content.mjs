import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(root, "sources", "manifest.json"), "utf8"));
const docsConfig = JSON.parse(await readFile(path.join(root, "site", "docs.json"), "utf8"));
const failures = [];

const upstreamCommit = (await readFile(path.join(root, "sources", "upstream-commit.txt"), "utf8")).trim();
if (manifest.upstreamCommit !== upstreamCommit) {
  failures.push(`manifest commit ${manifest.upstreamCommit} does not match ${upstreamCommit}`);
}

for (const page of manifest.pages) {
  const source = await readFile(path.join(root, "sources", "upstream", page.source));
  const generated = await readFile(path.join(root, page.output));
  if (sha256(source) !== page.sourceSha256) failures.push(`${page.source}: source digest changed`);
  if (sha256(generated) !== page.generatedSha256) failures.push(`${page.output}: generated digest changed`);
  if (sourceTextPayload(source.toString("utf8")) !== generatedTextPayload(generated.toString("utf8"))) {
    failures.push(`${page.output}: rendered text payload differs from the upstream page`);
  }
}

for (const asset of manifest.assets) {
  const source = await readFile(path.join(root, "sources", "upstream", asset.source));
  if (sha256(source) !== asset.sha256) failures.push(`${asset.source}: source asset digest changed`);
  if (asset.published) {
    const published = await readFile(path.join(root, asset.output));
    if (sha256(published) !== asset.sha256) failures.push(`${asset.output}: published asset differs from source`);
  }
}

const upstreamPages = (await walk(path.join(root, "sources", "upstream", "docs", "docs")))
  .filter((entry) => entry.endsWith(".md"));
const generatedPages = (await walk(path.join(root, "site", "pages")))
  .filter((entry) => entry.endsWith(".mdx"));
if (upstreamPages.length !== manifest.pageCount) {
  failures.push(`found ${upstreamPages.length} upstream pages; manifest records ${manifest.pageCount}`);
}
if (generatedPages.length !== manifest.pageCount) {
  failures.push(`found ${generatedPages.length} generated pages; manifest records ${manifest.pageCount}`);
}

const navigationPages = flattenNavigation(docsConfig.navigation.groups);
const manifestRoutes = manifest.pages.map((page) => page.route.slice(1)).sort();
const navigationRoutes = [...navigationPages].sort();
if (JSON.stringify(manifestRoutes) !== JSON.stringify(navigationRoutes)) {
  const missing = manifestRoutes.filter((route) => !navigationPages.includes(route));
  const extra = navigationPages.filter((route) => !manifestRoutes.includes(route));
  failures.push(`navigation mismatch; missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}`);
}

const publishedAssets = manifest.assets.filter((asset) => asset.published);
if (publishedAssets.length !== manifest.publishedAssetCount) {
  failures.push("published asset count does not match manifest");
}

if (failures.length > 0) {
  console.error(`Content verification failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Verified ${manifest.pageCount} source pages, ${manifest.pageCount} generated pages, ` +
      `${manifest.assetCount} source assets, ${manifest.publishedAssetCount} published assets, ` +
      "and complete navigation coverage.",
  );
}

function flattenNavigation(groups) {
  const pages = [];
  const visit = (entries) => {
    for (const entry of entries) {
      if (typeof entry === "string") pages.push(entry);
      else if (entry.page) pages.push(entry.page);
      else if (entry.pages) visit(entry.pages);
    }
  };
  for (const group of groups) visit(group.pages);
  return pages;
}

async function walk(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await walk(directory, child)));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stripFrontmatter(source) {
  if (!source.startsWith("---\n")) return source;
  const closing = source.indexOf("\n---\n", 4);
  return closing === -1 ? source : source.slice(closing + 5);
}

function sourceTextPayload(source) {
  let body = stripFrontmatter(source).replace(/<!--[\s\S]*?-->/g, "");
  body = body
    .replace(/<\/?details>/g, "")
    .replace(/<summary>(.*?)<\/summary>/g, (_match, title) => title.replace(/<\/?(?:strong|em)>/g, ""));
  body = body
    .split("\n")
    .map((line) => {
      const opening = /^:::(?:caution|danger|info|note|tip|warning)(?:\s+(.+))?$/.exec(line);
      if (opening) return opening[1] ?? "";
      return line === ":::" ? "" : line;
    })
    .join("\n");
  return markdownTextPayload(body);
}

function generatedTextPayload(source) {
  let body = stripFrontmatter(source);
  body = body.replace(
    /<(?:Accordion|Danger|Info|Note|Tip|Warning)(?: title="([^"]*)")?>/g,
    (_match, title) => decodeAttribute(title ?? ""),
  );
  body = body.replace(/<\/(?:Accordion|Danger|Info|Note|Tip|Warning)>/g, "");
  return markdownTextPayload(body);
}

function markdownTextPayload(source) {
  return source
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeAttribute(value) {
  return value.replaceAll("&quot;", '"').replaceAll("&amp;", "&");
}
