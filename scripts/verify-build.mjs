import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const build = path.join(root, "build");
const manifest = JSON.parse(await readFile(path.join(root, "sources", "manifest.json"), "utf8"));
const failures = [];
const allPages = [...manifest.pages, ...manifest.adaptedPages];

for (const page of allPages) {
  const relative = page.route.slice(1);
  const htmlPath = relative ? path.join(build, relative, "index.html") : path.join(build, "index.html");
  const twinPath = path.join(build, relative ? `${relative}.md` : "index.md");
  const [html, twin] = await Promise.all([
    readFile(htmlPath, "utf8").catch(() => null),
    readFile(twinPath, "utf8").catch(() => null),
  ]);
  if (html === null) failures.push(`${relative}: rendered HyperText Markup Language page is missing`);
  if (twin === null) failures.push(`${relative}: Markdown twin is missing`);
  if (html !== null && !html.includes(escapeHtml(page.title))) {
    failures.push(`${relative}: rendered page does not contain its source title`);
  }
}

for (const asset of [...manifest.assets.filter((entry) => entry.published), ...manifest.brandAssets]) {
  const built = await readFile(path.join(build, "img", path.basename(asset.output))).catch(() => null);
  if (built === null) failures.push(`${asset.output}: built asset is missing`);
  else if (sha256(built) !== asset.sha256) failures.push(`${asset.output}: built asset digest differs`);
}

const sitemap = await readFile(path.join(build, "sitemap-0.xml"), "utf8");
for (const page of allPages) {
  const expected = page.route === "/"
    ? "https://create-context-graph.saturndocs.net/"
    : `https://create-context-graph.saturndocs.net${page.route}/`;
  if (!sitemap.includes(`<loc>${expected}</loc>`)) failures.push(`${page.route}: missing from sitemap`);
}

if (failures.length > 0) {
  console.error(`Build verification failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Verified ${manifest.pageCount} rendered pages, ${manifest.pageCount} Markdown twins, ` +
      `${manifest.publishedAssetCount} byte-identical built assets, branded site routes, and complete sitemap coverage.`,
  );
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
