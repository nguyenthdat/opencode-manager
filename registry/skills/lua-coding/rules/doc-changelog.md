# doc-changelog

> Maintain a CHANGELOG for published modules/rocks

## Why It Matters

Because Lua has no compiler to catch breaking API changes, consumers of a published module rely entirely on release notes to know whether upgrading is safe — a missing changelog means every upgrade is a guessing game of diffing source across versions.

## Bad

```
mylib-2.0.0-1.rockspec
mylib-1.5.0-1.rockspec
-- no CHANGELOG anywhere; consumers must diff git tags to find out what changed
```

## Good

```markdown
# Changelog

## [2.0.0] - 2026-03-01
### Breaking
- `M.fetchData` renamed to `M.fetch_data` (old name kept as a deprecated alias
  until 3.0.0)
### Added
- `M.fetch_data` now accepts an `opts.timeout` field

## [1.5.0] - 2025-11-10
### Added
- New `M.batch_fetch` for fetching multiple resources in one call
### Fixed
- Fixed a crash when `M.fetch_data` was called with a `nil` URL
```

Keep entries grouped by version, most recent first, and call out `Breaking`/`Added`/`Fixed`/`Deprecated` explicitly so consumers can scan straight to what matters for their upgrade.

## Pairing With `_VERSION`

Keep the changelog's version headers in sync with the module's own `_VERSION` field and the LuaRocks rockspec version, so all three sources of truth agree.

## See Also

- [api-version-field](api-version-field.md)
- [api-backward-compat-field](api-backward-compat-field.md)
- [proj-rockspec-luarocks](proj-rockspec-luarocks.md)
