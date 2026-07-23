---
name: kotlin-coding
description: "Comprehensive idiomatic Kotlin guidance: 183 prioritized rules across 15 categories covering null safety, coroutines/Flow, API design, and Android-adjacent idioms. Use when writing, reviewing, refactoring, optimizing, or debugging Kotlin (`.kt`, `.kts`), Gradle Kotlin DSL build scripts, coroutines/Flow code, or Kotlin/Android and Kotlin/JVM interop. Preserve the target project's declared Kotlin/Gradle/AGP version and coroutine/Compose library versions; apply K2-compiler-only, context-parameter, and guard-condition guidance only when the project's toolchain supports them."
compatibility: opencode
metadata:
  domain: kotlin
  audience: software-engineer
  edition: project-declared
---

# Kotlin Best Practices

Comprehensive guide for writing high-quality, idiomatic Kotlin code across Kotlin/JVM, coroutines, and Android-adjacent surfaces. Contains 183 rules across 15 categories, prioritized by impact. Project constraints override generic defaults: preserve the declared Kotlin version, Gradle/AGP toolchain, `kotlinOptions`/`compilerOptions` settings, and supported target platforms (JVM, Android, Kotlin Multiplatform) unless the user explicitly requests a migration.

## When to Apply

Reference these guidelines when:
- Writing new Kotlin functions, classes, sealed hierarchies, or modules
- Implementing coroutines, structured concurrency, or `Flow`-based reactive code
- Designing public APIs for libraries or multi-module Gradle projects
- Reviewing code for null-safety gaps (`!!` abuse, leaking platform types, excessive nullable modeling)
- Optimizing allocations, boxing, or coroutine dispatcher overhead on hot paths
- Structuring a Gradle multi-module or Kotlin Multiplatform project
- Writing or reviewing tests (JUnit 5, Kotest, `kotlinx-coroutines-test`, MockK, Turbine)
- Working across Kotlin/Java interop boundaries
- Reviewing Android-adjacent code (`ViewModel`, `Flow` collection lifecycle, Compose state)

## Kotlin 2.0/2.1 & K2 Compiler Notes

Kotlin's K2 compiler became the default in Kotlin 2.0 and is the baseline for current guidance. Preserve a project's existing Kotlin/Gradle/AGP version and only apply the notes below when the declared toolchain actually supports them; verify with the project's `libs.versions.toml`/`build.gradle.kts` `kotlin` version before assuming a feature is available.

- **K2 compiler (2.0+, default).** Rewritten frontend with faster compilation, more consistent type inference across multi-platform code, and smart-cast improvements — see `type-smart-cast-val`. Most user-visible behavior is compatible; a handful of previously-accepted-but-unsound smart casts now correctly fail to compile.
- **Guard conditions in `when` (2.1+).** `when` branches over a sealed type can add an `if` guard on the same branch (`is Shape.Circle if circle.radius > 0 -> ...`) instead of nesting an inner `if`, keeping exhaustiveness checks intact — pairs with `type-sealed-when-exhaustive`.
- **`data object` (1.9+, current default for singleton sealed variants).** Gives `object` declarations a generated `toString()`/`equals()`/`hashCode()` so singleton branches of a sealed hierarchy behave consistently with `data class` siblings — see `type-data-object-singleton`.
- **Non-local `break`/`continue` in lambdas (2.1+).** Inline lambdas passed to functions like `forEach` can use `break`/`continue` against the nearest enclosing loop, reducing the need to rewrite loops as explicit `for` blocks purely to get flow-control statements.
- **Stable value classes / `@JvmInline value class`.** Multi-field value classes and value classes wrapping generic types have progressively stabilized; still confirm current constraints (mangled JVM signatures, boxing at generic/interface boundaries) before relying on zero-overhead behavior — see `type-value-class-wrapper` and `perf-avoid-boxing-primitives`.
- **Context receivers → context parameters.** Context receivers (`context(Foo)`) were an experimental K1/early-K2 feature; the language is converging on **context parameters** (`context(foo: Foo)`) as the stable successor. Treat both as opt-in/experimental until the project's Kotlin version documents them as stable, and prefer explicit parameters or receiver extension functions in stable public APIs today.
- **`kotlinx.coroutines` 1.8/1.9-era stability.** Structured concurrency, `Flow`, `StateFlow`/`SharedFlow`, and `Channel` are all long-stable — see the Coroutines and Flow categories below. `select {}` and some `Channel` factories remain marked experimental in places; check `@ExperimentalCoroutinesApi` opt-ins in the project before use.
- **Explicit API mode.** Libraries increasingly enable `explicitApi()` in `build.gradle.kts` to force every public declaration to state its visibility and return type explicitly — see `proj-explicit-api-mode`.

