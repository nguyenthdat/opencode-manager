---
name: swift-coding
description: "Comprehensive idiomatic Swift guidance: 164 prioritized rules across 14 categories plus Swift 6 language-mode migration. Use when writing, reviewing, refactoring, optimizing, or debugging Swift (`.swift`, `Package.swift`, Xcode targets), including Swift Concurrency, SwiftUI state management, and Objective-C interop. Preserve the target project's declared Swift tools version and concurrency mode; use Swift 6 strict-concurrency, typed-throws, macro, and `~Copyable` guidance only when the project targets that language mode."
compatibility: opencode
metadata:
  domain: swift
  audience: software-engineer
  edition: project-declared
---

# Swift Best Practices

Comprehensive guide for writing high-quality, idiomatic Swift code. Contains 164 rules across 14 categories, prioritized by impact. Project constraints override generic defaults: preserve the declared Swift tools version, minimum deployment target, and concurrency-checking mode unless the user explicitly requests a migration.

## When to Apply

Reference these guidelines when:
- Writing new Swift types, functions, or modules
- Implementing error handling or Swift Concurrency (`async`/`await`, actors, tasks)
- Designing public APIs for a Swift package or framework
- Building or reviewing SwiftUI views and state management
- Reviewing code for optional-safety, memory, or data-race issues
- Bridging to or from Objective-C
- Optimizing hot paths or reducing unnecessary allocations/bridging
- Refactoring existing Swift code
- Migrating a target to Swift 6 language mode / strict concurrency checking

## Swift 6 Language Mode

Swift 6 language mode is stable since Swift 6.0 (Xcode 16 / late 2024) and is opt-in per target. For an existing target, preserve its declared Swift language mode and minimum deployment target unless migration is in scope. For a new target, prefer Swift 6 mode when the toolchain and platform minimums support it, and enable strict concurrency checking rather than leaving code in the implicit Swift 5 default:

```swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MyLibrary",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "MyLibrary", targets: ["MyLibrary"])],
    targets: [
        .target(
            name: "MyLibrary",
            swiftSettings: [
                .swiftLanguageMode(.v6),
                .enableUpcomingFeature("StrictConcurrency")
            ]
        )
    ]
)
```

Migrate incrementally with `-strict-concurrency=targeted` then `=complete` before flipping the language mode, and resolve every `Sendable`/isolation diagnostic rather than suppressing it with `@unchecked Sendable` or `@preconcurrency` unless that boundary is genuinely third-party and unaudited. Key current-generation features to apply in new and migrated code:

- **Data-race safety by default.** Swift 6 mode makes the compiler enforce actor isolation and `Sendable` conformance at compile time; code that compiles under Swift 5 mode may need explicit isolation or `Sendable` conformances added.
- **Typed throws.** Functions can declare `throws(SpecificError)` instead of the untyped `throws`, giving callers exact, exhaustive error types without `catch let error as SpecificError` guessing.
- **`~Copyable` (noncopyable) types and generics.** Use `~Copyable` structs/enums to model unique ownership (file handles, locks, tokens) that must never be implicitly duplicated, and noncopyable generics to write containers over them.
- **Macros.** `@Observable`, `@Model` (SwiftData), and custom macros (`#Preview`, freestanding/attached macros via `SwiftSyntax`) replace boilerplate that previously required manual protocol conformances or code generation.
- **`if`/`switch` as expressions.** Single-`return`/single-assignment branches can be written as expressions: `let x = if condition { a } else { b }`.
- **Swift Testing (`@Test`, `#expect`, `#require`).** The new testing framework is the default for new test targets; XCTest remains fully supported for existing suites and UI tests.
- **Non-isolated `async` and improved `Sendable` inference.** Global-actor and closure isolation inference is more precise; fewer explicit `@Sendable` annotations are required in Swift 6 mode, but existing code often still needs them for clarity.

