---
name: csharp-coding
description: "Comprehensive idiomatic C#/.NET guidance: 186 prioritized rules across 15 categories covering memory/resource management, error handling, async/await, API and record design, LINQ, naming, nullability, dependency injection, testing, documentation, performance, project structure, analyzers, and anti-patterns. Use when writing, reviewing, refactoring, optimizing, or debugging C# or .NET code (`.cs`, `.csproj`, `Directory.Build.props`). Targets modern C# 12/13 and .NET 8/9 idioms (primary constructors, collection expressions, required members, nullable reference types, records) while respecting the project's declared language version and target framework."
compatibility: opencode
metadata:
  domain: csharp
  audience: software-engineer
  edition: project-declared
---

# C# / .NET Best Practices

Comprehensive guide for writing high-quality, idiomatic C# and .NET code. Contains 186 rules across 15 categories, prioritized by impact. Project constraints override generic defaults: preserve the declared `LangVersion`, `TargetFramework`, and nullable/analyzer settings unless the user explicitly requests a migration or upgrade.

## When to Apply

Reference these guidelines when:
- Writing new C# classes, records, methods, or minimal API endpoints
- Implementing error handling or async/await code
- Designing public APIs for libraries or NuGet packages
- Reviewing code for nullability, disposal, or concurrency issues
- Optimizing memory usage or reducing allocations
- Configuring dependency injection lifetimes and registrations
- Writing or reviewing unit/integration tests
- Refactoring existing C#/.NET code
- Setting up analyzers, `.editorconfig`, or CI formatting checks

## Modern C#/.NET (C# 12/13, .NET 8/9)

For an existing project, preserve its `LangVersion` and `TargetFramework` unless a migration is explicitly in scope. For new projects, target the latest LTS/STS release actually supported by your deployment environment. Key modern idioms to prefer when the project's language version supports them:

- **Primary constructors** (C# 12+). Reduce constructor boilerplate for simple field capture and DI - see [`api-primary-constructor`](rules/api-primary-constructor.md).
- **Collection expressions** (`[1, 2, 3]`, C# 12+). One consistent literal syntax across arrays, `List<T>`, `Span<T>`, and custom collection-builder types, including the spread operator (`..`) - see [`api-collection-expressions`](rules/api-collection-expressions.md).
- **`required` members** (C# 11+). Compiler-enforced mandatory properties without a long constructor - see [`api-required-members`](rules/api-required-members.md).
- **`record`/`record struct`**. Value-based equality, `with` expressions, and deconstruction generated for you - see [`api-record-value-data`](rules/api-record-value-data.md) and [`immut-record-struct-small-value`](rules/immut-record-struct-small-value.md).
- **Nullable reference types** (`<Nullable>enable</Nullable>`, C# 8+, foundational for modern code). Turns a huge class of `NullReferenceException`s into compile-time warnings - see [`type-nullable-reference-types`](rules/type-nullable-reference-types.md).
- **Pattern matching enhancements**: list patterns, property patterns, logical (`and`/`or`/`not`) patterns - see [`type-pattern-matching-is`](rules/type-pattern-matching-is.md).
- **`ref struct`s and `Span<T>`/`Memory<T>`**. Stack-only, allocation-free data access for hot paths - see [`mem-span-zero-alloc`](rules/mem-span-zero-alloc.md) and [`mem-ref-struct-stack`](rules/mem-ref-struct-stack.md).
- **Source generators** over reflection for serialization, logging, and mapping - see [`perf-source-generators-over-reflection`](rules/perf-source-generators-over-reflection.md).
- **Frozen collections** (`FrozenDictionary`/`FrozenSet`, .NET 8+) for build-once/read-many lookups - see [`immut-frozen-collections`](rules/immut-frozen-collections.md).
- **Generic math** (`INumber<T>`, .NET 7+) for numeric-agnostic algorithms - see [`type-generic-math`](rules/type-generic-math.md).
- **Keyed DI services** (.NET 8+) for multiple implementations of one interface - see [`di-keyed-services`](rules/di-keyed-services.md).

For the authoritative, complete list of language and runtime changes, consult the official [What's New in C#](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/) and [.NET release notes](https://github.com/dotnet/core/tree/main/release-notes). Everything below applies across supported versions; prefer the modern forms above where the project's `LangVersion`/`TargetFramework` allow them.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Memory & Resource Management | CRITICAL | `mem-` | 14 |
| 2 | Error Handling | CRITICAL | `err-` | 13 |
| 3 | Async/Await & Concurrency | CRITICAL | `async-` | 17 |
| 4 | API & Type Design | HIGH | `api-` | 15 |
| 5 | Records & Immutability | HIGH | `immut-` | 10 |
| 6 | LINQ & Collections | HIGH | `linq-` | 12 |
| 7 | Naming Conventions | MEDIUM | `name-` | 14 |
| 8 | Type Safety & Nullability | MEDIUM/HIGH | `type-` | 12 |
| 9 | Dependency Injection & Configuration | MEDIUM | `di-` | 10 |
| 10 | Testing | MEDIUM | `test-` | 13 |
| 11 | Documentation | MEDIUM | `doc-` | 9 |
| 12 | Performance Patterns | MEDIUM | `perf-` | 12 |
| 13 | Project Structure | LOW | `proj-` | 10 |
| 14 | Analyzers & Linting | LOW | `lint-` | 10 |
| 15 | Anti-patterns | REFERENCE | `anti-` | 15 |

---

## Quick Reference

### 1. Memory & Resource Management (CRITICAL)

- [`mem-using-declaration`](rules/mem-using-declaration.md) - Use `using` declarations for deterministic disposal
- [`mem-await-using-async`](rules/mem-await-using-async.md) - Use `await using` for `IAsyncDisposable`
- [`mem-dispose-pattern`](rules/mem-dispose-pattern.md) - Implement the full `IDisposable` dispose pattern
- [`mem-finalizer-rare`](rules/mem-finalizer-rare.md) - Only add a finalizer when holding raw unmanaged handles
- [`mem-span-zero-alloc`](rules/mem-span-zero-alloc.md) - Use `Span<T>`/`ReadOnlySpan<T>` for zero-allocation slicing
- [`mem-memory-async-boundary`](rules/mem-memory-async-boundary.md) - Use `Memory<T>` across async boundaries
- [`mem-arraypool-rent`](rules/mem-arraypool-rent.md) - Rent from `ArrayPool<T>` for short-lived large buffers
- [`mem-readonly-struct`](rules/mem-readonly-struct.md) - Mark immutable structs `readonly struct`
- [`mem-ref-struct-stack`](rules/mem-ref-struct-stack.md) - Use `ref struct` for stack-only types
- [`mem-struct-vs-class`](rules/mem-struct-vs-class.md) - Choose struct vs class by size/mutability/identity
- [`mem-avoid-boxing`](rules/mem-avoid-boxing.md) - Avoid boxing value types in hot paths
- [`mem-stackalloc-small`](rules/mem-stackalloc-small.md) - Use `stackalloc` for small, bounded buffers
- [`mem-object-pooling`](rules/mem-object-pooling.md) - Pool expensive objects with `ObjectPool<T>`
- [`mem-large-object-heap`](rules/mem-large-object-heap.md) - Understand LOH allocations for large arrays/objects

### 2. Error Handling (CRITICAL)

- [`err-exceptions-exceptional`](rules/err-exceptions-exceptional.md) - Reserve exceptions for exceptional conditions
- [`err-custom-hierarchy`](rules/err-custom-hierarchy.md) - Design a custom exception hierarchy
- [`err-argumentnull-throwifnull`](rules/err-argumentnull-throwifnull.md) - Use `ArgumentNullException.ThrowIfNull`
- [`err-no-catch-exception`](rules/err-no-catch-exception.md) - Don't catch the base `Exception` broadly
- [`err-exception-filters-when`](rules/err-exception-filters-when.md) - Use exception filters (`when`)
- [`err-preserve-stack-trace`](rules/err-preserve-stack-trace.md) - Use `throw;` not `throw ex;`
- [`err-finally-cleanup`](rules/err-finally-cleanup.md) - Use `finally` for guaranteed cleanup
- [`err-wrap-with-innerexception`](rules/err-wrap-with-innerexception.md) - Wrap with `innerException` preserved
- [`err-async-exception-propagation`](rules/err-async-exception-propagation.md) - Understand async exception flow
- [`err-aggregateexception-flatten`](rules/err-aggregateexception-flatten.md) - Flatten `AggregateException`
- [`err-result-pattern-domain`](rules/err-result-pattern-domain.md) - Use `Result<T>` for expected failures
- [`err-exception-message-quality`](rules/err-exception-message-quality.md) - Write actionable exception messages
- [`err-dont-swallow`](rules/err-dont-swallow.md) - Never swallow exceptions silently

### 3. Async/Await & Concurrency (CRITICAL)

- [`async-configureawait-false-lib`](rules/async-configureawait-false-lib.md) - Use `ConfigureAwait(false)` in libraries
- [`async-no-async-void`](rules/async-no-async-void.md) - Avoid `async void` except event handlers
- [`async-task-vs-valuetask`](rules/async-task-vs-valuetask.md) - Choose `ValueTask<T>` only for proven hot paths
- [`async-cancellationtoken-propagate`](rules/async-cancellationtoken-propagate.md) - Propagate `CancellationToken`
- [`async-no-sync-over-async`](rules/async-no-sync-over-async.md) - Never block on async with `.Result`/`.Wait()`
- [`async-iasyncenumerable-streaming`](rules/async-iasyncenumerable-streaming.md) - Use `IAsyncEnumerable<T>` for streaming
- [`async-semaphoreslim-lock`](rules/async-semaphoreslim-lock.md) - Use `SemaphoreSlim` for async-safe locking
- [`async-whenall-parallel`](rules/async-whenall-parallel.md) - Use `Task.WhenAll` for parallel operations
- [`async-whenany-timeout`](rules/async-whenany-timeout.md) - Use `Task.WhenAny` for timeouts/racing
- [`async-taskcompletionsource-bridge`](rules/async-taskcompletionsource-bridge.md) - Bridge callbacks with `TaskCompletionSource<T>`
- [`async-name-suffix`](rules/async-name-suffix.md) - Suffix async methods with `Async`
- [`async-return-task-directly`](rules/async-return-task-directly.md) - Return the inner `Task` directly when possible
- [`async-avoid-task-run-server`](rules/async-avoid-task-run-server.md) - Avoid `Task.Run` for server request paths
- [`async-valuetask-single-await`](rules/async-valuetask-single-await.md) - Await a `ValueTask` exactly once
- [`async-async-lambda-void`](rules/async-async-lambda-void.md) - Avoid async lambdas assigned to `Action`
- [`async-channels-producer-consumer`](rules/async-channels-producer-consumer.md) - Use `System.Threading.Channels`
- [`async-lock-not-monitor-async`](rules/async-lock-not-monitor-async.md) - Never hold `lock`/`Monitor` across `await`

### 4. API & Type Design (HIGH)

- [`api-primary-constructor`](rules/api-primary-constructor.md) - Use primary constructors to reduce boilerplate
- [`api-init-only-properties`](rules/api-init-only-properties.md) - Use `init`-only properties
- [`api-required-members`](rules/api-required-members.md) - Use `required` members instead of throwing constructors
- [`api-record-value-data`](rules/api-record-value-data.md) - Model immutable value data with `record`
- [`api-sealed-by-default`](rules/api-sealed-by-default.md) - Seal classes by default
- [`api-interface-segregation`](rules/api-interface-segregation.md) - Keep interfaces small and role-based
- [`api-extension-methods`](rules/api-extension-methods.md) - Use extension methods for types you don't own
- [`api-builder-fluent`](rules/api-builder-fluent.md) - Use a fluent builder for complex construction
- [`api-collection-expressions`](rules/api-collection-expressions.md) - Use collection expressions (`[1, 2, 3]`)
- [`api-expose-interfaces-not-impls`](rules/api-expose-interfaces-not-impls.md) - Return abstractions, not concrete collections
- [`api-optional-parameters-vs-overloads`](rules/api-optional-parameters-vs-overloads.md) - Prefer overloads over long optional-parameter lists
- [`api-generic-constraints`](rules/api-generic-constraints.md) - Constrain generics with `where` clauses
- [`api-static-factory-methods`](rules/api-static-factory-methods.md) - Use static factory methods for validated construction
- [`api-out-var-pattern`](rules/api-out-var-pattern.md) - Use `out var`/deconstruction for multiple returns
- [`api-with-expression-nondestructive`](rules/api-with-expression-nondestructive.md) - Use `with` for non-destructive mutation

### 5. Records & Immutability (HIGH)

- [`immut-record-equality`](rules/immut-record-equality.md) - Understand records give value-based equality
- [`immut-record-struct-small-value`](rules/immut-record-struct-small-value.md) - Use `record struct` for small values
- [`immut-readonly-fields`](rules/immut-readonly-fields.md) - Mark fields `readonly` unless mutation is required
- [`immut-immutable-collections`](rules/immut-immutable-collections.md) - Use `System.Collections.Immutable`
- [`immut-avoid-mutable-public-fields`](rules/immut-avoid-mutable-public-fields.md) - Never expose mutable public fields
- [`immut-with-nondestructive-mutation`](rules/immut-with-nondestructive-mutation.md) - Use `with` instead of manual copy constructors
- [`immut-defensive-copy-collections`](rules/immut-defensive-copy-collections.md) - Defensively copy internal collections
- [`immut-frozen-collections`](rules/immut-frozen-collections.md) - Use `FrozenDictionary`/`FrozenSet` for read-heavy lookups
- [`immut-positional-record-deconstruct`](rules/immut-positional-record-deconstruct.md) - Positional records for deconstruction
- [`immut-value-object-record`](rules/immut-value-object-record.md) - Model value objects as records, entities as classes

### 6. LINQ & Collections (HIGH)

- [`linq-deferred-execution-aware`](rules/linq-deferred-execution-aware.md) - Understand deferred execution
- [`linq-avoid-multiple-enumeration`](rules/linq-avoid-multiple-enumeration.md) - Avoid enumerating a query multiple times
- [`linq-avoid-hot-path`](rules/linq-avoid-hot-path.md) - Avoid LINQ allocations in hot paths
- [`linq-any-vs-count`](rules/linq-any-vs-count.md) - Use `.Any()` not `.Count() > 0`
- [`linq-firstordefault-vs-first`](rules/linq-firstordefault-vs-first.md) - Choose `FirstOrDefault` vs `First` deliberately
- [`linq-select-then-where-order`](rules/linq-select-then-where-order.md) - Filter before projecting
- [`linq-avoid-linq-in-loop-alloc`](rules/linq-avoid-linq-in-loop-alloc.md) - Hoist invariant LINQ queries out of loops
- [`linq-collection-choice`](rules/linq-collection-choice.md) - Choose collections by access pattern
- [`linq-span-linq-alternative`](rules/linq-span-linq-alternative.md) - Replace LINQ with loops only when profiled
- [`linq-groupby-lookup`](rules/linq-groupby-lookup.md) - Use `GroupBy`/`ToLookup` over manual grouping
- [`linq-orderby-stable`](rules/linq-orderby-stable.md) - Rely on `OrderBy`'s stability; chain `ThenBy`
- [`linq-iqueryable-vs-ienumerable`](rules/linq-iqueryable-vs-ienumerable.md) - Know when work is pushed to the database

### 7. Naming Conventions (MEDIUM)

- [`name-pascalcase-public`](rules/name-pascalcase-public.md) - `PascalCase` for types, methods, properties
- [`name-camelcase-locals`](rules/name-camelcase-locals.md) - `camelCase` for locals and parameters
- [`name-underscore-private-fields`](rules/name-underscore-private-fields.md) - Prefix private fields with `_camelCase`
- [`name-interface-i-prefix`](rules/name-interface-i-prefix.md) - Prefix interfaces with `I`
- [`name-async-suffix`](rules/name-async-suffix.md) - Suffix async methods with `Async`
- [`name-generic-type-param-t`](rules/name-generic-type-param-t.md) - Use `T`/`TKey`/`TValue` conventions
- [`name-boolean-is-has-can`](rules/name-boolean-is-has-can.md) - Use `Is`/`Has`/`Can` for booleans
- [`name-constants-pascalcase`](rules/name-constants-pascalcase.md) - `PascalCase` for constants, not `SCREAMING_CASE`
- [`name-namespace-matches-folder`](rules/name-namespace-matches-folder.md) - Match namespace to folder structure
- [`name-avoid-hungarian`](rules/name-avoid-hungarian.md) - Avoid Hungarian notation
- [`name-event-naming`](rules/name-event-naming.md) - Name events with a verb phrase; handlers with `On`
- [`name-avoid-abbreviations`](rules/name-avoid-abbreviations.md) - Avoid unclear abbreviations
- [`name-file-matches-type`](rules/name-file-matches-type.md) - Name a file after its single public type
- [`name-plural-collections`](rules/name-plural-collections.md) - Name collections with plural nouns

### 8. Type Safety & Nullability (MEDIUM/HIGH)

- [`type-nullable-reference-types`](rules/type-nullable-reference-types.md) - Enable nullable reference types
- [`type-pattern-matching-is`](rules/type-pattern-matching-is.md) - Use pattern matching over type-casting chains
- [`type-switch-expression-exhaustive`](rules/type-switch-expression-exhaustive.md) - Exhaustive switch expressions
- [`type-avoid-dynamic`](rules/type-avoid-dynamic.md) - Avoid `dynamic`
- [`type-enum-design`](rules/type-enum-design.md) - Explicit enum values; `[Flags]` only when combinable
- [`type-nullable-value-types`](rules/type-nullable-value-types.md) - Use `T?` for optional value types
- [`type-notnullwhen-attributes`](rules/type-notnullwhen-attributes.md) - Annotate your own nullable-flow APIs
- [`type-record-for-equality`](rules/type-record-for-equality.md) - Use records instead of manual equality
- [`type-generic-math`](rules/type-generic-math.md) - Use generic math for numeric-agnostic algorithms
- [`type-avoid-object-typed`](rules/type-avoid-object-typed.md) - Avoid `object`-typed APIs
- [`type-strongly-typed-ids`](rules/type-strongly-typed-ids.md) - Wrap primitive IDs in strongly-typed structs
- [`type-null-forgiving-sparingly`](rules/type-null-forgiving-sparingly.md) - Use `!` sparingly, with justification

### 9. Dependency Injection & Configuration (MEDIUM)

- [`di-constructor-injection`](rules/di-constructor-injection.md) - Prefer constructor injection
- [`di-lifetime-choice`](rules/di-lifetime-choice.md) - Choose Singleton/Scoped/Transient deliberately
- [`di-avoid-captive-dependency`](rules/di-avoid-captive-dependency.md) - Avoid captive dependencies
- [`di-options-pattern`](rules/di-options-pattern.md) - Use the Options pattern for configuration
- [`di-avoid-service-locator`](rules/di-avoid-service-locator.md) - Avoid the service-locator anti-pattern
- [`di-register-interfaces`](rules/di-register-interfaces.md) - Register interfaces, not concrete implementations
- [`di-validate-on-start`](rules/di-validate-on-start.md) - Validate the DI graph eagerly at startup
- [`di-httpclientfactory`](rules/di-httpclientfactory.md) - Use `IHttpClientFactory`
- [`di-keyed-services`](rules/di-keyed-services.md) - Use keyed DI services for multiple implementations
- [`di-avoid-property-injection`](rules/di-avoid-property-injection.md) - Avoid property/method injection

### 10. Testing (MEDIUM)

- [`test-xunit-theory-inlinedata`](rules/test-xunit-theory-inlinedata.md) - Use `[Theory]`/`[InlineData]`
- [`test-arrange-act-assert`](rules/test-arrange-act-assert.md) - Structure tests as Arrange/Act/Assert
- [`test-fluentassertions`](rules/test-fluentassertions.md) - Use FluentAssertions for readable assertions
- [`test-mock-interfaces-not-concretes`](rules/test-mock-interfaces-not-concretes.md) - Mock interfaces, not concretes
- [`test-nsubstitute-moq`](rules/test-nsubstitute-moq.md) - Use NSubstitute/Moq for isolation
- [`test-descriptive-test-names`](rules/test-descriptive-test-names.md) - Name tests descriptively
- [`test-webapplicationfactory-integration`](rules/test-webapplicationfactory-integration.md) - Use `WebApplicationFactory<T>`
- [`test-avoid-shared-mutable-state`](rules/test-avoid-shared-mutable-state.md) - Avoid shared mutable state across tests
- [`test-collection-fixture`](rules/test-collection-fixture.md) - Use fixtures for expensive shared setup
- [`test-avoid-thread-sleep`](rules/test-avoid-thread-sleep.md) - Never use `Thread.Sleep` to synchronize tests
- [`test-testcontainers-integration`](rules/test-testcontainers-integration.md) - Use Testcontainers for real dependencies
- [`test-one-assert-concept`](rules/test-one-assert-concept.md) - Test one logical concept per test method
- [`test-avoid-testing-private`](rules/test-avoid-testing-private.md) - Test through the public API

### 11. Documentation (MEDIUM)

- [`doc-xml-summary-public`](rules/doc-xml-summary-public.md) - Document all public members with `<summary>`
- [`doc-param-returns-tags`](rules/doc-param-returns-tags.md) - Document parameters and return values
- [`doc-exception-tags`](rules/doc-exception-tags.md) - Document exceptions with `<exception>`
- [`doc-example-code`](rules/doc-example-code.md) - Include `<example>`/`<code>` for non-obvious APIs
- [`doc-generate-xml-docfile`](rules/doc-generate-xml-docfile.md) - Enable `GenerateDocumentationFile`
- [`doc-see-cref-links`](rules/doc-see-cref-links.md) - Cross-reference with `<see cref="..."/>`
- [`doc-remarks-for-nuance`](rules/doc-remarks-for-nuance.md) - Use `<remarks>` for nuance/caveats
- [`doc-inheritdoc`](rules/doc-inheritdoc.md) - Use `<inheritdoc/>` to avoid duplication
- [`doc-readme-nuget-metadata`](rules/doc-readme-nuget-metadata.md) - Fill NuGet package metadata

### 12. Performance Patterns (MEDIUM)

- [`perf-stringbuilder-concat`](rules/perf-stringbuilder-concat.md) - Use `StringBuilder` for loop concatenation
- [`perf-string-interpolation-vs-concat`](rules/perf-string-interpolation-vs-concat.md) - Know how interpolation compiles
- [`perf-span-parsing`](rules/perf-span-parsing.md) - Parse with `Span<T>` to avoid substring allocations
- [`perf-source-generators-over-reflection`](rules/perf-source-generators-over-reflection.md) - Source generators over reflection
- [`perf-record-struct-hot-data`](rules/perf-record-struct-hot-data.md) - `record struct` for small, hot data
- [`perf-avoid-linq-hot-path`](rules/perf-avoid-linq-hot-path.md) - Avoid LINQ in proven hot paths
- [`perf-cache-regex`](rules/perf-cache-regex.md) - Compile/cache `Regex`, or use `[GeneratedRegex]`
- [`perf-frozen-lookup-startup`](rules/perf-frozen-lookup-startup.md) - Frozen collections for startup-built lookups
- [`perf-value-task-hot-path`](rules/perf-value-task-hot-path.md) - Return `ValueTask` from hot async methods
- [`perf-string-comparison-ordinal`](rules/perf-string-comparison-ordinal.md) - Use `StringComparison.Ordinal`
- [`perf-avoid-unnecessary-async-state-machine`](rules/perf-avoid-unnecessary-async-state-machine.md) - Avoid needless async state machines
- [`perf-json-source-gen`](rules/perf-json-source-gen.md) - Use `System.Text.Json` source generation

### 13. Project Structure (LOW)

- [`proj-directory-build-props`](rules/proj-directory-build-props.md) - Centralize settings in `Directory.Build.props`
- [`proj-central-package-management`](rules/proj-central-package-management.md) - Central package management
- [`proj-solution-folder-layout`](rules/proj-solution-folder-layout.md) - Organize solution folders by layer
- [`proj-internal-visibility`](rules/proj-internal-visibility.md) - Default to `internal` visibility
- [`proj-internalsvisibleto-tests`](rules/proj-internalsvisibleto-tests.md) - Expose internals to tests via `InternalsVisibleTo`
- [`proj-nullable-enable-solution-wide`](rules/proj-nullable-enable-solution-wide.md) - Enable nullable solution-wide
- [`proj-namespace-folder-structure`](rules/proj-namespace-folder-structure.md) - Match namespaces to folders
- [`proj-separate-test-projects`](rules/proj-separate-test-projects.md) - Keep test projects separate
- [`proj-file-scoped-namespaces`](rules/proj-file-scoped-namespaces.md) - Use file-scoped namespaces
- [`proj-implicit-usings`](rules/proj-implicit-usings.md) - Use `ImplicitUsings` and `GlobalUsings.cs`

### 14. Analyzers & Linting (LOW)

- [`lint-treat-warnings-as-errors`](rules/lint-treat-warnings-as-errors.md) - Enable `TreatWarningsAsErrors` in CI
- [`lint-nullable-warnings-errors`](rules/lint-nullable-warnings-errors.md) - Promote nullable warnings to errors
- [`lint-editorconfig-enforce`](rules/lint-editorconfig-enforce.md) - Enforce style with `.editorconfig`
- [`lint-roslyn-analyzers`](rules/lint-roslyn-analyzers.md) - Enable `Microsoft.CodeAnalysis.NetAnalyzers`
- [`lint-stylecop-analyzers`](rules/lint-stylecop-analyzers.md) - Use StyleCop.Analyzers
- [`lint-code-analysis-enforce-latest`](rules/lint-code-analysis-enforce-latest.md) - Set `AnalysisLevel` to `latest`
- [`lint-format-verify-ci`](rules/lint-format-verify-ci.md) - Run `dotnet format --verify-no-changes` in CI
- [`lint-suppress-with-justification`](rules/lint-suppress-with-justification.md) - Justify every suppression
- [`lint-banned-api-analyzer`](rules/lint-banned-api-analyzer.md) - Ban dangerous APIs at compile time
- [`lint-nuget-audit`](rules/lint-nuget-audit.md) - Enable `NuGetAudit` for vulnerable packages

### 15. Anti-patterns (REFERENCE)

- [`anti-async-void`](rules/anti-async-void.md) - Don't use `async void` outside event handlers
- [`anti-sync-over-async`](rules/anti-sync-over-async.md) - Don't block on async with `.Result`/`.Wait()`
- [`anti-catch-exception-broad`](rules/anti-catch-exception-broad.md) - Don't catch `Exception` broadly
- [`anti-empty-catch-block`](rules/anti-empty-catch-block.md) - Don't leave empty catch blocks
- [`anti-god-class`](rules/anti-god-class.md) - Don't build God classes
- [`anti-magic-strings-numbers`](rules/anti-magic-strings-numbers.md) - Don't scatter magic strings/numbers
- [`anti-mutable-public-fields`](rules/anti-mutable-public-fields.md) - Don't expose mutable public fields
- [`anti-linq-multiple-enumeration`](rules/anti-linq-multiple-enumeration.md) - Don't enumerate a query multiple times
- [`anti-over-mocking`](rules/anti-over-mocking.md) - Don't over-mock
- [`anti-primitive-obsession`](rules/anti-primitive-obsession.md) - Don't pass primitive swarms instead of types
- [`anti-throw-ex-loses-stack`](rules/anti-throw-ex-loses-stack.md) - Don't use `throw ex;`
- [`anti-datetime-now-untestable`](rules/anti-datetime-now-untestable.md) - Don't call `DateTime.Now` directly
- [`anti-singleton-static-state`](rules/anti-singleton-static-state.md) - Don't hide dependencies behind statics
- [`anti-boxing-generic-collections`](rules/anti-boxing-generic-collections.md) - Don't box into non-generic collections
- [`anti-region-abuse`](rules/anti-region-abuse.md) - Don't use `#region` to hide poor organization

---

## Recommended `.csproj` / `Directory.Build.props` Settings

```xml
<!-- Directory.Build.props (repository root) -->
<Project>
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <LangVersion>latest</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <AnalysisLevel>latest</AnalysisLevel>
    <AnalysisMode>Recommended</AnalysisMode>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
    <NuGetAudit>true</NuGetAudit>
    <NuGetAuditMode>all</NuGetAuditMode>
  </PropertyGroup>
</Project>
```

```xml
<!-- Directory.Packages.props (repository root) -->
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
</Project>
```

```ini
# .editorconfig
root = true

[*.cs]
indent_style = space
indent_size = 4
csharp_style_namespace_declarations = file_scoped:warning
dotnet_style_namespace_match_folder = true:warning
dotnet_style_require_accessibility_modifiers = always:warning
dotnet_diagnostic.CA2007.severity = warning  # ConfigureAwait(false) in libraries
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing C#/.NET code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New class/method | `api-`, `err-`, `name-` |
| New record/DTO | `immut-`, `api-`, `type-` |
| Async code | `async-`, `mem-` |
| Error handling | `err-`, `api-` |
| Memory optimization | `mem-`, `perf-` |
| LINQ/collections | `linq-`, `perf-` |
| Dependency injection | `di-` |
| Writing tests | `test-` |
| Performance tuning | `perf-`, `mem-`, `linq-` |
| Code review | `anti-`, `lint-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) - choosing and implementing GoF and idiomatic patterns; apply alongside this skill's API and naming rules for pattern-heavy C# design.
- [security-review](../security-review/SKILL.md) - security-focused audit checklists; apply alongside this skill's error-handling and interop rules when reviewing C# code for vulnerabilities.

## Sources

This skill synthesizes best practices from:
- [Microsoft C# Coding Conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- [.NET Framework Design Guidelines](https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/) (Cwalina & Abrams)
- [.NET Naming Guidelines](https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/naming-guidelines)
- [What's New in C#](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/) (C# 12/13 language reference)
- `dotnet/roslyn-analyzers` and `dotnet/runtime` source and analyzer documentation
- Production codebases: `dotnet/runtime`, `dotnet/aspnetcore`, `dotnet/efcore`
- Community conventions and tooling (StyleCop.Analyzers, xUnit, FluentAssertions, Testcontainers) (2024-2025)