For the authoritative, complete list, consult the official Kotlin release notes (2.0 and 2.1 "What's New" pages) and the Kotlin Evolution/KEEP repository. Everything below applies across recent Kotlin versions; prefer the 2.0/2.1 forms above where a project's toolchain supports them.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Null Safety & Type System | CRITICAL | `type-` | 16 |
| 2 | Error Handling | CRITICAL | `err-` | 13 |
| 3 | Coroutines Fundamentals | CRITICAL | `async-` | 14 |
| 4 | Flow & Reactive Streams | HIGH | `flow-` | 12 |
| 5 | API/Class Design | HIGH | `api-` | 15 |
| 6 | Functional & Collection Patterns | HIGH | `fn-` | 14 |
| 7 | Naming Conventions | MEDIUM | `name-` | 12 |
| 8 | Testing | MEDIUM | `test-` | 13 |
| 9 | Documentation | MEDIUM | `doc-` | 9 |
| 10 | Performance Patterns | MEDIUM | `perf-` | 12 |
| 11 | Interop (Java/JVM) | MEDIUM | `interop-` | 10 |
| 12 | Android-Adjacent Idioms | MEDIUM | `android-` | 8 |
| 13 | Project Structure | LOW | `proj-` | 10 |
| 14 | Linting | LOW | `lint-` | 10 |
| 15 | Anti-patterns | REFERENCE | `anti-` | 15 |

---

## Quick Reference

### 1. Null Safety & Type System (CRITICAL)

- [`type-safe-call-operator`](rules/type-safe-call-operator.md) - Use `?.` safe calls instead of manual null checks
- [`type-elvis-default`](rules/type-elvis-default.md) - Use `?:` Elvis operator to supply defaults for nullable values
- [`type-avoid-not-null-assert`](rules/type-avoid-not-null-assert.md) - Avoid `!!`; prove non-null through control flow or types instead
- [`type-let-scope-nullable`](rules/type-let-scope-nullable.md) - Use `?.let { }` to scope work on a non-null value
- [`type-sealed-class-hierarchy`](rules/type-sealed-class-hierarchy.md) - Model closed hierarchies with `sealed class`/`sealed interface`
- [`type-sealed-when-exhaustive`](rules/type-sealed-when-exhaustive.md) - Pair sealed types with exhaustive `when` and no `else` branch
- [`type-data-class-value`](rules/type-data-class-value.md) - Use `data class` for types defined by their value
- [`type-value-class-wrapper`](rules/type-value-class-wrapper.md) - Use `value class` to wrap a primitive with zero runtime overhead
- [`type-smart-cast-val`](rules/type-smart-cast-val.md) - Prefer `val` and local variables so the compiler can smart-cast
- [`type-platform-type-annotate`](rules/type-platform-type-annotate.md) - Annotate Java interop boundaries so platform types don't leak
- [`type-lateinit-discipline`](rules/type-lateinit-discipline.md) - Use `lateinit var` only for framework-assigned, guaranteed-non-null properties
- [`type-nothing-return`](rules/type-nothing-return.md) - Use the `Nothing` type for functions that never return normally
- [`type-generic-variance`](rules/type-generic-variance.md) - Declare `out`/`in` variance so generic APIs are usable and safe
- [`type-star-projection`](rules/type-star-projection.md) - Use star-projection `<*>` only when the type argument is truly unknown
- [`type-data-object-singleton`](rules/type-data-object-singleton.md) - Use `data object` for singleton sealed variants
- [`type-companion-factory`](rules/type-companion-factory.md) - Use a `companion object` factory function instead of a public constructor when validation is required

### 2. Error Handling (CRITICAL)

- [`err-exceptions-for-exceptional`](rules/err-exceptions-for-exceptional.md) - Reserve exceptions for truly exceptional conditions, not routine control flow
- [`err-result-explicit-modeling`](rules/err-result-explicit-modeling.md) - Model expected, recoverable failure with a sealed `Result`-like type
- [`err-runcatching-pitfalls`](rules/err-runcatching-pitfalls.md) - Know that `runCatching` also catches `CancellationException`
- [`err-require-precondition`](rules/err-require-precondition.md) - Use `require()` to validate function arguments
- [`err-check-invariant`](rules/err-check-invariant.md) - Use `check()` to validate internal object/state invariants
- [`err-error-unreachable`](rules/err-error-unreachable.md) - Use `error()` to fail loudly on branches that must be unreachable
- [`err-custom-exception-hierarchy`](rules/err-custom-exception-hierarchy.md) - Build a custom sealed exception hierarchy for domain errors
- [`err-no-catch-generic-exception`](rules/err-no-catch-generic-exception.md) - Don't catch generic `Exception` or `Throwable`
- [`err-cause-chaining`](rules/err-cause-chaining.md) - Chain the original failure with the exception's `cause` parameter
- [`err-finally-cleanup`](rules/err-finally-cleanup.md) - Use `try`/`finally` or `Closeable.use { }` for deterministic cleanup
- [`err-nothing-to-propagate`](rules/err-nothing-to-propagate.md) - Let unexpected exceptions propagate instead of swallowing them
- [`err-kotlin-result-inline`](rules/err-kotlin-result-inline.md) - Use the stdlib `Result<T>` for simple, local fallible operations
- [`err-arrow-either-modeling`](rules/err-arrow-either-modeling.md) - Consider Arrow's `Either`/`Raise` for railway-oriented domain error handling

