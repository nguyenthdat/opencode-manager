---
name: php-coding
description: "Comprehensive idiomatic PHP guidance: 170 prioritized rules across 14 categories. Use when writing, reviewing, refactoring, optimizing, or debugging PHP (`.php`, `composer.json`). Covers type system, strict types, OOP/DI, async/concurrency (Fibers/Swoole), error handling, security, Laravel/Symfony, testing, database patterns, and anti-patterns. Target PHP 8.3+ with JIT; preserve the project's declared PHP version."
compatibility: opencode
metadata:
  domain: php
  audience: software-engineer
  edition: php-8.3
---

# PHP Best Practices

Comprehensive guide for writing high-quality, idiomatic, and secure PHP code. Contains 170 rules across 14 categories, prioritized by impact to guide LLMs in code generation and refactoring.

## When to Apply

Reference these guidelines when:
- Writing new PHP classes, methods, or modules
- Implementing error handling or async code with Fibers/Swoole
- Designing public APIs for libraries or packages
- Reviewing code for security vulnerabilities
- Optimizing performance with OPcache and JIT
- Configuring static analysis (PHPStan/Psalm)
- Refactoring existing PHP code
- Setting up a new PHP project with Composer

## PHP 8.3+ & Modern Features

This skill targets **PHP 8.3+** with JIT compilation support. Key modern features to leverage:

- **`declare(strict_types=1)`** — Enable strict type checking in every file
- **Enums (PHP 8.1+)** — Use native enums over class constants; backed enums for database values
- **Readonly classes (PHP 8.2+)** — Immutable objects with `readonly class`
- **Readonly properties (PHP 8.1+)** — Per-property immutability
- **Fibers (PHP 8.1+)** — Cooperative concurrency for async I/O
- **First-class callable syntax (PHP 8.1+)** — `$fn = strlen(...)` over `Closure::fromCallable('strlen')`
- **Match expression (PHP 8.0+)** — Exhaustive pattern matching over `switch`
- **Named arguments (PHP 8.0+)** — Self-documenting calls: `->send(to: $email, subject: $subj)`
- **Nullsafe operator (PHP 8.0+)** — `$user?->getProfile()?->getAvatar()`
- **Constructor property promotion (PHP 8.0+)** — `__construct(private string $name)`
- **Intersection types (PHP 8.1+)** — `Countable&Iterator`
- **DNF types (PHP 8.2+)** — `(Foo&Bar)|null`
- **`json_validate()` (PHP 8.3+)** — Validate JSON without decoding
- **`#[Override]` attribute (PHP 8.3+)** — Compile-time override validation
- **PHP-CS-Fixer / Laravel Pint** — Automated code style enforcement

Set the PHP version constraint in `composer.json`:

```json
{
    "require": {
        "php": ">=8.3"
    },
    "config": {
        "platform": {
            "php": "8.3"
        }
    }
}
```

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Type System & Strict Types | CRITICAL | `type-` | 14 |
| 2 | Error & Exception Handling | CRITICAL | `err-` | 12 |
| 3 | OOP & Design Patterns | CRITICAL | `oop-` | 16 |
| 4 | Dependency Injection & Containers | HIGH | `di-` | 10 |
| 5 | Security | HIGH | `sec-` | 14 |
| 6 | Asynchronous & Concurrency | HIGH | `async-` | 9 |
| 7 | Naming & Style Conventions | MEDIUM | `name-` | 14 |
| 8 | Testing (PHPUnit/Pest) | MEDIUM | `test-` | 13 |
| 9 | Documentation (PHPDoc) | MEDIUM | `doc-` | 9 |
| 10 | Performance & Memory | MEDIUM | `perf-` | 12 |
| 11 | Database & ORM (Eloquent/Doctrine) | MEDIUM | `db-` | 11 |
| 12 | Project Structure & Composer | LOW | `proj-` | 11 |
| 13 | Linting & Static Analysis | LOW | `lint-` | 10 |
| 14 | Anti-patterns | REFERENCE | `anti-` | 15 |