For the authoritative, complete list, consult the official Swift Programming Language guide ("Concurrency" chapter) and the Swift Evolution proposals for each feature. Everything below applies across language modes; prefer the Swift 6 forms above where they differ from Swift 5 defaults.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Optionals & Type Safety | CRITICAL | `type-` | 12 |
| 2 | Error Handling | CRITICAL | `err-` | 13 |
| 3 | Swift Concurrency | CRITICAL | `async-` | 16 |
| 4 | Memory Management | CRITICAL | `mem-` | 12 |
| 5 | API & Type Design | HIGH | `api-` | 15 |
| 6 | SwiftUI & State Management | HIGH | `ui-` | 10 |
| 7 | Naming Conventions | MEDIUM | `name-` | 12 |
| 8 | Testing | MEDIUM | `test-` | 12 |
| 9 | Documentation | MEDIUM | `doc-` | 9 |
| 10 | Performance Patterns | MEDIUM | `perf-` | 11 |
| 11 | Objective-C Interop | MEDIUM | `interop-` | 8 |
| 12 | Project Structure | LOW | `proj-` | 10 |
| 13 | Linting & Tooling | LOW | `lint-` | 9 |
| 14 | Anti-patterns | REFERENCE | `anti-` | 15 |

---

## Quick Reference

### 1. Optionals & Type Safety (CRITICAL)

- [`type-guard-let-early`](rules/type-guard-let-early.md) - Use `guard let` for early-exit unwrapping
- [`type-if-let-narrow`](rules/type-if-let-narrow.md) - Use `if let` to narrow optional scope locally
- [`type-nil-coalescing`](rules/type-nil-coalescing.md) - Use `??` for default values instead of force unwrap
- [`type-optional-chaining`](rules/type-optional-chaining.md) - Use optional chaining `?.` instead of nested `if`s
- [`type-no-force-unwrap`](rules/type-no-force-unwrap.md) - Avoid `!` force unwrap outside tests/proven invariants
- [`type-iuo-boundary-only`](rules/type-iuo-boundary-only.md) - Restrict implicitly unwrapped optionals to init/outlet boundaries
- [`type-enum-associated-values`](rules/type-enum-associated-values.md) - Model closed state with `enum` + associated values, not parallel optionals
- [`type-optional-map-flatmap`](rules/type-optional-map-flatmap.md) - Use `map`/`flatMap`/`compactMap` to transform optionals
- [`type-multi-optional-binding`](rules/type-multi-optional-binding.md) - Combine multiple bindings in a single `if let`/`guard let`
- [`type-optional-pattern-match`](rules/type-optional-pattern-match.md) - Use `case let x?`/`switch` pattern matching for optionals
- [`type-non-optional-default`](rules/type-non-optional-default.md) - Prefer non-optional properties with sensible defaults over optionals
- [`type-as-safe-cast`](rules/type-as-safe-cast.md) - Use `as?` safe casting, not `as!` force cast

### 2. Error Handling (CRITICAL)

- [`err-enum-error-type`](rules/err-enum-error-type.md) - Define custom `Error` types as enums with associated values
- [`err-throws-try-propagate`](rules/err-throws-try-propagate.md) - Use `throws`/`try` to propagate recoverable errors
- [`err-typed-throws`](rules/err-typed-throws.md) - Use typed throws (`throws(MyError)`) for precise error contracts
- [`err-result-async-deferred`](rules/err-result-async-deferred.md) - Use `Result<Success, Failure>` for deferred/stored outcomes
- [`err-no-force-try`](rules/err-no-force-try.md) - Avoid `try!` outside proven-safe/test contexts
- [`err-try-optional-sparingly`](rules/err-try-optional-sparingly.md) - Use `try?` only when the failure reason is irrelevant
- [`err-defer-cleanup`](rules/err-defer-cleanup.md) - Use `defer` for guaranteed cleanup
- [`err-localized-error`](rules/err-localized-error.md) - Conform errors to `LocalizedError` for user-facing messages
- [`err-do-catch-specific`](rules/err-do-catch-specific.md) - Catch specific error cases before a generic fallback
- [`err-error-context`](rules/err-error-context.md) - Attach context to errors instead of throwing bare cases
- [`err-never-swallow`](rules/err-never-swallow.md) - Never silently discard errors in empty `catch` blocks
- [`err-precondition-fatal`](rules/err-precondition-fatal.md) - Use `precondition`/`fatalError` only for programmer errors
- [`err-rethrows-generic`](rules/err-rethrows-generic.md) - Use `rethrows` for higher-order functions forwarding closure errors

### 3. Swift Concurrency (CRITICAL)

