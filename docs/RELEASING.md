# Releasing opencode-manager

The package is published as `@nguyenthdat/opencode-manager`. Version `0.1.0`
is bootstrapped once with a granular npm token. Every later release is
published by GitHub Actions through npm Trusted Publishing and OIDC.

## One-time bootstrap publish

The package must exist on npm before its trusted publisher can be configured.
Use a granular access token belonging to `nguyenthdat`, with read/write access
to this package and 2FA bypass enabled only for publishing.

```bash
export NPM_TOKEN=...
bun ci
bun run format:check
bun run typecheck
bun test
bun run build
npm pack --dry-run
npm publish --access public \
  --//registry.npmjs.org/:_authToken="$NPM_TOKEN"
unset NPM_TOKEN
```

Do not add `NPM_TOKEN` to `publish-npm.yml`. The token is only a bootstrap
credential and should be revoked after Trusted Publishing works.

## Configure npm Trusted Publishing

After `0.1.0` exists on npm, open:

```text
https://www.npmjs.com/package/@nguyenthdat/opencode-manager/access
```

Under **Trusted Publisher**, select **GitHub Actions** and enter:

| Field                | Value              |
| -------------------- | ------------------ |
| Organization or user | `nguyenthdat`      |
| Repository           | `opencode-manager` |
| Workflow filename    | `publish-npm.yml`  |
| Environment          | Leave empty        |
| Allowed action       | Publish            |

The workflow filename must match `.github/workflows/publish-npm.yml` exactly.
It grants `id-token: write`, runs on GitHub-hosted Ubuntu, uses Node 24, and
does not set `NODE_AUTH_TOKEN`.

With npm CLI 12, the equivalent command is:

```bash
npm trust github @nguyenthdat/opencode-manager \
  --repo nguyenthdat/opencode-manager \
  --file publish-npm.yml \
  --allow-publish \
  --yes
```

After configuration:

1. Revoke the bootstrap granular token or remove this package from its scope.
2. Keep publishing 2FA enabled for token-based publishing.
3. Do not create a GitHub `NPM_TOKEN` secret for this repository.

## Create a release

Update `package.json` and `bun.lock` to the same semantic version, rebuild
`dist`, and verify the project:

```bash
bun install
bun run format:check
bun run build
bun run typecheck
bun test
npm pack --dry-run
```

Commit the version and generated `dist` files. Create and push a matching tag:

```bash
git tag v0.1.1
git push origin main
git push origin v0.1.1
```

The tag must exactly equal `v` plus the version in `package.json`. The Release
workflow then:

1. Validates the tag and package version.
2. Installs with the frozen Bun lockfile.
3. Runs typecheck, tests, build, dist freshness checks, and dependency audit.
4. Packs the exact npm tarball and calculates its SHA-256 checksum.
5. Publishes to npm through OIDC with provenance.
6. Creates a GitHub Release with generated notes, tarball, and checksum.

The workflow is idempotent for an already-published package version and can be
rerun manually with an existing `vX.Y.Z` tag through **Actions > Release > Run
workflow**.
