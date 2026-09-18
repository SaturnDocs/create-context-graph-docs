import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "sources", "upstream", "docs");
const sourcePages = path.join(sourceRoot, "docs");
const sourceAssets = path.join(sourceRoot, "static", "img");
const sitePages = path.join(root, "site", "pages");
const siteAssets = path.join(root, "site", "public", "img");

const upstreamCommit = (await readFile(path.join(root, "sources", "upstream-commit.txt"), "utf8")).trim();
const upstreamRepository = (await readFile(path.join(root, "sources", "upstream-repository.txt"), "utf8")).trim();

await rm(sitePages, { recursive: true, force: true });
await rm(siteAssets, { recursive: true, force: true });
await mkdir(sitePages, { recursive: true });
await mkdir(siteAssets, { recursive: true });

const sourcePagePaths = (await walk(sourcePages))
  .filter((entry) => entry.endsWith(".md"))
  .sort();
const pages = [];

for (const relative of sourcePagePaths) {
  const source = await readFile(path.join(sourcePages, relative), "utf8");
  const parsed = parseFrontmatter(source, relative);
  const route = routeFor(relative, parsed.slug);
  const outputPath = `${route}.mdx`;
  const generated = renderPage(parsed.title, transformBody(parsed.body));
  await write(outputPath, generated);
  pages.push({
    source: `docs/docs/${relative}`,
    output: `site/pages/${outputPath}`,
    route: `/${route}`,
    title: parsed.title,
    sourceSha256: sha256(source),
    generatedSha256: sha256(generated),
  });
}

const sourceAssetPaths = (await walk(sourceAssets)).sort();
const referencedAssets = referencedImagePaths(
  await Promise.all(sourcePagePaths.map((relative) => readFile(path.join(sourcePages, relative), "utf8"))),
);
referencedAssets.add("favicon.ico");
referencedAssets.add("logo.svg");

const assets = [];
for (const relative of sourceAssetPaths) {
  const bytes = await readFile(path.join(sourceAssets, relative));
  const published = referencedAssets.has(relative);
  if (published) await writeBinary(relative, bytes);
  assets.push({
    source: `docs/static/img/${relative}`,
    output: published ? `site/public/img/${relative}` : null,
    published,
    sha256: sha256(bytes),
    size: bytes.byteLength,
  });
}

const missingAssets = [...referencedAssets].filter(
  (relative) => !sourceAssetPaths.includes(relative),
);
if (missingAssets.length > 0) {
  throw new Error(`Referenced assets are missing from the upstream snapshot: ${missingAssets.join(", ")}`);
}

const manifest = {
  upstreamRepository,
  upstreamCommit,
  pageCount: pages.length,
  assetCount: assets.length,
  publishedAssetCount: assets.filter((asset) => asset.published).length,
  pages,
  assets,
};
await writeFile(
  path.join(root, "sources", "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `Imported ${pages.length} pages and ${manifest.publishedAssetCount} published assets ` +
    `from ${upstreamCommit}.`,
);

function parseFrontmatter(source, relative) {
  let frontmatter = "";
  let body = source;
  if (source.startsWith("---\n")) {
    const closing = source.indexOf("\n---\n", 4);
    if (closing === -1) throw new Error(`${relative}: frontmatter is not closed`);
    frontmatter = source.slice(4, closing);
    body = source.slice(closing + 5);
  }
  const rawTitle = /^title:\s*(.+)$/m.exec(frontmatter)?.[1];
  const headingTitle = /^#\s+(.+)$/m.exec(body)?.[1];
  const title = yamlScalar(rawTitle) ?? headingTitle;
  if (!title) throw new Error(`${relative}: no title or level-one heading`);
  const slug = yamlScalar(/^slug:\s*(.+)$/m.exec(frontmatter)?.[1]);
  return { title, slug, body };
}

function yamlScalar(value) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function routeFor(relative, slug) {
  const logical = relative.slice(0, -3);
  if (!slug) return `docs/${logical}`;
  if (slug.startsWith("/")) return `docs/${slug.slice(1)}`;
  const directory = path.posix.dirname(logical);
  return `docs/${directory === "." ? "" : `${directory}/`}${slug}`;
}

function renderPage(title, body) {
  return `---\ntitle: ${JSON.stringify(title)}\n---\n\n${body.trimEnd()}\n`;
}

function transformBody(body) {
  let transformed = body.replace(/<!--[\s\S]*?-->/g, "");
  transformed = transformDetails(transformed);
  transformed = transformAdmonitions(transformed);
  transformed = transformed.replace(/\]\(([^)\s]+)\.md(#[^)]+)?\)/g, "]($1$2)");
  return transformed;
}

function transformAdmonitions(source) {
  const component = {
    caution: "Warning",
    danger: "Danger",
    info: "Info",
    note: "Note",
    tip: "Tip",
    warning: "Warning",
  };
  const stack = [];
  const transformed = source
    .split("\n")
    .map((line) => {
      const opening = /^:::(caution|danger|info|note|tip|warning)(?:\s+(.+))?$/.exec(line);
      if (opening) {
        const name = component[opening[1]];
        stack.push(name);
        const title = opening[2] ? ` title="${escapeAttribute(opening[2])}"` : "";
        return `<${name}${title}>`;
      }
      if (line === ":::") {
        const name = stack.pop();
        if (!name) throw new Error("Found an unmatched Docusaurus admonition closing marker");
        return `</${name}>`;
      }
      return line;
    })
    .join("\n");
  if (stack.length > 0) throw new Error("Found an unclosed Docusaurus admonition");
  return transformed;
}

function transformDetails(source) {
  return source.replace(
    /<details>\s*\n<summary>(.*?)<\/summary>\s*\n([\s\S]*?)\n<\/details>/g,
    (_match, summary, contents) => {
      const title = summary.replace(/<\/?(?:strong|em)>/g, "").trim();
      return `<Accordion title="${escapeAttribute(title)}">\n${contents}\n</Accordion>`;
    },
  );
}

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function referencedImagePaths(sources) {
  const referenced = new Set();
  for (const source of sources) {
    const visible = source.replace(/<!--[\s\S]*?-->/g, "");
    for (const match of visible.matchAll(/!\[[^\]]*\]\(\/img\/([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      referenced.add(match[1]);
    }
    for (const match of visible.matchAll(/<img[^>]+src=["']\/img\/([^"']+)["'][^>]*>/g)) {
      referenced.add(match[1]);
    }
  }
  return referenced;
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

async function write(relative, contents) {
  const target = path.join(sitePages, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents, "utf8");
}

async function writeBinary(relative, contents) {
  const target = path.join(siteAssets, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