---

## Quick Reference

### 1. Type System & Strict Types (CRITICAL)

- [`type-strict-types`](rules/type-strict-types.md) - Always use `declare(strict_types=1)`
- [`type-parameter-return`](rules/type-parameter-return.md) - Add type declarations to all method parameters and returns
- [`type-nullable-explicit`](rules/type-nullable-explicit.md) - Use `?Type` or `Type|null` for nullable types
- [`type-union-intersection`](rules/type-union-intersection.md) - Use union types (`A|B`) and intersection types (`A&B`)
- [`type-enums-over-constants`](rules/type-enums-over-constants.md) - Use Enums (PHP 8.1+) over class constants
- [`type-readonly-classes`](rules/type-readonly-classes.md) - Use readonly classes (PHP 8.2+) for immutable objects
- [`type-backed-enums`](rules/type-backed-enums.md) - Use backed enums (string/int) for database/API values
- [`type-avoid-mixed`](rules/type-avoid-mixed.md) - Avoid `mixed` type; use specific types or generics via PHPDoc
- [`type-named-arguments`](rules/type-named-arguments.md) - Use named arguments for clarity with 3+ params
- [`type-match-over-switch`](rules/type-match-over-switch.md) - Use match expression over switch for exhaustive matching
- [`type-property-promotion`](rules/type-property-promotion.md) - Use constructor property promotion
- [`type-nullsafe-operator`](rules/type-nullsafe-operator.md) - Use `?->` operator over repetitive null checks
- [`type-array-shape-phpdoc`](rules/type-array-shape-phpdoc.md) - Use `@phpstan-type` and array shapes in PHPDoc
- [`type-first-class-callable`](rules/type-first-class-callable.md) - Use first-class callable syntax over Closure

### 2. Error & Exception Handling (CRITICAL)

- [`err-throw-exceptions`](rules/err-throw-exceptions.md) - Throw exceptions, never return error codes or `false`
- [`err-custom-exceptions`](rules/err-custom-exceptions.md) - Create domain-specific exception classes
- [`err-catch-specific`](rules/err-catch-specific.md) - Catch specific exception types, not `\Throwable`
- [`err-try-narrow-scope`](rules/err-try-narrow-scope.md) - Keep try blocks small and focused
- [`err-finally-cleanup`](rules/err-finally-cleanup.md) - Use finally blocks for resource cleanup
- [`err-no-empty-catch`](rules/err-no-empty-catch.md) - Never catch without logging or rethrowing
- [`err-exception-context`](rules/err-exception-context.md) - Include context data in exceptions
- [`err-log-and-throw`](rules/err-log-and-throw.md) - Log before throwing when appropriate
- [`err-throwable-vs-exception`](rules/err-throwable-vs-exception.md) - Catch `\Throwable` only at top-level error handlers
- [`err-chained-exceptions`](rules/err-chained-exceptions.md) - Use `$previous` parameter for exception chaining
- [`err-transaction-rollback`](rules/err-transaction-rollback.md) - Roll back transactions on exception
- [`err-no-suppress-operator`](rules/err-no-suppress-operator.md) - Never use `@` error suppression operator

### 3. OOP & Design Patterns (CRITICAL)