### 3. Coroutines Fundamentals (CRITICAL)

- [`async-structured-concurrency`](rules/async-structured-concurrency.md) - Follow structured concurrency: every coroutine has an owning scope
- [`async-coroutinescope-lifecycle`](rules/async-coroutinescope-lifecycle.md) - Tie a `CoroutineScope`'s lifetime to its owning component
- [`async-no-globalscope`](rules/async-no-globalscope.md) - Avoid `GlobalScope`; launch from a scoped, cancellable context
- [`async-dispatchers-choice`](rules/async-dispatchers-choice.md) - Choose `Dispatchers.Default`/`IO`/`Main` deliberately for the workload
- [`async-withcontext-switch`](rules/async-withcontext-switch.md) - Use `withContext` to switch dispatchers, not to launch new coroutines
- [`async-suspend-fun-design`](rules/async-suspend-fun-design.md) - Design `suspend` functions to be main-safe and cancellation-aware
- [`async-avoid-blocking-calls`](rules/async-avoid-blocking-calls.md) - Never run blocking I/O or CPU work on a coroutine without `withContext(Dispatchers.IO)`
- [`async-cancellation-cooperation`](rules/async-cancellation-cooperation.md) - Cooperate with cancellation by calling suspend functions or checking `isActive`
- [`async-supervisorjob-isolation`](rules/async-supervisorjob-isolation.md) - Use `SupervisorJob`/`supervisorScope` to isolate sibling coroutine failures
- [`async-coroutineexceptionhandler`](rules/async-coroutineexceptionhandler.md) - Install a `CoroutineExceptionHandler` on top-level scopes
- [`async-mutex-over-synchronized`](rules/async-mutex-over-synchronized.md) - Use `Mutex` instead of `synchronized`/JVM locks inside coroutines
- [`async-async-await-parallel`](rules/async-async-await-parallel.md) - Use `async`/`await` for parallel decomposition of independent work
- [`async-coroutinecontext-elements`](rules/async-coroutinecontext-elements.md) - Use `CoroutineContext` elements like `CoroutineName` for structured diagnostics
- [`async-coroutinescope-builder`](rules/async-coroutinescope-builder.md) - Use the `coroutineScope`/`supervisorScope` builders for structured child launches

### 4. Flow & Reactive Streams (HIGH)

- [`flow-cold-vs-hot`](rules/flow-cold-vs-hot.md) - Understand cold `Flow` versus hot `SharedFlow`/`StateFlow`
- [`flow-stateflow-ui-state`](rules/flow-stateflow-ui-state.md) - Model observable state with `StateFlow`, not a mutable var
- [`flow-sharedflow-events`](rules/flow-sharedflow-events.md) - Model one-off events with `SharedFlow`, not `StateFlow`
- [`flow-flowon-upstream`](rules/flow-flowon-upstream.md) - Use `flowOn` to change the dispatcher upstream of it, not downstream
- [`flow-catch-operator`](rules/flow-catch-operator.md) - Handle upstream failures with the `catch` operator, not a try/catch around `collect`
- [`flow-channel-vs-flow`](rules/flow-channel-vs-flow.md) - Choose `Channel` for hot, back-pressured single-consumer communication
- [`flow-buffer-conflate-backpressure`](rules/flow-buffer-conflate-backpressure.md) - Use `buffer`/`conflate`/`collectLatest` to manage producer/consumer speed mismatches
- [`flow-flatmapconcat-latest`](rules/flow-flatmapconcat-latest.md) - Pick `flatMapConcat`/`flatMapMerge`/`flatMapLatest` based on required concurrency semantics
- [`flow-statein-sharein`](rules/flow-statein-sharein.md) - Convert a cold flow to hot with `stateIn`/`shareIn` and an explicit `SharingStarted` policy
- [`flow-avoid-side-effects-map`](rules/flow-avoid-side-effects-map.md) - Avoid side effects inside `map`/`transform`; use `onEach` for them instead
- [`flow-cancellable-collect`](rules/flow-cancellable-collect.md) - Ensure `collect` runs inside a structured, cancellable scope
- [`flow-first-single-terminal`](rules/flow-first-single-terminal.md) - Use terminal operators (`first`, `toList`, `reduce`) instead of manual collection loops

