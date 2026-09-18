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

for (const page of manifest.adaptedPages) {
  const source = await readFile(path.join(root, page.source));
  const generated = await readFile(path.join(root, page.output));
  if (sha256(source) !== page.sourceSha256) failures.push(`${page.source}: adapted source digest changed`);
  if (sha256(generated) !== page.generatedSha256) failures.push(`${page.output}: generated digest changed`);
  if (sha256(source) !== sha256(generated)) failures.push(`${page.output}: generated page differs from its reviewed adaptation`);
}

let adaptationSource = "";
for (const input of manifest.adaptationInputs) {
  const source = await readFile(path.join(root, "sources", "upstream", input.source));
  if (sha256(source) !== input.sha256) failures.push(`${input.source}: landing-page input digest changed`);
  adaptationSource += `\n${source}`;
}
const homepage = contentText(await readFile(path.join(root, "sources", "adapted", "index.mdx"), "utf8"));
const normalizedAdaptationSource = contentText(adaptationSource);
for (const assertion of manifest.homepageCopyAssertions) {
  if (!normalizedAdaptationSource.includes(assertion)) failures.push(`landing-page copy is not present upstream: ${assertion}`);
  if (!homepage.includes(assertion)) failures.push(`landing-page adaptation is missing upstream copy: ${assertion}`);
}

const adaptedHomepageSource = await readFile(path.join(root, "sources", "adapted", "index.mdx"), "utf8");
const generatedHomepageSource = await readFile(path.join(root, "site", "pages", "index.mdx"), "utf8");
for (const [label, source] of [
  ["reviewed landing-page adaptation", adaptedHomepageSource],
  ["generated landing page", generatedHomepageSource],
]) {
  if (!/^pageLayout: landing$/m.test(source)) {
    failures.push(`${label} does not declare the SaturnDocs landing-page layout`);
  }
  for (const asset of ["/img/app-three-panel.png", "/img/memory-architecture.png"]) {
    if (source.includes(asset)) failures.push(`${label} incorrectly reuses documentation asset ${asset} on the landing page`);
  }
  for (const component of ["AppPreview", "MemorySequence", "DomainCarousel", "FrameworkGrid", "LandingFooter"]) {
    if (!source.includes(`<${component}`)) failures.push(`${label} is missing ${component}`);
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

for (const asset of manifest.brandAssets) {
  const source = await readFile(path.join(root, asset.source));
  const published = await readFile(path.join(root, asset.output));
  if (sha256(source) !== asset.sha256) failures.push(`${asset.source}: brand asset digest changed`);
  if (sha256(published) !== asset.sha256) failures.push(`${asset.output}: published brand asset differs from source`);
}

const upstreamPages = (await walk(path.join(root, "sources", "upstream", "docs", "docs")))
  .filter((entry) => entry.endsWith(".md"));
const generatedPages = (await walk(path.join(root, "site", "pages")))
  .filter((entry) => entry.endsWith(".mdx"));
if (upstreamPages.length !== manifest.documentationPageCount) {
  failures.push(`found ${upstreamPages.length} upstream pages; manifest records ${manifest.documentationPageCount}`);
}
if (generatedPages.length !== manifest.pageCount) {
  failures.push(`found ${generatedPages.length} generated pages; manifest records ${manifest.pageCount}`);
}

const navigationGroups = "groups" in docsConfig.navigation
  ? docsConfig.navigation.groups
  : docsConfig.navigation.tabs.flatMap((tab) => tab.groups);
const navigationPages = flattenNavigation(navigationGroups);
const manifestRoutes = [
  ...manifest.pages.map((page) => page.route.slice(1)),
  ...manifest.adaptedPages.filter((page) => page.navigation).map((page) => page.navigationRoute ?? page.route.slice(1)),
].sort();
const navigationRoutes = [...navigationPages].sort();
if (JSON.stringify(manifestRoutes) !== JSON.stringify(navigationRoutes)) {
  const missing = manifestRoutes.filter((route) => !navigationPages.includes(route));
  const extra = navigationPages.filter((route) => !manifestRoutes.includes(route));
  failures.push(`navigation mismatch; missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}`);
}

const publishedAssets = [
  ...manifest.assets.filter((asset) => asset.published),
  ...manifest.brandAssets,
];
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
      "landing-page layout and copy provenance, and complete navigation coverage.",
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

function contentText(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&rarr;", "→")
    .replace(/\s+/g, " ");
}
