---
name: ruby-coding
description: "Comprehensive idiomatic Ruby guidance: 165 prioritized rules across 14 categories. Use when writing, reviewing, refactoring, optimizing, or debugging Ruby (`.rb`, `Gemfile`, `Rakefile`, `.gemspec`). Covers object model, blocks/enumerable, error handling, metaprogramming, Rails conventions, security, testing (RSpec/Minitest), performance, and anti-patterns. Target Ruby 3.3+ with YJIT; preserve the project's declared Ruby version."
compatibility: opencode
metadata:
  domain: ruby
  audience: software-engineer
  edition: ruby-3.3
---

# Ruby Best Practices

Comprehensive guide for writing high-quality, idiomatic, and production-ready Ruby code. Contains 165 rules across 14 categories, prioritized by impact to guide LLMs in code generation and refactoring.

## When to Apply

Reference these guidelines when:
- Writing new Ruby classes, modules, or methods
- Implementing error handling or exception chains
- Designing public APIs for gems or Rails applications
- Working with blocks, procs, lambdas, or enumerables
- Writing RSpec/Minitest tests
- Optimizing memory usage or performance
- Configuring RuboCop or Standard Ruby
- Reviewing code for security vulnerabilities
- Refactoring existing Ruby codebases
- Structuring Rails models, controllers, and service objects

## Ruby 3.3+ & Modern Features

This skill targets **Ruby 3.3+** (released December 2023). Key features available:

- **YJIT enabled by default.** Ruby 3.3 enables YJIT at runtime by default on supported platforms (x86-64, arm64). Use `RubyVM::YJIT.enable` to activate it in production for significant performance gains without code changes.
- **Prism parser.** Ruby 3.3 ships Prism (formerly YARP) as a built-in gem — a portable, error-tolerant parser that supersedes parse.y for tooling (linters, formatters, LSPs). RuboCop and Syntax Tree use Prism for faster, more accurate analysis.
- **Pattern matching improvements.** Hash pattern matching (`in { key: }`), find patterns (`in [*, x, *]`), and pin operator `^` for referencing outer variables in patterns.
- **`Data.define` (Ruby 3.2+).** Immutable value objects with `==`, `eql?`, `hash`, `deconstruct`, and `deconstruct_keys` automatically defined. Prefer over `Struct` for immutable records.
- **Endless methods.** `def foo = expression` for single-expression methods (Ruby 3.0+). Use sparingly for simple delegations and predicates.
- **Numbered parameters.** `_1`, `_2` (and `_3`+ with `#warn`) for implicit block parameters in simple blocks (Ruby 2.7+). Use when the block is one line and parameter names add no clarity.
- **Ractors.** Experimental parallel execution units with isolated state — useful for CPU-bound workloads. Do not share mutable objects between Ractors.
- **Fiber Scheduler.** `Fiber.set_scheduler` enables non-blocking I/O with async gems (Async, Falcon). Ruby 3.3 stabilizes the interface.
- **RBS & Sorbet.** Type annotation tools: RBS is the standard signature language (stdlib includes type definitions); Sorbet provides runtime checking and gradual typing. Use for large codebases or public APIs.