### 5. API/Class Design (HIGH)

- [`api-data-class-equality`](rules/api-data-class-equality.md) - Use `data class` to get structural `equals`/`hashCode`/`copy` for free
- [`api-sealed-for-state`](rules/api-sealed-for-state.md) - Model exhaustive state machines with `sealed class`/`sealed interface`
- [`api-dsl-lambda-receiver`](rules/api-dsl-lambda-receiver.md) - Build type-safe DSLs with lambda-with-receiver (`T.() -> Unit`)
- [`api-extension-function-cohesion`](rules/api-extension-function-cohesion.md) - Add focused extension functions instead of bloating a class
- [`api-operator-overload-discipline`](rules/api-operator-overload-discipline.md) - Overload operators only when the semantics match built-in expectations
- [`api-visibility-internal`](rules/api-visibility-internal.md) - Default to `internal`/`private`; expose only the intended public surface
- [`api-default-params-over-overloads`](rules/api-default-params-over-overloads.md) - Use default parameter values instead of overloaded function variants
- [`api-named-arguments-clarity`](rules/api-named-arguments-clarity.md) - Use named arguments at call sites with multiple same-typed parameters
- [`api-copy-with-defaults`](rules/api-copy-with-defaults.md) - Use `data class` `copy()` for immutable partial updates
- [`api-builder-dsl-optional-args`](rules/api-builder-dsl-optional-args.md) - Prefer a builder DSL over telescoping constructors for many optional parameters
- [`api-interface-default-methods`](rules/api-interface-default-methods.md) - Use interface default method bodies for shared behavior without a base class
- [`api-inline-reified-generic`](rules/api-inline-reified-generic.md) - Use `inline`/`reified` when a generic function needs runtime type information
- [`api-typealias-clarity`](rules/api-typealias-clarity.md) - Use `typealias` to name complex function or generic types
- [`api-delegation-by-keyword`](rules/api-delegation-by-keyword.md) - Use the `by` keyword for interface delegation instead of inheritance
- [`api-property-delegate-custom`](rules/api-property-delegate-custom.md) - Use property delegates (`lazy`, `observable`, custom) to encapsulate accessor logic

### 6. Functional & Collection Patterns (HIGH)

- [`fn-sequence-for-laziness`](rules/fn-sequence-for-laziness.md) - Use `Sequence` for long, chained collection pipelines needing laziness
- [`fn-collection-vs-sequence-tradeoff`](rules/fn-collection-vs-sequence-tradeoff.md) - Know when eager `List` operations beat `Sequence` overhead on small data
- [`fn-higher-order-functions`](rules/fn-higher-order-functions.md) - Pass behavior as a higher-order function instead of a strategy class
- [`fn-scope-function-let`](rules/fn-scope-function-let.md) - Use `let` to scope a transform on a single (often nullable) value
- [`fn-scope-function-run`](rules/fn-scope-function-run.md) - Use `run` for a scoped computation that returns a result
- [`fn-scope-function-with`](rules/fn-scope-function-with.md) - Use `with` for grouped calls on a non-null receiver already in scope
- [`fn-scope-function-apply`](rules/fn-scope-function-apply.md) - Use `apply` to configure an object and return the receiver
- [`fn-scope-function-also`](rules/fn-scope-function-also.md) - Use `also` for side effects that shouldn't change the returned value
- [`fn-val-over-var`](rules/fn-val-over-var.md) - Default to `val`; use `var` only when reassignment is genuinely required
- [`fn-immutable-collection-types`](rules/fn-immutable-collection-types.md) - Return `List`/`Set`/`Map`, not `MutableList`, from public APIs
- [`fn-function-composition`](rules/fn-function-composition.md) - Compose small functions instead of one large branching function
- [`fn-tailrec-recursion`](rules/fn-tailrec-recursion.md) - Mark provably tail-recursive functions `tailrec`
- [`fn-destructuring-declarations`](rules/fn-destructuring-declarations.md) - Use destructuring declarations for data classes, `Map.Entry`, and `Pair`
- [`fn-collection-operator-chaining`](rules/fn-collection-operator-chaining.md) - Chain collection operators for readability, but watch for redundant passes over large data

### 7. Naming Conventions (MEDIUM)