- [`async-await-over-completion`](rules/async-await-over-completion.md) - Prefer `async`/`await` over completion-handler callbacks
- [`async-structured-taskgroup`](rules/async-structured-taskgroup.md) - Use `TaskGroup`/`withThrowingTaskGroup` for structured concurrency
- [`async-let-parallel`](rules/async-let-parallel.md) - Use `async let` for parallel independent work
- [`async-actor-isolated-state`](rules/async-actor-isolated-state.md) - Use `actor` to isolate mutable shared state
- [`async-sendable-conformance`](rules/async-sendable-conformance.md) - Conform cross-task types to `Sendable`
- [`async-mainactor-ui`](rules/async-mainactor-ui.md) - Mark UI-touching code `@MainActor`
- [`async-task-cancellation-check`](rules/async-task-cancellation-check.md) - Check `Task.isCancelled`/`Task.checkCancellation()` in long work
- [`async-task-cancel-cleanup`](rules/async-task-cancel-cleanup.md) - Cancel tasks explicitly and clean up in `deinit`
- [`async-no-blocking-in-async`](rules/async-no-blocking-in-async.md) - Never call blocking APIs inside `async` functions
- [`async-actor-reentrancy`](rules/async-actor-reentrancy.md) - Design actor methods for reentrancy safety across awaits
- [`async-global-actor-custom`](rules/async-global-actor-custom.md) - Use custom global actors for cross-type isolation domains
- [`async-continuation-bridge`](rules/async-continuation-bridge.md) - Use `withCheckedContinuation` to bridge legacy callback APIs
- [`async-unstructured-task-scope`](rules/async-unstructured-task-scope.md) - Scope unstructured `Task {}` explicitly; avoid detached leaks
- [`async-nonisolated-pure`](rules/async-nonisolated-pure.md) - Mark side-effect-free actor members `nonisolated`
- [`async-sendable-closures`](rules/async-sendable-closures.md) - Ensure closures crossing actor boundaries are `@Sendable`
- [`async-strict-concurrency-migration`](rules/async-strict-concurrency-migration.md) - Migrate incrementally under strict concurrency checking

### 4. Memory Management (CRITICAL)

- [`mem-weak-self-closure`](rules/mem-weak-self-closure.md) - Capture `[weak self]` in escaping closures to avoid retain cycles
- [`mem-unowned-non-optional`](rules/mem-unowned-non-optional.md) - Use `unowned` only when lifetime is guaranteed non-nil
- [`mem-struct-value-semantics`](rules/mem-struct-value-semantics.md) - Prefer `struct`/`enum` value types over `class` by default
- [`mem-class-when-identity`](rules/mem-class-when-identity.md) - Use `class` only when reference identity or shared mutation is required
- [`mem-weak-delegate`](rules/mem-weak-delegate.md) - Mark delegate properties `weak` to avoid owner cycles
- [`mem-capture-list-explicit`](rules/mem-capture-list-explicit.md) - Use explicit capture lists to document ownership intent
- [`mem-noncopyable-resource`](rules/mem-noncopyable-resource.md) - Use `~Copyable` types to enforce single ownership of resources
- [`mem-cow-custom-collection`](rules/mem-cow-custom-collection.md) - Implement copy-on-write for custom value-type collections
- [`mem-final-class-default`](rules/mem-final-class-default.md) - Mark classes `final` unless designed for subclassing
- [`mem-avoid-retain-cycle-timer`](rules/mem-avoid-retain-cycle-timer.md) - Break Timer/NotificationCenter observer retain cycles
- [`mem-lazy-var-init`](rules/mem-lazy-var-init.md) - Use `lazy var` to defer expensive/circular initialization
- [`mem-deinit-verify`](rules/mem-deinit-verify.md) - Verify deinitialization with logging/tests for lifecycle-critical types

### 5. API & Type Design (HIGH)

