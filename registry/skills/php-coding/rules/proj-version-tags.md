# proj-version-tags

> Tag releases with semver; use git tags

## Why It Matters

Git tags mark release points, enabling `composer require` to pull specific versions. Semantic versioning (MAJOR.MINOR.PATCH) communicates the scope of changes. Tags enable rollbacks, changelog generation, and dependency management.

## Bad

```php
<?php

// No tags — no versioning
// git log --oneline
// abc123 Update documentation
// def456 Fix payment bug
// ghi789 Add new feature

// composer.json — no version concept
{
    "name": "vendor/package",
    "description": "A package"
}
```

## Good

```php
<?php

// Tag releases with semver
// git tag -a v1.2.0 -m "Add export feature"
// git tag -a v1.2.1 -m "Fix payment rounding bug"
// git push --tags

// v1.2.1 — PATCH: bugfix
// v1.3.0 — MINOR: new feature, backward compatible
// v2.0.0 — MAJOR: breaking changes

// composer.json — uses tags
{
    "name": "vendor/package",
    "version": "1.2.1",
    "description": "A package"
}

// Consumers pin versions
// composer require vendor/package:^1.2
```

## See Also

- [doc-changelog-keep](./doc-changelog-keep.md)
- [proj-composer-autoload](./proj-composer-autoload.md)