For the full list, consult the [Ruby 3.3 release notes](https://www.ruby-lang.org/en/news/2023/12/25/ruby-3-3-0-released/) and [Ruby Changes](https://rubyreferences.github.io/rubychanges/3.3.html).

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Object Model & Classes | CRITICAL | `obj-` | 12 |
| 2 | Error Handling & Exceptions | CRITICAL | `err-` | 12 |
| 3 | Blocks, Procs & Enumerable | CRITICAL | `block-` | 14 |
| 4 | Metaprogramming & Reflection | HIGH | `meta-` | 11 |
| 5 | API Design & Interfaces | HIGH | `api-` | 12 |
| 6 | Security | HIGH | `sec-` | 11 |
| 7 | Naming & Style Conventions | MEDIUM | `name-` | 14 |
| 8 | Testing (RSpec/Minitest) | MEDIUM | `test-` | 13 |
| 9 | Documentation (YARD/RDoc) | MEDIUM | `doc-` | 9 |
| 10 | Performance & Memory | MEDIUM | `perf-` | 12 |
| 11 | Rails & Web | MEDIUM | `rails-` | 11 |
| 12 | Project Structure & Gems | LOW | `proj-` | 10 |
| 13 | Linting (RuboCop/Standard) | LOW | `lint-` | 10 |
| 14 | Anti-patterns | REFERENCE | `anti-` | 14 |

---

## Quick Reference

### 1. Object Model & Classes (CRITICAL)

- [`obj-immutable-value`](rules/obj-immutable-value.md) — Use `Data.define` (3.2+) for immutable value objects
- [`obj-prefer-composition`](rules/obj-prefer-composition.md) — Prefer composition and modules over deep inheritance
- [`obj-single-responsibility`](rules/obj-single-responsibility.md) — Each class has one reason to change
- [`obj-attr-accessor-auto`](rules/obj-attr-accessor-auto.md) — Use `attr_reader`/`attr_accessor` over manual getters
- [`obj-freeze-constants`](rules/obj-freeze-constants.md) — Freeze constants to prevent mutation
- [`obj-to-s-inspect`](rules/obj-to-s-inspect.md) — Override `to_s` and `inspect` for debugging output
- [`obj-identity-equality`](rules/obj-identity-equality.md) — Implement `==` and `eql?` correctly
- [`obj-dup-clone`](rules/obj-dup-clone.md) — Understand `dup` vs `clone` (frozen, singleton methods)
- [`obj-public-private`](rules/obj-public-private.md) — Use `public`/`protected`/`private` intentionally
- [`obj-module-method`](rules/obj-module-method.md) — Use `module_function` or `extend self` for module methods
- [`obj-struct-vs-class`](rules/obj-struct-vs-class.md) — Use `Struct` or `Data` over bare Hash for typed data
- [`obj-initialize-super`](rules/obj-initialize-super.md) — Call `super` in `initialize` when subclassing

### 2. Error Handling & Exceptions (CRITICAL)

- [`err-rescue-specific`](rules/err-rescue-specific.md) — Rescue specific exceptions, not `Exception`
- [`err-custom-exception`](rules/err-custom-exception.md) — Create custom exception classes for domain errors
- [`err-ensure-cleanup`](rules/err-ensure-cleanup.md) — Use `ensure` for resource cleanup
- [`err-no-rescue-nil`](rules/err-no-rescue-nil.md) — Don't silently rescue and return `nil`
- [`err-retry-with-limit`](rules/err-retry-with-limit.md) — Use `retry` only with a counter limit
- [`err-begin-block-scope`](rules/err-begin-block-scope.md) — Minimize `begin`/`rescue` block scope
- [`err-raise-over-fail`](rules/err-raise-over-fail.md) — Use `raise`, not `fail` (community convention)
- [`err-exception-message`](rules/err-exception-message.md) — Include context in exception messages
- [`err-cause-chaining`](rules/err-cause-chaining.md) — Use `raise ... cause:` to chain exceptions
- [`err-no-exception-rescue`](rules/err-no-exception-rescue.md) — Rescue `StandardError`, not `Exception`
- [`err-pattern-matching-rescue`](rules/err-pattern-matching-rescue.md) — Use pattern matching rescue for structured errors
- [`err-log-and-raise`](rules/err-log-and-raise.md) — Log before re-raising when appropriate

### 3. Blocks, Procs & Enumerable (CRITICAL)

- [`block-each-over-for`](rules/block-each-over-for.md) — Use `.each` over `for` loops
- [`block-map-over-each`](rules/block-map-over-each.md) — Use `.map` when building a new array
- [`block-select-reject`](rules/block-select-reject.md) — Use `.select`/`.reject` over manual `if` in `each`
- [`block-reduce-inject`](rules/block-reduce-inject.md) — Use `.reduce`/`.inject` with clear initial value
- [`block-find-over-select-first`](rules/block-find-over-select-first.md) — Use `.find` (alias `detect`) over `.select.first`
- [`block-any-all-none`](rules/block-any-all-none.md) — Use `.any?`/`.all?`/`.none?` over manual bool tracking
- [`block-ampersand-shorthand`](rules/block-ampersand-shorthand.md) — Use `&:method` shorthand for simple blocks
- [`block-numbered-params`](rules/block-numbered-params.md) — Use `_1`, `_2` for simple blocks (Ruby 2.7+)
- [`block-yield-over-call`](rules/block-yield-over-call.md) — Prefer `yield` over `block.call` for performance
- [`block-tap-yield`](rules/block-tap-yield.md) — Use `.tap` for debugging and chaining
- [`block-with-object`](rules/block-with-object.md) — Use `each_with_object` for accumulator patterns
- [`block-lazy-enumerators`](rules/block-lazy-enumerators.md) — Use `.lazy` for large enumerable chains
- [`block-flat-map`](rules/block-flat-map.md) — Use `.flat_map` over `.map.flatten`
- [`block-group-by-partition`](rules/block-group-by-partition.md) — Use `.group_by` and `.partition` for grouping

### 4. Metaprogramming & Reflection (HIGH)

- [`meta-define-method`](rules/meta-define-method.md) — Use `define_method` for dynamic method creation
- [`meta-method-missing`](rules/meta-method-missing.md) — Implement `method_missing` AND `respond_to_missing?`
- [`meta-send-cautious`](rules/meta-send-cautious.md) — Use `public_send` unless you need private access
- [`meta-const-missing`](rules/meta-const-missing.md) — Use `const_missing` for autoloading patterns
- [`meta-eval-cautious`](rules/meta-eval-cautious.md) — Avoid `class_eval`/`instance_eval` when possible
- [`meta-hook-safe`](rules/meta-hook-safe.md) — Use `inherited`/`included`/`extended`/`prepended` hooks carefully
- [`meta-singleton-class`](rules/meta-singleton-class.md) — Understand singleton class (eigenclass) patterns
- [`meta-refinement-over-monkey`](rules/meta-refinement-over-monkey.md) — Use refinements over global monkey patching
- [`meta-delegate-forward`](rules/meta-delegate-forward.md) — Use `Forwardable` or `delegate` over manual delegation
- [`meta-no-send-security`](rules/meta-no-send-security.md) — Don't use `send` with user-supplied method names
- [`meta-macro-module`](rules/meta-macro-module.md) — Use `Module#included` for class macro methods

### 5. API Design & Interfaces (HIGH)

- [`api-keyword-arguments`](rules/api-keyword-arguments.md) — Use keyword arguments for methods with 3+ params
- [`api-bang-methods`](rules/api-bang-methods.md) — Use `!` suffix for dangerous/mutating versions
- [`api-predicate-methods`](rules/api-predicate-methods.md) — Use `?` suffix for boolean-returning methods
- [`api-fluent-interface`](rules/api-fluent-interface.md) — Return `self` for method chaining when mutating
- [`api-factory-methods`](rules/api-factory-methods.md) — Use class-level factory methods over complex `initialize`
- [`api-builder-pattern`](rules/api-builder-pattern.md) — Use Builder pattern for multi-step object construction
- [`api-default-values`](rules/api-default-values.md) — Set meaningful defaults in method signatures
- [`api-duck-type-over-class`](rules/api-duck-type-over-class.md) — Check `respond_to?` over `is_a?`/`kind_of?`
- [`api-null-object`](rules/api-null-object.md) — Use Null Object pattern over `nil` checks
- [`api-splat-args`](rules/api-splat-args.md) — Use `*args`/`**kwargs` with care; prefer explicit params
- [`api-single-responsibility`](rules/api-single-responsibility.md) — Methods do one thing well
- [`api-public-api-minimal`](rules/api-public-api-minimal.md) — Keep public API surface minimal

### 6. Security (HIGH)

- [`sec-no-eval`](rules/sec-no-eval.md) — Never eval user input
- [`sec-sql-injection`](rules/sec-sql-injection.md) — Use parameterized queries with ActiveRecord
- [`sec-xss-prevention`](rules/sec-xss-prevention.md) — Escape HTML output; use Rails helpers
- [`sec-mass-assignment`](rules/sec-mass-assignment.md) — Use strong parameters in Rails
- [`sec-csrf-protection`](rules/sec-csrf-protection.md) — Use `protect_from_forgery` in Rails
- [`sec-secrets-management`](rules/sec-secrets-management.md) — Use Rails credentials or env vars for secrets
- [`sec-path-traversal`](rules/sec-path-traversal.md) — Validate file paths; use `File.join`/`File.basename`
- [`sec-regex-dos`](rules/sec-regex-dos.md) — Guard against ReDoS with linear-time regex
- [`sec-safe-deserialize`](rules/sec-safe-deserialize.md) — Never `YAML.load` untrusted input; use `YAML.safe_load`
- [`sec-cookie-secure`](rules/sec-cookie-secure.md) — Set `secure`, `httponly`, `samesite` on cookies
- [`sec-dependency-audit`](rules/sec-dependency-audit.md) — Run `bundler-audit`; keep gems updated

### 7. Naming & Style Conventions (MEDIUM)

- [`name-classes-pascal-case`](rules/name-classes-pascal-case.md) — `PascalCase` for classes and modules
- [`name-methods-snake-case`](rules/name-methods-snake-case.md) — `snake_case` for methods and variables
- [`name-constants-upper-snake`](rules/name-constants-upper-snake.md) — `UPPER_SNAKE_CASE` for constants
- [`name-files-snake-case`](rules/name-files-snake-case.md) — `snake_case` for file names
- [`name-predicate-question`](rules/name-predicate-question.md) — End predicate methods with `?`
- [`name-bang-dangerous`](rules/name-bang-dangerous.md) — End dangerous/mutating methods with `!`
- [`name-setter-equals`](rules/name-setter-equals.md) — Use `=` suffix for setter methods
- [`name-is-has-boolean`](rules/name-is-has-boolean.md) — Prefix booleans with `is_`/`has_`/`can_`
- [`name-block-variables-verbose`](rules/name-block-variables-verbose.md) — Name block params meaningfully
- [`name-no-abbrev`](rules/name-no-abbrev.md) — Avoid abbreviations except widely accepted (`req`, `res`)
- [`name-symbol-vs-string`](rules/name-symbol-vs-string.md) — Use symbols for identifiers, strings for data
- [`name-no-get-prefix`](rules/name-no-get-prefix.md) — Don't prefix getters with `get_`
- [`name-module-namespace`](rules/name-module-namespace.md) — Use module namespacing to avoid conflicts
- [`name-acronyms-lowercase`](rules/name-acronyms-lowercase.md) — Treat acronyms as words in `CamelCase`

### 8. Testing (RSpec/Minitest) (MEDIUM)

- [`test-rspec-framework`](rules/test-rspec-framework.md) — Use RSpec for behavior-driven testing
- [`test-describe-context`](rules/test-describe-context.md) — Use `describe`/`context`/`it` with readable descriptions
- [`test-let-over-before`](rules/test-let-over-before.md) — Use `let` for test data, not instance variables in `before`
- [`test-subject-explicit`](rules/test-subject-explicit.md) — Prefer explicit subject over implicit
- [`test-factory-bot`](rules/test-factory-bot.md) — Use FactoryBot over fixtures for test data
- [`test-double-verify`](rules/test-double-verify.md) — Use verifying doubles (`instance_double`) over generic
- [`test-shared-examples`](rules/test-shared-examples.md) — Use `shared_examples` and `it_behaves_like` for reuse
- [`test-matcher-compose`](rules/test-matcher-compose.md) — Use built-in matchers over manual assertions
- [`test-one-expectation`](rules/test-one-expectation.md) — One expectation per example when practical
- [`test-sidekiq-jobs`](rules/test-sidekiq-jobs.md) — Test Sidekiq jobs with inline mode
- [`test-request-specs`](rules/test-request-specs.md) — Use request specs over controller specs
- [`test-focus-danger`](rules/test-focus-danger.md) — Never commit `fit`/`fdescribe`/`fcontext` to main
- [`test-transactional-fixtures`](rules/test-transactional-fixtures.md) — Use transactional fixtures or `database_cleaner`

### 9. Documentation (YARD/RDoc) (MEDIUM)

- [`doc-yard-format`](rules/doc-yard-format.md) — Use YARD comments (`@param`, `@return`, `@example`)
- [`doc-readme-gems`](rules/doc-readme-gems.md) — Standard README structure for gems
- [`doc-rbs-signatures`](rules/doc-rbs-signatures.md) — Write RBS signatures for public APIs
- [`doc-inline-why`](rules/doc-inline-why.md) — Comment WHY, not WHAT
- [`doc-return-type`](rules/doc-return-type.md) — Document return types in YARD
- [`doc-changelog-keep`](rules/doc-changelog-keep.md) — Maintain `CHANGELOG.md`
- [`doc-deprecated-warning`](rules/doc-deprecated-warning.md) — Use `@deprecated` with migration path
- [`doc-no-stale-code`](rules/doc-no-stale-code.md) — Remove commented-out code; trust git history
- [`doc-yard-inheritable`](rules/doc-yard-inheritable.md) — Use `@see` for cross-references

### 10. Performance & Memory (MEDIUM)

- [`perf-freeze-strings`](rules/perf-freeze-strings.md) — Use `# frozen_string_literal: true`
- [`perf-each-over-for`](rules/perf-each-over-for.md) — Use `.each` over `for` (with enumeration benefits)
- [`perf-map-over-each`](rules/perf-map-over-each.md) — Use `.map` over `.each` with push
- [`perf-bang-versions`](rules/perf-bang-versions.md) — Use mutating methods (`!`) when object reuse is safe
- [`perf-string-concat`](rules/perf-string-concat.md) — Use `<<` over `+=` for string building
- [`perf-array-literal`](rules/perf-array-literal.md) — Use `%w`/`%i` literals for arrays of strings/symbols
- [`perf-include-vs-extend`](rules/perf-include-vs-extend.md) — Prefer `include` over `extend` for module methods
- [`perf-read-buffer`](rules/perf-read-buffer.md) — Read files in buffered chunks for large files
- [`perf-memoize-or-equal`](rules/perf-memoize-or-equal.md) — Use `@var ||=` for memoization (careful with `false`/`nil`)
- [`perf-eager-load`](rules/perf-eager-load.md) — Eager load associations to avoid N+1 queries
- [`perf-avoid-object-alloc`](rules/perf-avoid-object-alloc.md) — Reuse objects in hot loops; avoid `Array.new` in loop
- [`perf-yjit-enabled`](rules/perf-yjit-enabled.md) — Run with YJIT enabled (Ruby 3.3+ default)

### 11. Rails & Web (MEDIUM)

- [`rails-skinny-controller`](rules/rails-skinny-controller.md) — Keep controllers thin; move logic to services/models
- [`rails-fat-model`](rules/rails-fat-model.md) — Move query logic into model scopes and class methods
- [`rails-service-objects`](rules/rails-service-objects.md) — Use service objects for complex business operations
- [`rails-scopes-chainable`](rules/rails-scopes-chainable.md) — Write chainable scopes with lambdas
- [`rails-n-plus-one`](rules/rails-n-plus-one.md) — Use `includes`/`eager_load`/`preload` to prevent N+1
- [`rails-strong-params`](rules/rails-strong-params.md) — Use strong parameters, never direct mass assignment
- [`rails-migrations-reversible`](rules/rails-migrations-reversible.md) — Write reversible migrations
- [`rails-partial-render`](rules/rails-partial-render.md) — Use partials with locals; avoid instance variable coupling
- [`rails-policy-objects`](rules/rails-policy-objects.md) — Extract authorization to policy objects (Pundit/CanCanCan)
- [`rails-jobs-idempotent`](rules/rails-jobs-idempotent.md) — Make background jobs idempotent
- [`rails-config-credentials`](rules/rails-config-credentials.md) — Use Rails credentials over `.env` files

### 12. Project Structure & Gems (LOW)

- [`proj-gemfile-pin`](rules/proj-gemfile-pin.md) — Pin gem versions; use pessimistic operator (`~>`)
- [`proj-bundler-convention`](rules/proj-bundler-convention.md) — Follow bundler/gem standard layout
- [`proj-lib-rails-separate`](rules/proj-lib-rails-separate.md) — Separate `lib/` from `app/` concerns
- [`proj-rubocop-configure`](rules/proj-rubocop-configure.md) — Set up RuboCop with a shared config
- [`proj-ruby-version-file`](rules/proj-ruby-version-file.md) — Commit `.ruby-version`
- [`proj-gitignore-templates`](rules/proj-gitignore-templates.md) — Include standard Ruby ignores
- [`proj-script-directory`](rules/proj-script-directory.md) — Put scripts in `bin/` or `script/`
- [`proj-dotenv-management`](rules/proj-dotenv-management.md) — Use dotenv for development only, not production
- [`proj-monorepo-gems`](rules/proj-monorepo-gems.md) — Use path-based gem references in Gemfile for monorepos
- [`proj-rubocop-gradual`](rules/proj-rubocop-gradual.md) — Use `rubocop_todo.yml` for gradual adoption

### 13. Linting (RuboCop/Standard) (LOW)

- [`lint-rubocop-standard`](rules/lint-rubocop-standard.md) — Use RuboCop (or Standard Ruby) with consistent config
- [`lint-frozen-string-literal`](rules/lint-frozen-string-literal.md) — Enforce `frozen_string_literal` comments
- [`lint-method-length`](rules/lint-method-length.md) — Limit method length to 10–15 lines
- [`lint-class-length`](rules/lint-class-length.md) — Limit class length to 100–200 lines
- [`lint-parameter-count`](rules/lint-parameter-count.md) — Limit parameters to 3–4
- [`lint-complexity`](rules/lint-complexity.md) — Limit ABC and cyclomatic complexity
- [`lint-no-unused-vars`](rules/lint-no-unused-vars.md) — Error on unused variables
- [`lint-no-rescue-nil`](rules/lint-no-rescue-nil.md) — Forbid `rescue nil` patterns
- [`lint-brakeman-security`](rules/lint-brakeman-security.md) — Run Brakeman for security analysis
- [`lint-fasterer-speed`](rules/lint-fasterer-speed.md) — Run Fasterer for performance linting

### 14. Anti-patterns (REFERENCE)

- [`anti-monkey-patching`](rules/anti-monkey-patching.md) — Don't monkey-patch core classes without refinements
- [`anti-nil-check-chains`](rules/anti-nil-check-chains.md) — Don't chain nil checks; use `&.` or Null Object
- [`anti-control-couple`](rules/anti-control-couple.md) — Don't pass booleans to control flow inside methods
- [`anti-rescue-everything`](rules/anti-rescue-everything.md) — Don't rescue `Exception`; rescue `StandardError`
- [`anti-memoize-conditional`](rules/anti-memoize-conditional.md) — Don't use `||=` for memoizing `false`/`nil` returns
- [`anti-class-var`](rules/anti-class-var.md) — Don't use `@@class_variables`; use class instance variables
- [`anti-eval-execution`](rules/anti-eval-execution.md) — Don't `eval`/`class_eval` with user input
- [`anti-rescue-without-handle`](rules/anti-rescue-without-handle.md) — Don't rescue without logging or handling
- [`anti-overly-long-chain`](rules/anti-overly-long-chain.md) — Don't chain beyond 3–4 method calls
- [`anti-nested-conditionals`](rules/anti-nested-conditionals.md) — Don't nest conditionals beyond 2 levels
- [`anti-magic-data`](rules/anti-magic-data.md) — Don't hardcode magic numbers; use constants
- [`anti-super-with-args`](rules/anti-super-with-args.md) — Always pass args to `super` explicitly unless forwarding
- [`anti-case-equality`](rules/anti-case-equality.md) — Don't use `===` operator directly; use `case`/`when`
- [`anti-compact-model`](rules/anti-compact-model.md) — Don't use compact class/module definition

---

## Recommended Config Files

### `.rubocop.yml` (Personal)

```yaml
require:
  - rubocop-performance
  - rubocop-rails
  - rubocop-rspec

AllCops:
  TargetRubyVersion: 3.3
  NewCops: enable
  Exclude:
    - "db/schema.rb"
    - "bin/**/*"
    - "vendor/**/*"

# Style
Style/FrozenStringLiteralComment:
  Enabled: true
  EnforcedStyle: always

Style/Documentation:
  Enabled: false

Style/GuardClause:
  Enabled: true
  MinBodyLength: 3

# Metrics
Metrics/MethodLength:
  Max: 15
  Exclude:
    - "db/migrate/**/*"

Metrics/ClassLength:
  Max: 200
  Exclude:
    - "db/migrate/**/*"

Metrics/ParameterLists:
  Max: 4
  CountKeywordArgs: false

Metrics/AbcSize:
  Max: 20

Metrics/CyclomaticComplexity:
  Max: 10

# Lint
Lint/SuppressedException:
  AllowComments: false

Lint/RescueException:
  Enabled: true

# Performance
Performance/ChainArrayAllocation:
  Enabled: true

Performance/MapCompact:
  Enabled: true

# Rails
Rails/OutputSafety:
  Enabled: true

Rails/ReversibleMigration:
  Enabled: true

# RSpec
RSpec/NestedGroups:
  Max: 4

RSpec/MultipleExpectations:
  Max: 5

RSpec/ExampleLength:
  Max: 10
```

### `Gemfile` (Recommended)

```ruby
# frozen_string_literal: true

source "https://rubygems.org"

ruby ">= 3.3.0"

# Framework
gem "rails", "~> 7.2"

# Database
gem "pg", "~> 1.5"

# Performance
gem "bootsnap", require: false

# Background jobs
gem "sidekiq", "~> 7.3"

group :development, :test do
  gem "rspec-rails", "~> 7.0"
  gem "factory_bot_rails", "~> 6.4"
  gem "rubocop", "~> 1.66", require: false
  gem "rubocop-performance", require: false
  gem "rubocop-rails", require: false
  gem "rubocop-rspec", require: false
  gem "brakeman", require: false
end

group :development do
  gem "web-console", "~> 4.2"
  gem "rack-mini-profiler", "~> 3.3"
end

group :test do
  gem "shoulda-matchers", "~> 6.4"
  gem "faker", "~> 3.4"
  gem "database_cleaner-active_record", "~> 2.2"
end
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing Ruby code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New class/module | `obj-`, `name-`, `doc-` |
| Error handling | `err-`, `api-` |
| Working with Enumerable | `block-`, `perf-` |
| Metaprogramming | `meta-`, `sec-` |
| API design (gem) | `api-`, `doc-`, `proj-` |
| Security review | `sec-`, `lint-` |
| Testing (RSpec) | `test-`, `api-` |
| Performance tuning | `perf-`, `block-` |
| Rails controller/model | `rails-`, `obj-`, `sec-` |
| Code review | `anti-`, `lint-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) — choosing and implementing GoF/idiomatic patterns in Ruby.
- [security-review](../security-review/SKILL.md) — cross-language security/correctness review methodology (phases, finding format, severity guidance); it does not yet ship a dedicated Ruby bug-class reference, so apply the general workflow to mass-assignment, YAML/Marshal deserialization, and SQL/command-injection risks.

## Sources

This skill synthesizes best practices from:
- [Ruby Style Guide](https://rubystyle.guide/) (bbatsov)
- [RuboCop Documentation](https://docs.rubocop.org/)
- [Rails Guides](https://guides.rubyonrails.org/)
- [RSpec Best Practices](https://rspec.info/documentation/)
- Production codebases: Shopify, GitLab, Spree, Discourse
- [Ruby Security Guide](https://guides.rubyonrails.org/security.html)
- Community conventions (2024–2025)
