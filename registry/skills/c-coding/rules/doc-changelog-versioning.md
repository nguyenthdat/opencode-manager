# doc-changelog-versioning

> Maintain a changelog documenting every public-API-visible change, tagged against the library's version number, especially breaking changes

## Why It Matters

Consumers of a C library upgrade versions without visibility into your commit history; a changelog is the one place that summarizes, in consumer-relevant terms, what changed, what broke, and what a migration requires. Without it, every upgrade becomes a diffing exercise for the consumer, and breaking ABI/API changes surface as confusing build or runtime failures rather than anticipated, documented ones.

## Bad

```
(no CHANGELOG at all; consumers must read every commit message since their
last upgrade to figure out what changed)
```

## Good

```markdown
# Changelog

## 2.0.0 (2026-03-01)
### Breaking
- `widget_create()` now returns `NULL` on failure instead of aborting;
  callers must add a NULL check (previously unchecked calls would abort).
- Removed `widget_legacy_init()` (deprecated since 1.4.0); use `widget_create()`.

### Added
- `widget_clone()` for duplicating an existing widget.

## 1.4.0 (2025-11-12)
### Deprecated
- `widget_legacy_init()` is deprecated; use `widget_create()` instead.
  Will be removed in 2.0.0.

### Fixed
- Fixed a use-after-free in `widget_destroy()` when called twice (#142).
```

## Tie Versioning to Semantic Versioning for a C Library

```c
/* widget.h */
#define WIDGET_VERSION_MAJOR 2   /* breaking API/ABI changes */
#define WIDGET_VERSION_MINOR 0   /* backward-compatible additions */
#define WIDGET_VERSION_PATCH 0    /* backward-compatible bug fixes */
```

## See Also

- [api-stable-abi-layout](api-stable-abi-layout.md) - The kind of change most in need of changelog visibility
- [proj-versioned-public-header](proj-versioned-public-header.md) - Exposing the version number programmatically
- [doc-document-error-conditions](doc-document-error-conditions.md) - Keeping per-function docs and the changelog consistent