- [`api-protocol-oriented`](rules/api-protocol-oriented.md) - Design around protocols, not base classes
- [`api-protocol-extension-default`](rules/api-protocol-extension-default.md) - Provide default implementations via protocol extensions
- [`api-struct-over-class-default`](rules/api-struct-over-class-default.md) - Default to `struct`; justify `class` explicitly
- [`api-property-wrapper-reuse`](rules/api-property-wrapper-reuse.md) - Use property wrappers to encapsulate reusable behavior
- [`api-result-builder-dsl`](rules/api-result-builder-dsl.md) - Use result builders for declarative DSLs
- [`api-access-control-minimal`](rules/api-access-control-minimal.md) - Default to the narrowest access level that works
- [`api-protocol-associated-type`](rules/api-protocol-associated-type.md) - Use associated types for protocol-level generic contracts
- [`api-existential-any`](rules/api-existential-any.md) - Mark existential protocol types with explicit `any`
- [`api-composition-over-inheritance`](rules/api-composition-over-inheritance.md) - Compose protocols/structs instead of deep class hierarchies
- [`api-argument-labels-clarity`](rules/api-argument-labels-clarity.md) - Design argument labels for call-site clarity
- [`api-default-parameter-values`](rules/api-default-parameter-values.md) - Use default parameter values instead of overloads
- [`api-equatable-hashable-derive`](rules/api-equatable-hashable-derive.md) - Derive `Equatable`/`Hashable` instead of hand-rolling
- [`api-codable-conformance`](rules/api-codable-conformance.md) - Conform models to `Codable` for serialization boundaries
- [`api-immutable-by-default`](rules/api-immutable-by-default.md) - Default to `let` and immutable structs; opt into `var` deliberately
- [`api-extension-organize`](rules/api-extension-organize.md) - Use extensions to organize protocol conformances

### 6. SwiftUI & State Management (HIGH)

- [`ui-state-source-of-truth`](rules/ui-state-source-of-truth.md) - Keep a single source of truth with `@State`/`@Observable`
- [`ui-observable-macro`](rules/ui-observable-macro.md) - Use the `@Observable` macro over legacy `ObservableObject` for new code
- [`ui-binding-two-way`](rules/ui-binding-two-way.md) - Use `@Binding` for child-to-parent two-way state
- [`ui-environment-dependency`](rules/ui-environment-dependency.md) - Use `@Environment`/`@EnvironmentObject` for ambient dependencies
- [`ui-view-small-composable`](rules/ui-view-small-composable.md) - Keep views small and composable; extract subviews
- [`ui-no-business-logic-in-view`](rules/ui-no-business-logic-in-view.md) - Keep business logic out of `View` bodies; delegate to models
- [`ui-identifiable-list-data`](rules/ui-identifiable-list-data.md) - Conform list data to `Identifiable` instead of using indices
- [`ui-task-modifier-async`](rules/ui-task-modifier-async.md) - Use the `.task {}` modifier for view-lifecycle-scoped async work
- [`ui-avoid-massive-view`](rules/ui-avoid-massive-view.md) - Avoid Massive View/View Controller by extracting view models
- [`ui-preview-provider`](rules/ui-preview-provider.md) - Provide `#Preview` for every non-trivial view

### 7. Naming Conventions (MEDIUM)

- [`name-clarity-call-site`](rules/name-clarity-call-site.md) - Prioritize clarity at the point of use over brevity
- [`name-type-upper-camel`](rules/name-type-upper-camel.md) - Use `UpperCamelCase` for types and protocols
- [`name-func-lower-camel`](rules/name-func-lower-camel.md) - Use `lowerCamelCase` for functions, methods, and properties
- [`name-factory-make-prefix`](rules/name-factory-make-prefix.md) - Prefix factory methods with `make` when returning a new instance
- [`name-boolean-assertive`](rules/name-boolean-assertive.md) - Name Booleans and predicates assertively (`isEmpty`, `hasSuffix`)
- [`name-mutating-ed-pairs`](rules/name-mutating-ed-pairs.md) - Pair mutating/non-mutating verbs (`sort`/`sorted`)
- [`name-preposition-role`](rules/name-preposition-role.md) - Use prepositional argument labels to clarify parameter role
- [`name-avoid-abbreviation`](rules/name-avoid-abbreviation.md) - Avoid unclear abbreviations; spell out words
- [`name-protocol-capability-suffix`](rules/name-protocol-capability-suffix.md) - Suffix capability protocols with `-able`/`-ible`/`-ing`
- [`name-generic-placeholder`](rules/name-generic-placeholder.md) - Use single-letter generics for simple cases, descriptive names otherwise
- [`name-avoid-hungarian-ns`](rules/name-avoid-hungarian-ns.md) - Avoid Hungarian-style type prefixes and gratuitous `NS`-cargo-culting
- [`name-acronym-consistent-case`](rules/name-acronym-consistent-case.md) - Treat acronyms consistently per Swift convention (`URL`, `id`)

### 8. Testing (MEDIUM)