- [`oop-composition-over-inheritance`](rules/oop-composition-over-inheritance.md) - Prefer composition/traits over deep inheritance
- [`oop-interface-segregation`](rules/oop-interface-segregation.md) - Keep interfaces small and focused
- [`oop-single-responsibility`](rules/oop-single-responsibility.md) - One reason to change per class
- [`oop-dependency-injection`](rules/oop-dependency-injection.md) - Inject dependencies; don't instantiate inline
- [`oop-constructor-injection-over-setter`](rules/oop-constructor-injection-over-setter.md) - Use constructor injection over setter injection
- [`oop-value-objects`](rules/oop-value-objects.md) - Use immutable value objects with readonly properties
- [`oop-dto-data-transfer`](rules/oop-dto-data-transfer.md) - Use DTOs for input/output boundaries
- [`oop-repository-pattern`](rules/oop-repository-pattern.md) - Abstract data access with repository pattern
- [`oop-factory-method`](rules/oop-factory-method.md) - Use static factory methods over complex constructors (named constructors)
- [`oop-strategy-pattern`](rules/oop-strategy-pattern.md) - Use strategy pattern for swappable algorithms
- [`oop-builder-pattern`](rules/oop-builder-pattern.md) - Use Builder for multi-step object construction
- [`oop-fluent-interface`](rules/oop-fluent-interface.md) - Return `$this` for method chaining
- [`oop-null-object`](rules/oop-null-object.md) - Use Null Object pattern over null checks
- [`oop-trait-over-abstract`](rules/oop-trait-over-abstract.md) - Use traits for shared behavior; interfaces for contracts
- [`oop-final-by-default`](rules/oop-final-by-default.md) - Make classes final by default; open for extension via interfaces
- [`oop-encapsulation`](rules/oop-encapsulation.md) - Use private/protected; avoid public properties

### 4. Dependency Injection & Containers (HIGH)

- [`di-container-binding`](rules/di-container-binding.md) - Bind interfaces to implementations in service container
- [`di-auto-wiring`](rules/di-auto-wiring.md) - Use auto-wiring; avoid manual resolution
- [`di-contract-resolution`](rules/di-contract-resolution.md) - Type-hint interfaces, let container resolve concretes
- [`di-scoped-services`](rules/di-scoped-services.md) - Bind scoped services for request lifecycle
- [`di-no-service-locator`](rules/di-no-service-locator.md) - Inject dependencies; don't resolve from container in business logic
- [`di-deferred-providers`](rules/di-deferred-providers.md) - Use deferred service providers for lazy loading
- [`di-tagged-services`](rules/di-tagged-services.md) - Use tagged services for collections of implementations
- [`di-config-injection`](rules/di-config-injection.md) - Inject config values, don't read `config()` directly
- [`di-facades-real-time`](rules/di-facades-real-time.md) - Use real-time facades over traditional facades (Laravel)
- [`di-testability-first`](rules/di-testability-first.md) - Design classes for testability via DI first

### 5. Security (HIGH)

- [`sec-sql-injection`](rules/sec-sql-injection.md) - Use parameterized queries/ORM; never raw SQL with user input
- [`sec-xss-prevention`](rules/sec-xss-prevention.md) - Always escape output: `htmlspecialchars()` or `{{ }}` in Blade/Twig
- [`sec-csrf-token`](rules/sec-csrf-token.md) - Include CSRF token on all state-changing forms
- [`sec-input-sanitize`](rules/sec-input-sanitize.md) - Validate AND sanitize all user input
- [`sec-password-hash`](rules/sec-password-hash.md) - Use `password_hash()`/`password_verify()`, never md5/sha1
- [`sec-prepared-statements`](rules/sec-prepared-statements.md) - Use PDO prepared statements; never concatenate queries
- [`sec-file-upload`](rules/sec-file-upload.md) - Validate file type, size; store outside web root
- [`sec-env-secrets`](rules/sec-env-secrets.md) - Store secrets in `.env` (not committed); never hardcode
- [`sec-rate-limiting`](rules/sec-rate-limiting.md) - Implement rate limiting on auth endpoints
- [`sec-cors-proper`](rules/sec-cors-proper.md) - Configure CORS explicitly; never use wildcard in production
- [`sec-session-security`](rules/sec-session-security.md) - Use secure, httponly, samesite cookie flags
- [`sec-path-traversal`](rules/sec-path-traversal.md) - Use `basename()` and `realpath()` for file path validation
- [`sec-hsts-header`](rules/sec-hsts-header.md) - Enable HSTS headers in production
- [`sec-dependency-audit`](rules/sec-dependency-audit.md) - Run `composer audit` regularly

