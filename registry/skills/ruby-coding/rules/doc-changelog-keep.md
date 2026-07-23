# doc-changelog-keep

> Maintain CHANGELOG.md

## Why It Matters

A CHANGELOG documents notable changes per version: added, changed, deprecated, removed, fixed, security. It helps users understand what changed when upgrading. Follow keepachangelog.com format.

## Bad

# No CHANGELOG -- users must read git log to find breaking changes
```


## Good

# CHANGELOG.md
## [2.0.0] - 2025-01-15
### Added
- New `#export_csv` method on Order model
### Changed
- `Client#initialize` now requires `api_key:` keyword argument (breaking)
### Deprecated
- `Client#legacy_method` will be removed in 3.0.0
### Fixed
- Race condition in concurrent order processing
```


## See Also

- [proj-gemfile-pin](./proj-gemfile-pin.md)