- [`test-swift-testing-macro`](rules/test-swift-testing-macro.md) - Use the `@Test` macro (Swift Testing) for new test suites
- [`test-xctest-legacy`](rules/test-xctest-legacy.md) - Use XCTest conventions for existing suites and UI tests
- [`test-async-test-function`](rules/test-async-test-function.md) - Write `async throws` test functions for concurrency code
- [`test-protocol-mock-injection`](rules/test-protocol-mock-injection.md) - Inject dependencies via protocols to enable mocking
- [`test-arrange-act-assert-swift`](rules/test-arrange-act-assert-swift.md) - Structure tests as arrange/act/assert
- [`test-expectation-parameterized`](rules/test-expectation-parameterized.md) - Use `@Test(arguments:)` for parameterized tests
- [`test-confirmation-async-events`](rules/test-confirmation-async-events.md) - Use `Confirmation`/expectations for async event verification
- [`test-snapshot-testing`](rules/test-snapshot-testing.md) - Use snapshot testing for view/output regression coverage
- [`test-descriptive-test-names`](rules/test-descriptive-test-names.md) - Name tests descriptively with `@Test("description")`
- [`test-uitest-separate-target`](rules/test-uitest-separate-target.md) - Keep UI tests in a separate XCUITest target from unit tests
- [`test-fixture-setup-teardown`](rules/test-fixture-setup-teardown.md) - Use `init`/`deinit` or `setUp`/`tearDown` for fixture lifecycle
- [`test-avoid-force-unwrap-tests`](rules/test-avoid-force-unwrap-tests.md) - Even in tests, prefer `#require`/`XCTUnwrap` over force unwrap

### 9. Documentation (MEDIUM)

- [`doc-triple-slash-summary`](rules/doc-triple-slash-summary.md) - Start `///` docs with a one-line summary
- [`doc-docc-parameters`](rules/doc-docc-parameters.md) - Document parameters with DocC `- Parameter`/`- Parameters`
- [`doc-docc-returns`](rules/doc-docc-returns.md) - Document return values with `- Returns`
- [`doc-docc-throws`](rules/doc-docc-throws.md) - Document thrown errors with `- Throws`
- [`doc-docc-articles`](rules/doc-docc-articles.md) - Use DocC articles/tutorials for conceptual documentation
- [`doc-code-listing-example`](rules/doc-code-listing-example.md) - Include runnable code examples in doc comments
- [`doc-mark-organize`](rules/doc-mark-organize.md) - Use `// MARK: -` to organize file sections
- [`doc-public-api-required`](rules/doc-public-api-required.md) - Document all public API surface
- [`doc-link-symbols`](rules/doc-link-symbols.md) - Cross-link related symbols with DocC double-backtick links

### 10. Performance Patterns (MEDIUM)

- [`perf-value-type-copy-cost`](rules/perf-value-type-copy-cost.md) - Be aware of copy cost for large value types; consider indirection
- [`perf-reserve-capacity`](rules/perf-reserve-capacity.md) - Use `reserveCapacity` when the final collection size is known
- [`perf-avoid-bridging-overhead`](rules/perf-avoid-bridging-overhead.md) - Avoid unnecessary Swift/Foundation/NSObject bridging
- [`perf-lazy-sequence`](rules/perf-lazy-sequence.md) - Use `lazy` sequences to avoid intermediate allocations
- [`perf-avoid-existential-boxing`](rules/perf-avoid-existential-boxing.md) - Avoid excessive `any` existential boxing in hot paths
- [`perf-contiguous-array`](rules/perf-contiguous-array.md) - Use `ContiguousArray` for performance-critical non-bridged storage
- [`perf-avoid-string-concat-loop`](rules/perf-avoid-string-concat-loop.md) - Avoid repeated `String` concatenation in loops
- [`perf-indirect-enum-large`](rules/perf-indirect-enum-large.md) - Mark large recursive enum cases `indirect` to bound size
- [`perf-first-index-vs-filter`](rules/perf-first-index-vs-filter.md) - Use `first(where:)` instead of `filter().first`
- [`perf-inline-hot-path`](rules/perf-inline-hot-path.md) - Use `@inline(__always)`/`@inlinable` sparingly for verified hot paths
- [`perf-profile-instruments`](rules/perf-profile-instruments.md) - Profile with Instruments before optimizing

### 11. Objective-C Interop (MEDIUM)

