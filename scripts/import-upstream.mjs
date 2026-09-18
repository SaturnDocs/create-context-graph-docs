import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "sources", "upstream", "docs");
const sourcePages = path.join(sourceRoot, "docs");
const sourceAssets = path.join(sourceRoot, "static", "img");
const adaptedRoot = path.join(root, "sources", "adapted");
const brandRoot = path.join(root, "brand");
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

const adaptedPageDefinitions = [
  { source: "index.mdx", output: "index.mdx", route: "/", navigationRoute: "index", title: "AI agents with graph memory, scaffolded in seconds.", navigation: true },
];
const adaptedPages = [];
for (const definition of adaptedPageDefinitions) {
  const source = await readFile(path.join(adaptedRoot, definition.source), "utf8");
  await write(definition.output, source);
  adaptedPages.push({
    source: `sources/adapted/${definition.source}`,
    output: `site/pages/${definition.output}`,
    route: definition.route,
    navigationRoute: definition.navigationRoute ?? null,
    title: definition.title,
    navigation: definition.navigation,
    sourceSha256: sha256(source),
    generatedSha256: sha256(source),
  });
}

const adaptationInputPaths = [
  "docusaurus.config.ts",
  "src/data/animation-config.ts",
  "src/pages/index.tsx",
  "src/pages/404.tsx",
  "src/components/animations/AppPreview.tsx",
  "src/components/animations/ContextGraphExplainer.tsx",
  "src/components/animations/DomainCarousel.tsx",
  "src/components/animations/FrameworkGrid.tsx",
  "src/components/animations/HowItWorks.tsx",
  "src/components/animations/TerminalAnimation.tsx",
  "src/components/animations/TrustBar.tsx",
];
const adaptationInputs = [];
let adaptationSource = "";
for (const relative of adaptationInputPaths) {
  const source = await readFile(path.join(sourceRoot, relative), "utf8");
  adaptationSource += `\n${source}`;
  adaptationInputs.push({
    source: `docs/${relative}`,
    sha256: sha256(source),
  });
}

const homepageCopyAssertions = [
  "create-context-graph v0.9.5",
  "AI agents with graph memory, scaffolded in seconds.",
  "Pick your domain. Pick your framework. Get a full-stack app with streaming chat, graph visualization, and decision tracing.",
  "v0.6.0",
  "Demo data (recommended)",
  "Scaffolding backend...",
  "Healthcare Context Graph is ready!",
  "Show me patients with diabetes who were treated in the last 30 days",
  "I found 12 patients with diabetes type 2 who received treatment in the last 30 days.",
  "Identify patients with diabetes condition",
  "Filter treatments within 30-day window",
  "Aggregate by treatment type and provider",
  "Three memory types. One connected graph.",
  "Conversation history stored as graph nodes. Every message, every turn, connected and queryable.",
  "Entity knowledge graph built from conversations. People, organizations, locations, and events — all connected.",
  "Every tool call and decision traced and auditable. Know not just what the agent said, but why.",
  "Three memory types, one connected graph. This is what makes agents remember, reason, and explain.",
  "23 domains. Your industry, ready to go.",
  "Each domain includes a complete ontology, demo data, agent tools, and graph schema",
  "Drag to explore",
  "Healthcare",
  "Financial Services",
  "Software Engineering",
  "Retail & E-Commerce",
  "Scientific Research",
  "Agent Memory",
  "GenAI & LLM Ops",
  "Personal Knowledge",
  "Product Management",
  "Wildlife Management",
  "Bring your favorite agent framework.",
  "PydanticAI, Claude Agent SDK, LangGraph, OpenAI Agents, and more",
  "PydanticAI",
  "Claude Agent SDK",
  "OpenAI Agents SDK",
  "Anthropic Tools",
  "CrewAI",
  "Strands",
  "Google ADK",
  "Full Streaming",
  "Tool Events",
  "From zero to running app in 4 commands.",
  "Scaffold, install, seed, and start",
  "uvx create-context-graph my-app --domain healthcare --framework pydanticai --demo-data",
  "cd my-app && make install",
  "make docker-up && make seed",
  "make start",
  "Passing Tests",
  "Ready to build your context graph?",
  "Neo4j Community Forum",
  "License (Apache 2.0)",
];
const homepage = contentText(await readFile(path.join(adaptedRoot, "index.mdx"), "utf8"));
const normalizedAdaptationSource = contentText(adaptationSource);
for (const assertion of homepageCopyAssertions) {
  if (!normalizedAdaptationSource.includes(assertion)) {
    throw new Error(`Landing-page copy is not present in the pinned upstream source: ${assertion}`);
  }
  if (!homepage.includes(assertion)) {
    throw new Error(`Landing-page adaptation is missing upstream copy: ${assertion}`);
  }
}

const sourceAssetPaths = (await walk(sourceAssets)).sort();
const referencedAssets = referencedImagePaths(
  await Promise.all(sourcePagePaths.map((relative) => readFile(path.join(sourcePages, relative), "utf8"))),
);

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

const brandAssets = [];
for (const relative of (await walk(brandRoot)).sort()) {
  const bytes = await readFile(path.join(brandRoot, relative));
  await writeBinary(relative, bytes);
  brandAssets.push({
    source: `brand/${relative}`,
    output: `site/public/img/${relative}`,
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
  pageCount: pages.length + adaptedPages.length,
  documentationPageCount: pages.length,
  adaptedPageCount: adaptedPages.length,
  assetCount: assets.length,
  publishedAssetCount: assets.filter((asset) => asset.published).length + brandAssets.length,
  pages,
  adaptedPages,
  adaptationInputs,
  homepageCopyAssertions,
  assets,
  brandAssets,
};
await writeFile(
  path.join(root, "sources", "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `Imported ${pages.length} documentation pages, ${adaptedPages.length} site ` +
    `page${adaptedPages.length === 1 ? "" : "s"}, and ` +
    `${manifest.publishedAssetCount} published assets ` +
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

function contentText(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&rarr;", "→")
    .replace(/\s+/g, " ");
}
