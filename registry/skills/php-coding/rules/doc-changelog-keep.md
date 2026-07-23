# doc-changelog-keep

> Maintain CHANGELOG.md

## Why It Matters

A changelog documents what changed between versions — new features, bug fixes, breaking changes, and deprecations. It helps users decide whether to upgrade and what impact it will have. Follow the Keep a Changelog format for consistency across projects.

## Bad

```php
// No changelog — users don't know what changed
// $ git tag v1.1.0
// commit message: "various fixes and improvements"
// Users have to read git log or diff to understand changes
```

## Good

```php
// CHANGELOG.md — Keep a Changelog format
// # Changelog
//
// ## [1.1.0] - 2024-03-15
//
// ### Added
// - Export orders to CSV (#42)
// - Support for EUR currency (#45)
//
// ### Changed
// - Minimum PHP version is now 8.2 (#50)
//
// ### Deprecated
// - `Order::calculateOld()` — use `Order::calculate()` instead (#48)
//
// ### Fixed
// - Rounding error in tax calculation for amounts under $1 (#44)
// - Memory leak in long-running import jobs (#47)
//
// ### Security
// - Fixed XSS vulnerability in order notes display (#49)
//
// ## [1.0.0] - 2024-01-01
//
// ### Added
// - Initial release

// Automate from git
// composer require --dev marcocesarato/php-conventional-changelog
// vendor/bin/conventional-changelog
```

## See Also

- [doc-deprecated-tag](./doc-deprecated-tag.md)
- [proj-version-tags](./proj-version-tags.md)
- [doc-readme-standard](./doc-readme-standard.md)