- [`interop-objc-expose-minimal`](rules/interop-objc-expose-minimal.md) - Expose only what's needed with `@objc`/`@objcMembers`
- [`interop-nullability-annotations`](rules/interop-nullability-annotations.md) - Annotate Objective-C headers with `nullable`/`nonnull`
- [`interop-bridging-header-minimal`](rules/interop-bridging-header-minimal.md) - Keep bridging headers minimal and organized
- [`interop-avoid-force-cast-anyobject`](rules/interop-avoid-force-cast-anyobject.md) - Avoid force-casting bridged `Any`/`AnyObject` results
- [`interop-ns-error-domain`](rules/interop-ns-error-domain.md) - Map `NSError` domains/codes to typed Swift errors
- [`interop-objc-selector-safe`](rules/interop-objc-selector-safe.md) - Use `#selector` for compile-time-checked selectors
- [`interop-foundation-value-types`](rules/interop-foundation-value-types.md) - Prefer Swift native value types over `NS*` counterparts when possible
- [`interop-objc-enum-bridging`](rules/interop-objc-enum-bridging.md) - Bridge `NS_ENUM`/`NS_OPTIONS` to Swift enums/option sets correctly

### 12. Project Structure (LOW)

- [`proj-spm-module-boundaries`](rules/proj-spm-module-boundaries.md) - Use Swift Package Manager targets for module boundaries
- [`proj-extension-per-file`](rules/proj-extension-per-file.md) - Split large types into per-conformance extension files
- [`proj-feature-folder-organize`](rules/proj-feature-folder-organize.md) - Organize source by feature, not by type
- [`proj-package-swift-tools-version`](rules/proj-package-swift-tools-version.md) - Declare accurate `swift-tools-version` and platforms
- [`proj-internal-by-default`](rules/proj-internal-by-default.md) - Default new package types to `internal`; opt into `public` deliberately
- [`proj-resource-bundle`](rules/proj-resource-bundle.md) - Use SPM resource bundles for assets instead of ad hoc paths
- [`proj-plugin-build-tool`](rules/proj-plugin-build-tool.md) - Use SPM build tool plugins for codegen instead of manual scripts
- [`proj-target-test-mirror`](rules/proj-target-test-mirror.md) - Mirror test targets 1:1 with library targets
- [`proj-flat-small-package`](rules/proj-flat-small-package.md) - Keep small packages flat; avoid premature module splitting
- [`proj-conditional-compilation-platform`](rules/proj-conditional-compilation-platform.md) - Use `#if os()`/`#if canImport()` for platform-conditional code

### 13. Linting & Tooling (LOW)

- [`lint-swiftlint-baseline`](rules/lint-swiftlint-baseline.md) - Adopt a SwiftLint baseline ruleset in CI
- [`lint-swiftformat-ci`](rules/lint-swiftformat-ci.md) - Run SwiftFormat/`swift format` in CI to enforce style
- [`lint-strict-concurrency-complete`](rules/lint-strict-concurrency-complete.md) - Set strict concurrency checking to `complete` for new targets
- [`lint-warnings-as-errors`](rules/lint-warnings-as-errors.md) - Treat warnings as errors in CI builds
- [`lint-force-unwrap-rule`](rules/lint-force-unwrap-rule.md) - Enable SwiftLint `force_unwrapping`/`force_try` rules
- [`lint-cyclomatic-complexity`](rules/lint-cyclomatic-complexity.md) - Enable complexity/type-body-length rules to catch God objects
- [`lint-unused-import`](rules/lint-unused-import.md) - Enable unused import/declaration detection
- [`lint-custom-rules-project`](rules/lint-custom-rules-project.md) - Define custom SwiftLint rules for project-specific conventions
- [`lint-analyze-build`](rules/lint-analyze-build.md) - Run static analyzer/sanitizer passes in CI

### 14. Anti-patterns (REFERENCE)

