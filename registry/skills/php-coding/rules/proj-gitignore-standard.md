# proj-gitignore-standard

> Include `vendor/`, `.env`, `.phpunit.result.cache`

## Why It Matters

A proper `.gitignore` prevents committing compiled dependencies, secrets, IDE files, and build artifacts. The standard PHP `.gitignore` is well-established — use it for all projects.

## Bad

```php
<?php

// .gitignore — missing key entries
/vendor
.env
/node_modules

// No OS/IDE entries
```

## Good

```php
<?php

# .gitignore
/vendor/
.env
.env.local
.env.*.local
.phpunit.result.cache
composer.lock

# Build artifacts
/build/
/public/build/
/public/hot/
/public/storage

# Node
/node_modules/

# IDE
/.idea/
/.vscode/
*.sublime-*

# OS
.DS_Store
Thumbs.db

# Testing
/tests/coverage/
/.phpunit.cache/

# Laravel specific
/storage/*.key
/storage/debugbar/
```

## See Also

- [proj-env-example](./proj-env-example.md)
- [doc-no-stale-code](./doc-no-stale-code.md)
