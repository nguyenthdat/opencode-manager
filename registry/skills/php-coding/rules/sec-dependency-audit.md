# sec-dependency-audit

> Run `composer audit` regularly

## Why It Matters

Outdated dependencies with known vulnerabilities are a primary attack vector. Run `composer audit` (Composer 2.4+) in CI to detect packages with known security advisories. Automate this check — never deploy with known vulnerabilities.

## Bad

```php
<?php

declare(strict_types=1);

// No dependency auditing
// composer.json with outdated, vulnerable packages
// "guzzlehttp/guzzle": "^6.0" — has known CVEs
```

## Good

```php
<?php

declare(strict_types=1);

// .github/workflows/audit.yml
// - name: Security Audit
//   run: composer audit

// Local checks
// $ composer audit
// Found 2 security vulnerability advisories affecting 2 packages:
//   guzzlehttp/guzzle (CVE-2023-xxx)

// Update immediately
// $ composer update guzzlehttp/guzzle

// Prevent installing vulnerable packages
// $ composer install --no-audit
// (Only use in dev when you've verified there are no real issues)

// Automated with Dependabot / Renovate
```

## See Also

- [proj-version-tags](./proj-version-tags.md)
- [proj-composer-autoload](./proj-composer-autoload.md)