- [`name-classes-pascal`](rules/name-classes-pascal.md) - Use `PascalCase` for classes, interfaces, and objects
- [`name-functions-camel`](rules/name-functions-camel.md) - Use `camelCase` for functions and properties
- [`name-constants-screaming-snake`](rules/name-constants-screaming-snake.md) - Use `SCREAMING_SNAKE_CASE` for top-level/companion `const val`
- [`name-packages-lowercase`](rules/name-packages-lowercase.md) - Use all-lowercase, dot-separated package names
- [`name-backing-property-underscore`](rules/name-backing-property-underscore.md) - Use a leading-underscore backing property for a public read-only view
- [`name-boolean-is-has`](rules/name-boolean-is-has.md) - Name boolean properties/functions `isX`/`hasX`/`canX`
- [`name-acronyms-as-words`](rules/name-acronyms-as-words.md) - Treat acronyms as words: `HttpClient`, not `HTTPClient`
- [`name-type-param-single-letter`](rules/name-type-param-single-letter.md) - Use single uppercase letters for generic type parameters: `T`, `K`, `V`, `E`
- [`name-test-function-backticks`](rules/name-test-function-backticks.md) - Name test functions with backtick-quoted descriptive sentences
- [`name-enum-entries-screaming-or-pascal`](rules/name-enum-entries-screaming-or-pascal.md) - Pick one enum-entry casing convention and apply it consistently
- [`name-no-hungarian-notation`](rules/name-no-hungarian-notation.md) - Avoid Hungarian notation and type-suffix cruft in identifier names
- [`name-receiver-param-this`](rules/name-receiver-param-this.md) - Name lambda receivers implicitly via `this`, not a redundant explicit parameter

### 8. Testing (MEDIUM)

- [`test-kotlin-test-multiplatform`](rules/test-kotlin-test-multiplatform.md) - Use `kotlin.test` for common, multiplatform-portable test code
- [`test-junit5-annotations`](rules/test-junit5-annotations.md) - Use JUnit 5 (`@Test`, `@Nested`, `@DisplayName`) idiomatically on the JVM
- [`test-kotest-specs`](rules/test-kotest-specs.md) - Use Kotest spec styles (`FunSpec`, `BehaviorSpec`) for expressive test structure
- [`test-runtest-coroutines`](rules/test-runtest-coroutines.md) - Use `runTest` to test suspend functions and coroutine code
- [`test-testdispatcher-virtual-time`](rules/test-testdispatcher-virtual-time.md) - Use `TestDispatcher`/virtual time to make coroutine tests deterministic
- [`test-mockk-over-mockito`](rules/test-mockk-over-mockito.md) - Use MockK for idiomatic Kotlin mocking (including `object`/`final` classes)
- [`test-parameterized-tests`](rules/test-parameterized-tests.md) - Use parameterized/table-driven tests for input/output variants
- [`test-arrange-act-assert`](rules/test-arrange-act-assert.md) - Structure tests as arrange/act/assert
- [`test-descriptive-backtick-names`](rules/test-descriptive-backtick-names.md) - Write descriptive test names, not `test1`/`testFoo`
- [`test-turbine-flow-testing`](rules/test-turbine-flow-testing.md) - Use Turbine to assert on `Flow` emissions in tests
- [`test-fixture-builders`](rules/test-fixture-builders.md) - Use builder/factory functions to construct test fixtures
- [`test-fake-over-mock`](rules/test-fake-over-mock.md) - Prefer a hand-written fake over a mock when behavior needs to be realistic
- [`test-assertk-fluent-assertions`](rules/test-assertk-fluent-assertions.md) - Use fluent assertion libraries (`assertk`, Kotest matchers) over raw JUnit asserts

### 9. Documentation (MEDIUM)

- [`doc-kdoc-public-api`](rules/doc-kdoc-public-api.md) - Document all public API with KDoc (`/** */`)
- [`doc-kdoc-param-return`](rules/doc-kdoc-param-return.md) - Document `@param`/`@return` when the signature isn't self-evident
- [`doc-kdoc-sample-tag`](rules/doc-kdoc-sample-tag.md) - Use `@sample` to link a compiled, runnable usage example
- [`doc-kdoc-throws-tag`](rules/doc-kdoc-throws-tag.md) - Document thrown exceptions with `@throws`
- [`doc-module-package-docs`](rules/doc-module-package-docs.md) - Document modules/packages with a `Module.md`/package-info summary
- [`doc-dokka-generation`](rules/doc-dokka-generation.md) - Generate API docs with Dokka as part of the build
- [`doc-inline-why-not-what`](rules/doc-inline-why-not-what.md) - Write comments that explain why, not what the code already says
- [`doc-deprecated-replacewith`](rules/doc-deprecated-replacewith.md) - Pair `@Deprecated` with `ReplaceWith` for an automatic migration
- [`doc-readme-module`](rules/doc-readme-module.md) - Maintain a README per module with purpose and usage