### 6. Asynchronous & Concurrency (HIGH)

- [`async-fibers-use-case`](rules/async-fibers-use-case.md) - Use Fibers (PHP 8.1+) for cooperative concurrency
- [`async-swoole-open-swoole`](rules/async-swoole-open-swoole.md) - Use Swoole/OpenSwoole for high-concurrency servers
- [`async-queue-jobs`](rules/async-queue-jobs.md) - Offload heavy work to queues (Redis/RabbitMQ)
- [`async-guzzle-async`](rules/async-guzzle-async.md) - Use Guzzle promise pool for concurrent HTTP
- [`async-no-blocking-io`](rules/async-no-blocking-io.md) - Avoid blocking I/O in Fibers/Swoole contexts
- [`async-generator-coroutine`](rules/async-generator-coroutine.md) - Use generators as coroutines (yield in Fibers)
- [`async-worker-pool`](rules/async-worker-pool.md) - Pool workers for parallel processing
- [`async-retry-exponential`](rules/async-retry-exponential.md) - Exponential backoff for async operation retries
- [`async-timeout-guard`](rules/async-timeout-guard.md) - Set timeouts on all async operations

### 7. Naming & Style Conventions (MEDIUM)

- [`name-classes-PascalCase`](rules/name-classes-PascalCase.md) - PascalCase for classes, interfaces, traits, enums
- [`name-methods-vars-camelCase`](rules/name-methods-vars-camelCase.md) - camelCase for methods, properties, variables
- [`name-constants-UPPER_SNAKE`](rules/name-constants-UPPER_SNAKE.md) - UPPER_SNAKE_CASE for class constants
- [`name-interfaces-suffix`](rules/name-interfaces-suffix.md) - Suffix interfaces (e.g. -able, Contract, or prefix I)
- [`name-abstract-prefix`](rules/name-abstract-prefix.md) - Prefix abstract classes with Abstract
- [`name-traits-suffix`](rules/name-traits-suffix.md) - Suffix traits with Trait
- [`name-is-has-boolean`](rules/name-is-has-boolean.md) - Prefix boolean methods with is/has/should/can
- [`name-get-set-properties`](rules/name-get-set-properties.md) - Use getXxx/setXxx for property accessors
- [`name-method-verb-object`](rules/name-method-verb-object.md) - Start methods with verb (sendEmail, not emailSend)
- [`name-no-abbrev`](rules/name-no-abbrev.md) - Avoid abbreviations except well-known (id, url, db)
- [`name-enums-singular`](rules/name-enums-singular.md) - Enum names singular; cases UPPER_SNAKE
- [`name-test-method`](rules/name-test-method.md) - Test method: `test{Method}_{Scenario}`
- [`name-controller-suffix`](rules/name-controller-suffix.md) - Suffix controllers with Controller
- [`name-exception-suffix`](rules/name-exception-suffix.md) - Suffix exception classes with Exception

### 8. Testing — PHPUnit/Pest (MEDIUM)

- [`test-phpunit-pest`](rules/test-phpunit-pest.md) - Use PHPUnit (procedural) or Pest (BDD style)
- [`test-arrange-act-assert`](rules/test-arrange-act-assert.md) - Structure tests: arrange, act, assert
- [`test-data-providers`](rules/test-data-providers.md) - Use `@dataProvider` for parameterized tests
- [`test-mock-over-stub`](rules/test-mock-over-stub.md) - Mock interfaces, not concrete classes when possible
- [`test-isolation`](rules/test-isolation.md) - Tests must be independent and isolated
- [`test-setup-teardown`](rules/test-setup-teardown.md) - Use `setUp()`/`tearDown()` for test fixtures
- [`test-coverage-target`](rules/test-coverage-target.md) - Aim for 80%+ coverage on business logic
- [`test-no-only`](rules/test-no-only.md) - Never commit `$this->markTestIncomplete()` or `->only()`
- [`test-database-testing`](rules/test-database-testing.md) - Use `RefreshDatabase` trait (Laravel) or transactions
- [`test-factories-over-fixtures`](rules/test-factories-over-fixtures.md) - Use model factories over hardcoded fixtures
- [`test-http-feature-tests`](rules/test-http-feature-tests.md) - Test HTTP layer with feature tests, not just unit
- [`test-exception-expect`](rules/test-exception-expect.md) - Use `expectException()` for exception testing
- [`test-mutation-testing`](rules/test-mutation-testing.md) - Run Infection for mutation testing on critical paths

