# Create Context Graph site

This public repository publishes the Create Context Graph site and documentation on
SaturnDocs at <https://create-context-graph.saturndocs.net>.

The documentation originates from the public
[`neo4j-labs/create-context-graph`](https://github.com/neo4j-labs/create-context-graph)
repository. The complete upstream `docs/` tree is preserved under
`sources/upstream/docs/`. The Apache License 2.0 from the upstream repository
is preserved as `LICENSE`.

## Repository layout

- `sources/upstream/` is the immutable source snapshot used for this import.
- `sources/adapted/` contains the reviewed static adaptation of the upstream
  React landing page.
- `brand/` contains the original three-node graph logo and favicon created for
  the SaturnDocs site.
- `site/` is the SaturnDocs source root connected to production.
- `scripts/import-upstream.mjs` performs the documented, mechanical format
  conversion required by the SaturnDocs source contract.
- `scripts/verify-content.mjs` verifies source digests, generated pages,
  navigation coverage, image references, and published asset equality.

The importer removes non-rendered HyperText Markup Language comments, converts
Docusaurus admonition and disclosure wrappers to equivalent SaturnDocs
components, removes `.md` from internal route links, and replaces unsupported
Docusaurus frontmatter with the page title. It does not rewrite documentation
prose or code examples.

The upstream site has three routes outside `/docs/`: the authored `/` landing
page, the Docusaurus-generated `/search` page, and the custom `/404` page. The
SaturnDocs source reproduces the complete landing-page copy at `/`. SaturnDocs
provides its own searchable reader interface and not-found page, so the two
framework surfaces are not imported as authored content. The header logo links
to the SaturnDocs home page instead of sending readers back to the Docusaurus
site.

## Verify the import

```sh
npm test
```

To rebuild the generated SaturnDocs pages from the preserved source snapshot:

```sh
npm run import
```

The SaturnDocs platform repository is required only for source-contract
validation and the production renderer build. From the SaturnDocs workspace,
run:

```sh
node repos/create-context-graph-docs/scripts/validate-source.mjs
SATURNDOCS_DOCS_DIR="$PWD/repos/create-context-graph-docs/site" \
SATURNDOCS_OUT_DIR="$PWD/repos/create-context-graph-docs/build" \
SATURNDOCS_WORKER_DIR="$PWD/repos/create-context-graph-docs/worker" \
pnpm --dir repos/saturndocs/renderer build
```

Create Context Graph on SaturnDocs