### 10. Performance Patterns (MEDIUM)

- [`perf-inline-lambda-functions`](rules/perf-inline-lambda-functions.md) - Mark small higher-order functions `inline` to avoid lambda allocation
- [`perf-avoid-boxing-primitives`](rules/perf-avoid-boxing-primitives.md) - Avoid boxing primitives in generic collections on hot paths
- [`perf-jvmstatic-jvmfield`](rules/perf-jvmstatic-jvmfield.md) - Use `@JvmStatic`/`@JvmField` to remove companion-object call overhead
- [`perf-collection-chain-cost`](rules/perf-collection-chain-cost.md) - Be aware that each chained collection operator allocates an intermediate list
- [`perf-string-builder-concat`](rules/perf-string-builder-concat.md) - Use `StringBuilder`/`buildString` for repeated string concatenation
- [`perf-array-vs-list-primitives`](rules/perf-array-vs-list-primitives.md) - Use primitive arrays (`IntArray`, etc.) for large numeric hot-path data
- [`perf-lazy-initialization`](rules/perf-lazy-initialization.md) - Defer expensive initialization with `lazy { }`
- [`perf-avoid-reflection-hot-path`](rules/perf-avoid-reflection-hot-path.md) - Avoid reflection-based calls in hot paths
- [`perf-sequence-large-collections`](rules/perf-sequence-large-collections.md) - Switch to `Sequence` once collection pipelines process large data
- [`perf-immutable-collection-cost`](rules/perf-immutable-collection-cost.md) - Understand persistent/immutable collection copy costs versus mutable builders
- [`perf-coroutine-dispatcher-overhead`](rules/perf-coroutine-dispatcher-overhead.md) - Avoid unnecessary dispatcher hops for cheap, non-blocking work
- [`perf-profile-before-optimize`](rules/perf-profile-before-optimize.md) - Profile before optimizing; don't guess at hot paths

### 11. Interop (Java/JVM) (MEDIUM)

- [`interop-jvmoverloads-defaults`](rules/interop-jvmoverloads-defaults.md) - Use `@JvmOverloads` so Java callers get overloads for default parameters
- [`interop-jvmname-clash`](rules/interop-jvmname-clash.md) - Use `@JvmName` to resolve JVM signature clashes from Kotlin-specific features
- [`interop-platform-type-handling`](rules/interop-platform-type-handling.md) - Explicitly annotate nullability at Java boundaries instead of trusting platform types
- [`interop-jvmstatic-companion`](rules/interop-jvmstatic-companion.md) - Use `@JvmStatic` in a companion object for natural static calls from Java
- [`interop-throws-checked-exceptions`](rules/interop-throws-checked-exceptions.md) - Declare `@Throws` so Java callers see checked exceptions
- [`interop-nullability-annotations-java`](rules/interop-nullability-annotations-java.md) - Annotate Java APIs with `@Nullable`/`@NonNull` for accurate Kotlin inference
- [`interop-collection-interop-java`](rules/interop-collection-interop-java.md) - Understand mutable/read-only collection interop gaps at Java boundaries
- [`interop-suspend-fun-from-java`](rules/interop-suspend-fun-from-java.md) - Expose coroutine APIs to Java via `@JvmStatic` futures or callback wrappers
- [`interop-property-getter-setter-java`](rules/interop-property-getter-setter-java.md) - Know how Kotlin properties compile to Java getter/setter pairs
- [`interop-const-val-compile-time`](rules/interop-const-val-compile-time.md) - Use `const val` for compile-time constants exposed to Java as `static final`

### 12. Android-Adjacent Idioms (MEDIUM)

- [`android-viewmodel-scope`](rules/android-viewmodel-scope.md) - Launch coroutines in `viewModelScope`, not a manually created scope
- [`android-lifecyclescope-collect`](rules/android-lifecyclescope-collect.md) - Collect flows with `lifecycleScope`/`repeatOnLifecycle`, not raw `GlobalScope`
- [`android-parcelize-data-class`](rules/android-parcelize-data-class.md) - Use `@Parcelize` on data classes crossing Android IPC boundaries
- [`android-compose-state-hoisting`](rules/android-compose-state-hoisting.md) - Hoist Compose state instead of holding mutable state inside composables
- [`android-avoid-context-leak`](rules/android-avoid-context-leak.md) - Avoid holding an `Activity` `Context` in a long-lived object
- [`android-sealed-ui-state`](rules/android-sealed-ui-state.md) - Model screen UI state with a sealed class, not scattered boolean flags
- [`android-savedstatehandle-viewmodel`](rules/android-savedstatehandle-viewmodel.md) - Persist process-death-survivable state via `SavedStateHandle`
- [`android-flow-repeatonlifecycle`](rules/android-flow-repeatonlifecycle.md) - Restart flow collection safely with `repeatOnLifecycle`