- [`anti-force-unwrap-abuse`](rules/anti-force-unwrap-abuse.md) - Don't force-unwrap optionals in production code
- [`anti-force-try-abuse`](rules/anti-force-try-abuse.md) - Don't force-try in production code
- [`anti-massive-view-controller`](rules/anti-massive-view-controller.md) - Don't build Massive View Controller/God objects
- [`anti-retain-cycle-closure`](rules/anti-retain-cycle-closure.md) - Don't capture `self` strongly in stored escaping closures
- [`anti-stringly-typed`](rules/anti-stringly-typed.md) - Don't model structured data as raw strings
- [`anti-any-overuse`](rules/anti-any-overuse.md) - Don't overuse `Any`/`AnyObject` where concrete types/generics fit
- [`anti-singleton-overuse`](rules/anti-singleton-overuse.md) - Don't reach for singletons as the default dependency access pattern
- [`anti-force-cast-abuse`](rules/anti-force-cast-abuse.md) - Don't force-cast (`as!`) instead of safe casting
- [`anti-implicitly-unwrapped-everywhere`](rules/anti-implicitly-unwrapped-everywhere.md) - Don't sprinkle implicitly unwrapped optionals broadly
- [`anti-blocking-main-thread`](rules/anti-blocking-main-thread.md) - Don't block the main thread with synchronous long work
- [`anti-data-race-unchecked`](rules/anti-data-race-unchecked.md) - Don't disable strict concurrency checking to silence real races
- [`anti-god-protocol`](rules/anti-god-protocol.md) - Don't design one giant protocol instead of composable smaller ones
- [`anti-nested-completion-handlers`](rules/anti-nested-completion-handlers.md) - Don't nest completion-handler pyramids; migrate to async/await
- [`anti-premature-optimization-swift`](rules/anti-premature-optimization-swift.md) - Don't optimize before profiling
- [`anti-empty-catch-swallow`](rules/anti-empty-catch-swallow.md) - Don't silently swallow errors in empty `catch` blocks

---

## Recommended Tooling Configuration

`Package.swift` (SPM manifest with Swift 6 mode and strict concurrency):

```swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MyLibrary",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "MyLibrary", targets: ["MyLibrary"])
    ],
    targets: [
        .target(
            name: "MyLibrary",
            swiftSettings: [
                .swiftLanguageMode(.v6),
                .enableUpcomingFeature("ExistentialAny")
            ]
        ),
        .testTarget(
            name: "MyLibraryTests",
            dependencies: ["MyLibrary"],
            swiftSettings: [.swiftLanguageMode(.v6)]
        )
    ]
)
```

`.swiftlint.yml` (baseline enforcement fragment):

```yaml
opt_in_rules:
  - force_unwrapping
  - force_try
  - implicitly_unwrapped_optional
  - empty_count
  - closure_spacing
  - unused_import
  - unneeded_synthesized_initializer

disabled_rules:
  - todo

analyzer_rules:
  - unused_declaration
  - unused_import

line_length:
  warning: 120
  error: 160

type_body_length:
  warning: 250
  error: 400

cyclomatic_complexity:
  warning: 12
  error: 20

excluded:
  - .build
  - Sources/Generated
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing Swift code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New function/type | `type-`, `err-`, `name-` |
| New public API/package | `api-`, `type-`, `doc-` |
| Concurrency code | `async-`, `mem-` |
| Error handling | `err-`, `api-` |
| SwiftUI view/state | `ui-`, `mem-` |
| Memory/ownership review | `mem-`, `async-` |
| Objective-C bridging | `interop-`, `type-` |
| Performance tuning | `perf-`, `mem-` |
| Code review | `anti-`, `lint-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) - language-agnostic GoF/architectural pattern selection covering Swift; prefer idiomatic native constructs (protocol-oriented design, `enum` state, composition over inheritance) before reaching for a named pattern.
- [security-review](../security-review/SKILL.md) - multi-language security/correctness review that already covers Swift (build detection, `Package.swift`, `swiftlint`/`swift test` tooling, and Objective-C bridging/unsafe-pointer bug classes). Use it for security audits and PR review of Swift code; use `swift-coding` for day-to-day authoring and idiom review.

## Sources

This skill synthesizes best practices from:
- [Swift API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/) (official)
- [The Swift Programming Language: Concurrency](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/concurrency/) (official)
- [Swift Evolution proposals](https://github.com/apple/swift-evolution) for typed throws, `~Copyable`, macros, and strict concurrency
- Point-Free's Swift talks and articles (dependency injection, testable architecture, `@Observable`/`Sendable` migration patterns)
- [SwiftLint rule documentation](https://realm.github.io/SwiftLint/rule-directory.html)
- Production codebases: swift-nio, vapor, swift-algorithms, swift-collections, and Apple's own open-source Swift libraries
- Community conventions (2024-2026)