### 9. Documentation — PHPDoc (MEDIUM)

- [`doc-phpdoc-public`](rules/doc-phpdoc-public.md) - Write PHPDoc for all public API elements
- [`doc-param-return`](rules/doc-param-return.md) - Document `@param` and `@return` with types
- [`doc-throws-tag`](rules/doc-throws-tag.md) - Document `@throws` for methods that throw
- [`doc-generics-phpstan`](rules/doc-generics-phpstan.md) - Use `@template`/`@extends` for generic type documentation
- [`doc-deprecated-tag`](rules/doc-deprecated-tag.md) - Use `@deprecated` with replacement guidance
- [`doc-readme-standard`](rules/doc-readme-standard.md) - Standard README with install, usage, API, license
- [`doc-changelog-keep`](rules/doc-changelog-keep.md) - Maintain CHANGELOG.md
- [`doc-inline-why`](rules/doc-inline-why.md) - Comment WHY not WHAT
- [`doc-no-stale-code`](rules/doc-no-stale-code.md) - Remove commented-out code

### 10. Performance & Memory (MEDIUM)

- [`perf-opcache-enable`](rules/perf-opcache-enable.md) - Enable OPcache in production
- [`perf-jit-config`](rules/perf-jit-config.md) - Configure JIT compiler for CPU-bound workloads
- [`perf-autoload-optimize`](rules/perf-autoload-optimize.md) - Run `composer dump-autoload -o` in production
- [`perf-array-over-object`](rules/perf-array-over-object.md) - Use arrays for simple data; objects for behavior
- [`perf-references-large`](rules/perf-references-large.md) - Pass large arrays/objects by reference when mutating
- [`perf-generator-yield`](rules/perf-generator-yield.md) - Use generators (`yield`) for large datasets
- [`perf-prepared-statement-reuse`](rules/perf-prepared-statement-reuse.md) - Reuse prepared statements in loops
- [`perf-cache-frequent`](rules/perf-cache-frequent.md) - Cache expensive computations and DB queries
- [`perf-array-map-filter`](rules/perf-array-map-filter.md) - Use `array_map`/`array_filter` over foreach for transformations
- [`perf-in-array-strict`](rules/perf-in-array-strict.md) - Use `in_array()` with `strict=true` for type safety
- [`perf-string-interpolation`](rules/perf-string-interpolation.md) - Use `"{$var}"` interpolation over concatenation
- [`perf-avoid-shell-exec`](rules/perf-avoid-shell-exec.md) - Avoid `exec()`/`shell_exec()` in web requests

### 11. Database & ORM (Eloquent/Doctrine) (MEDIUM)

- [`db-migrations-version`](rules/db-migrations-version.md) - Use migrations for schema, never manual ALTER
- [`db-index-strategy`](rules/db-index-strategy.md) - Index foreign keys and WHERE/JOIN columns
- [`db-eager-loading`](rules/db-eager-loading.md) - Eager load relationships to avoid N+1
- [`db-chunk-processing`](rules/db-chunk-processing.md) - Use `chunk()`/`cursor()` for large result sets
- [`db-transaction-atomic`](rules/db-transaction-atomic.md) - Wrap multi-step writes in transactions
- [`db-query-builder-over-raw`](rules/db-query-builder-over-raw.md) - Use query builder/ORM over raw SQL
- [`db-select-specific`](rules/db-select-specific.md) - Select only needed columns; avoid `SELECT *`
- [`db-connection-pool`](rules/db-connection-pool.md) - Configure connection pooling in production
- [`db-migration-reversible`](rules/db-migration-reversible.md) - Write reversible migrations with `up()`/`down()`
- [`db-deadlock-retry`](rules/db-deadlock-retry.md) - Implement retry logic for deadlock errors
- [`db-no-model-in-view`](rules/db-no-model-in-view.md) - Don't pass Eloquent models directly to views; use DTOs