### 13. Project Structure (LOW)

- [`proj-gradle-multi-module`](rules/proj-gradle-multi-module.md) - Split a growing codebase into Gradle modules along architectural seams
- [`proj-package-by-feature`](rules/proj-package-by-feature.md) - Organize packages by feature/domain, not by technical layer
- [`proj-kotlin-dsl-buildscript`](rules/proj-kotlin-dsl-buildscript.md) - Write Gradle build scripts in Kotlin DSL (`build.gradle.kts`)
- [`proj-version-catalog-libs`](rules/proj-version-catalog-libs.md) - Centralize dependency versions in a Gradle version catalog (`libs.versions.toml`)
- [`proj-api-vs-impl-module`](rules/proj-api-vs-impl-module.md) - Separate a module's public `api` surface from its `implementation` details
- [`proj-flat-small-projects`](rules/proj-flat-small-projects.md) - Keep small projects flat instead of over-modularizing prematurely
- [`proj-internal-module-boundary`](rules/proj-internal-module-boundary.md) - Enforce module boundaries with `internal` visibility, not convention alone
- [`proj-buildsrc-convention-plugins`](rules/proj-buildsrc-convention-plugins.md) - Share build logic with convention plugins in `build-logic`/`buildSrc`
- [`proj-explicit-api-mode`](rules/proj-explicit-api-mode.md) - Enable `explicitApi()` for libraries to force intentional public API declarations
- [`proj-source-set-organization`](rules/proj-source-set-organization.md) - Organize Kotlin Multiplatform source sets (`commonMain`, `jvmMain`, etc.) by shared surface

### 14. Linting (LOW)

- [`lint-detekt-baseline`](rules/lint-detekt-baseline.md) - Run detekt with a committed baseline for legacy code
- [`lint-ktlint-formatting`](rules/lint-ktlint-formatting.md) - Enforce formatting with ktlint so style reviews stay off PRs
- [`lint-compiler-warnings-as-errors`](rules/lint-compiler-warnings-as-errors.md) - Treat compiler warnings as errors (`allWarningsAsErrors`) in CI
- [`lint-detekt-complexity-rules`](rules/lint-detekt-complexity-rules.md) - Enable detekt complexity rules to catch long/complex functions
- [`lint-explicit-api-warning`](rules/lint-explicit-api-warning.md) - Fail CI on missing visibility modifiers in explicit-API mode
- [`lint-opt-in-requiresoptin`](rules/lint-opt-in-requiresoptin.md) - Require explicit opt-in (`@RequiresOptIn`) for experimental APIs
- [`lint-suppress-with-justification`](rules/lint-suppress-with-justification.md) - Require a comment justification alongside any `@Suppress`
- [`lint-ktlint-editorconfig`](rules/lint-ktlint-editorconfig.md) - Configure ktlint rules via `.editorconfig`, not scattered suppressions
- [`lint-detekt-custom-rules`](rules/lint-detekt-custom-rules.md) - Write custom detekt rules for project-specific conventions
- [`lint-ci-lint-gate`](rules/lint-ci-lint-gate.md) - Run detekt/ktlint/compiler checks as a required CI gate

### 15. Anti-patterns (REFERENCE)

- [`anti-not-null-assert-abuse`](rules/anti-not-null-assert-abuse.md) - Don't scatter `!!` to silence the compiler
- [`anti-globalscope-misuse`](rules/anti-globalscope-misuse.md) - Don't launch long-lived work on `GlobalScope`
- [`anti-mutable-shared-state`](rules/anti-mutable-shared-state.md) - Don't mutate shared state from multiple coroutines without synchronization
- [`anti-god-object`](rules/anti-god-object.md) - Don't build a God object/manager class with too many responsibilities
- [`anti-stringly-typed-data`](rules/anti-stringly-typed-data.md) - Don't represent structured domain data as ad hoc strings
- [`anti-excessive-nullable-types`](rules/anti-excessive-nullable-types.md) - Don't reach for nullable types instead of modeling absence properly
- [`anti-lateinit-overuse`](rules/anti-lateinit-overuse.md) - Don't use `lateinit var` as a substitute for proper initialization/DI
- [`anti-runcatching-swallow-cancellation`](rules/anti-runcatching-swallow-cancellation.md) - Don't let `runCatching` silently swallow `CancellationException`
- [`anti-blocking-in-coroutine`](rules/anti-blocking-in-coroutine.md) - Don't call blocking APIs inside a coroutine without switching dispatchers
- [`anti-magic-numbers`](rules/anti-magic-numbers.md) - Don't scatter unexplained magic numbers/strings through code
- [`anti-primitive-obsession`](rules/anti-primitive-obsession.md) - Don't pass raw primitives where a domain type/value class belongs
- [`anti-deep-nesting-when`](rules/anti-deep-nesting-when.md) - Don't deeply nest `when`/`if` instead of using early returns or sealed dispatch
- [`anti-mutable-public-collections`](rules/anti-mutable-public-collections.md) - Don't expose `MutableList`/`MutableMap` from a class's public API
- [`anti-companion-object-god`](rules/anti-companion-object-god.md) - Don't turn a companion object into a dumping ground of unrelated statics
- [`anti-var-for-immutable-state`](rules/anti-var-for-immutable-state.md) - Don't use `var` and manual reassignment where an immutable `val` update expresses intent better

