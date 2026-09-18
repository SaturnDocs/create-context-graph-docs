# Create Context Graph documentation

This public repository publishes the Create Context Graph documentation on
SaturnDocs at <https://create-context-graph.saturndocs.net>.

The documentation originates from the public
[`neo4j-labs/create-context-graph`](https://github.com/neo4j-labs/create-context-graph)
repository. The complete upstream `docs/` tree is preserved under
`sources/upstream/docs/`. The Apache License 2.0 from the upstream repository
is preserved as `LICENSE`.

## Repository layout

- `sources/upstream/` is the immutable source snapshot used for this import.
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

Create Context Graph documentation on SaturnDocs