### 12. Project Structure & Composer (LOW)

- [`proj-composer-autoload`](rules/proj-composer-autoload.md) - Configure PSR-4 autoloading in composer.json
- [`proj-src-tests-separate`](rules/proj-src-tests-separate.md) - Use `src/` and `tests/` directory structure
- [`proj-service-layer`](rules/proj-service-layer.md) - Separate service/business layer from controllers
- [`proj-action-pattern`](rules/proj-action-pattern.md) - Use single-action controllers or invokable classes
- [`proj-env-example`](rules/proj-env-example.md) - Commit `.env.example`, never `.env`
- [`proj-config-cache`](rules/proj-config-cache.md) - Cache config in production (`php artisan config:cache`)
- [`proj-gitignore-standard`](rules/proj-gitignore-standard.md) - Include `vendor/`, `.env`, `.phpunit.result.cache`
- [`proj-script-composer`](rules/proj-script-composer.md) - Use Composer scripts for build/test tasks
- [`proj-namespace-match-dir`](rules/proj-namespace-match-dir.md) - Namespace must match directory structure (PSR-4)
- [`proj-version-tags`](rules/proj-version-tags.md) - Tag releases with semver; use git tags
- [`proj-docker-php`](rules/proj-docker-php.md) - Provide Dockerfile for consistent PHP environment

### 13. Linting & Static Analysis (LOW)

- [`lint-php-cs-fixer`](rules/lint-php-cs-fixer.md) - Use PHP-CS-Fixer or Laravel Pint for code style
- [`lint-phpstan-level`](rules/lint-phpstan-level.md) - Run PHPStan at level 8+ (or Psalm equivalent)
- [`lint-strict-rules`](rules/lint-strict-rules.md) - Enable strict rules in PHPStan/Psalm
- [`lint-no-unused-imports`](rules/lint-no-unused-imports.md) - Error on unused imports
- [`lint-method-complexity`](rules/lint-method-complexity.md) - Limit cyclomatic complexity
- [`lint-return-type`](rules/lint-return-type.md) - Require return type declarations
- [`lint-property-type`](rules/lint-property-type.md) - Require property type declarations
- [`lint-no-debug-code`](rules/lint-no-debug-code.md) - Forbid `dd()`, `var_dump()`, `die()` in committed code
- [`lint-native-type-hints`](rules/lint-native-type-hints.md) - Use native PHP type hints over PHPDoc-only types
- [`lint-unused-private`](rules/lint-unused-private.md) - Detect unused private methods/properties

### 14. Anti-patterns (REFERENCE)

- [`anti-global-state`](rules/anti-global-state.md) - Don't use global variables or static state
- [`anti-singleton-misuse`](rules/anti-singleton-misuse.md) - Don't use Singleton pattern for DI container bypassing
- [`anti-god-class`](rules/anti-god-class.md) - Don't create classes with many responsibilities
- [`anti-static-coupling`](rules/anti-static-coupling.md) - Don't use static methods for stateful logic
- [`anti-raw-sql`](rules/anti-raw-sql.md) - Don't concatenate user input into SQL strings
- [`anti-magic-methods-overuse`](rules/anti-magic-methods-overuse.md) - Don't overuse `__get`/`__set`/`__call` magic methods
- [`anti-array-access-object`](rules/anti-array-access-object.md) - Don't use ArrayAccess when proper methods exist
- [`anti-die-in-library`](rules/anti-die-in-library.md) - Don't use `die()`/`exit()` in library code
- [`anti-silent-error-swallow`](rules/anti-silent-error-swallow.md) - Don't use `try {} catch (\Throwable $e) {}` empty
- [`anti-instanceof-chains`](rules/anti-instanceof-chains.md) - Don't chain instanceof checks; use polymorphism
- [`anti-trait-everywhere`](rules/anti-trait-everywhere.md) - Don't overuse traits as replacement for composition
- [`anti-service-locator`](rules/anti-service-locator.md) - Don't use service locator anti-pattern (resolving from container)
- [`anti-classic-includes`](rules/anti-classic-includes.md) - Don't use include/require for dependency loading
- [`anti-mutable-config`](rules/anti-mutable-config.md) - Don't mutate configuration at runtime
- [`anti-extract-parsing`](rules/anti-extract-parsing.md) - Don't use `extract()` or `parse_str()` with untrusted data