---

## Recommended build.gradle.kts Settings

```kotlin
plugins {
    kotlin("jvm") version "2.1.0"
    id("io.gitlab.arturbosch.detekt") version "1.23.7"
    id("org.jlleitschuh.gradle.ktlint") version "12.1.1"
}

kotlin {
    jvmToolchain(21)
    explicitApi() // library modules: force intentional public API declarations

    compilerOptions {
        allWarningsAsErrors.set(true)
        freeCompilerArgs.add("-Xcontext-receivers") // only if the project targets this experimental feature
    }
}

detekt {
    buildUponDefaultConfig = true
    allRules = false
    config.setFrom(files("$rootDir/config/detekt/detekt.yml"))
    baseline = file("$rootDir/config/detekt/baseline.xml") // for incremental adoption on legacy code
}

ktlint {
    version.set("1.3.1")
    verbose.set(true)
    outputToConsole.set(true)
    filter {
        exclude("**/generated/**")
    }
}

tasks.test {
    useJUnitPlatform()
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
    testImplementation(platform("org.junit:junit-bom:5.11.0"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    testImplementation("io.mockk:mockk:1.13.13")
    testImplementation("app.cash.turbine:turbine:1.2.0")
    testImplementation("com.willowtreeapps.assertk:assertk:0.28.1")
}
```

```yaml
# config/detekt/detekt.yml (excerpt)
complexity:
  LongMethod:
    threshold: 40
  CyclomaticComplexMethod:
    threshold: 15
style:
  UnsafeCallOnNullableType:
    active: true
  ForbiddenComment:
    active: false
coroutines:
  GlobalCoroutineUsage:
    active: true
  SuspendFunWithFlowReturnType:
    active: true
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing Kotlin code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|--------------------|
| New function/class | `type-`, `err-`, `name-` |
| New public API/library module | `api-`, `type-`, `doc-` |
| Coroutines/concurrency code | `async-`, `flow-`, `err-` |
| Reactive/UI state modeling | `flow-`, `android-`, `api-` |
| Error handling | `err-`, `api-` |
| Performance tuning | `perf-`, `async-`, `fn-` |
| Java/Kotlin interop | `interop-`, `type-` |
| Writing tests | `test-` |
| Android-specific review | `android-`, `flow-`, `async-` |
| Project/module setup | `proj-`, `lint-` |
| Code review | `anti-`, `lint-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) - choosing and implementing GoF and idiomatic patterns; apply alongside `api-` and `fn-` rules here for pattern-heavy Kotlin design.
- [security-review](../security-review/SKILL.md) - security-focused audit checklists; apply alongside `err-`, `interop-`, and `async-` rules here when reviewing Kotlin code for vulnerabilities.

## Sources

This skill synthesizes best practices from:
- [Kotlin official coding conventions](https://kotlinlang.org/docs/coding-conventions.html) and [Kotlin language documentation](https://kotlinlang.org/docs/home.html)
- *Effective Kotlin* (Marcin Moskała)
- [Android Kotlin style guide](https://developer.android.com/kotlin/style-guide)
- [ktlint](https://pinterest.github.io/ktlint/) and [detekt](https://detekt.dev/docs/rules/) rule documentation
- [kotlinx.coroutines](https://kotlinlang.org/api/kotlinx.coroutines/) official guide (structured concurrency, Flow, testing)
- Production codebases: `ktor`, `kotlinx.coroutines`, `arrow-kt`, `coil`, `okhttp`
- Kotlin Evolution and Enhancement Process (KEEP) proposals and Kotlin 2.0/2.1 release notes
- Community conventions (2024-2026)