---

## Recommended composer.json Settings

```json
{
    "require": {
        "php": ">=8.3"
    },
    "require-dev": {
        "phpunit/phpunit": "^11.0",
        "phpstan/phpstan": "^2.0",
        "laravel/pint": "^1.0",
        "infection/infection": "^0.29"
    },
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "App\\Tests\\": "tests/"
        }
    },
    "scripts": {
        "test": "phpunit",
        "lint": "phpstan analyse",
        "format": "pint",
        "check": [
            "@lint",
            "@test"
        ]
    },
    "config": {
        "optimize-autoloader": true,
        "preferred-install": "dist",
        "sort-packages": true,
        "platform": {
            "php": "8.3"
        }
    }
}
```

## Recommended PHP-CS-Fixer / Pint Configuration

```php
// pint.json (Laravel Pint) or .php-cs-fixer.dist.php
// Key rules to enable:
// - declare_strict_types => true
// - strict_param => true
// - array_syntax => ['syntax' => 'short']
// - ordered_imports => ['sort_algorithm' => 'alpha']
// - no_unused_imports => true
// - declare_equal_normalize => ['space' => 'none']
// - native_function_invocation => true
// - native_constant_invocation => true
```

## Recommended OPcache Configuration (php.ini)

```ini
opcache.enable=1
opcache.enable_cli=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=64
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
opcache.revalidate_freq=2
opcache.jit=tracing
opcache.jit_buffer_size=100M
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing PHP code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New class/method | `type-`, `oop-`, `name-` |
| New API/endpoint | `sec-`, `oop-`, `doc-` |
| Async/concurrent code | `async-`, `err-` |
| Error handling | `err-`, `oop-` |
| Database queries | `db-`, `perf-`, `err-` |
| Performance tuning | `perf-`, `db-` |
| Security review | `sec-`, `err-` |
| Code review | `anti-`, `lint-` |
| Testing | `test-`, `oop-`, `di-` |
| Project setup | `proj-`, `lint-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) — choosing and implementing GoF/idiomatic patterns in PHP (composition, DI, strategy, repository).
- [security-review](../security-review/SKILL.md) — cross-language security/correctness review methodology (phases, finding format, severity guidance); it does not yet ship a dedicated PHP bug-class reference, so apply the general workflow to unserialize/object-injection, SQL/command injection, and file-inclusion (LFI/RFI) risks.

## Sources

This skill synthesizes best practices from:
- [PHP-FIG Standards (PSR-1, PSR-4, PSR-12)](https://www.php-fig.org/)
- [PHP: The Right Way](https://phptherightway.com/)
- [PHPStan Documentation](https://phpstan.org/)
- [Psalm Documentation](https://psalm.dev/)
- [Laravel Documentation](https://laravel.com/docs/)
- [Symfony Documentation](https://symfony.com/doc/)
- [OWASP PHP Security Cheat Sheet](https://cheatsheetseries.owasp.org/)
- Production codebases: Laravel, Symfony, Composer, PHPUnit
- PHP-CS-Fixer and Pint documentation
- Community conventions (2024-2025)
