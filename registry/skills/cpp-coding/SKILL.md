---
name: cpp-coding
description: "Comprehensive idiomatic modern C++ guidance: 176 prioritized rules across 15 categories covering RAII, smart pointers, memory safety, templates, concurrency, and performance. Use when writing, reviewing, refactoring, or optimizing C++ (`.cpp`, `.cc`, `.cxx`, `.hpp`, `.h`, `.hh`, `CMakeLists.txt`). Targets C++17/20/23; prefer the project's declared standard version and only apply concepts/ranges/coroutines/modules/`std::expected` when the project's compiler and `CMAKE_CXX_STANDARD` actually support them."
compatibility: opencode
metadata:
  domain: cpp
  audience: software-engineer
  edition: project-declared
---

# C++ Best Practices

Comprehensive guide for writing high-quality, idiomatic modern C++. Contains 176 rules across 15 categories, prioritized by impact. Project constraints override generic defaults: preserve the declared `CMAKE_CXX_STANDARD`/`-std=` flag, compiler support matrix, and existing memory-management conventions unless the user explicitly requests a modernization pass.

This skill is for **idiomatic modern C++** — RAII, smart pointers, templates, the STL, exceptions/`std::expected`. For plain C code (manual memory management, no classes/templates/exceptions, C ABI), use the sibling `c-coding` skill instead. Do not apply C++-only idioms (RAII, `unique_ptr`, templates, exceptions) to a `.c` file, and do not apply C-style manual memory management to idiomatic C++.

## When to Apply

Reference these guidelines when:
- Writing new C++ classes, functions, or headers
- Choosing between `unique_ptr`, `shared_ptr`, raw pointers, and references
- Implementing error handling (exceptions, `std::expected`, error codes)
- Designing public APIs for a library or shared object
- Reviewing code for ownership, lifetime, or memory-safety issues
- Writing template or generic code, or migrating SFINAE to concepts
- Writing or reviewing concurrent code (threads, atomics, coroutines)
- Optimizing hot paths or reducing allocations
- Setting up `CMakeLists.txt`, `.clang-tidy`, or CI sanitizer builds

## Modern C++ (C++17 / C++20 / C++23)

Preserve the project's declared standard (`CMAKE_CXX_STANDARD`, `-std=c++XX`) and compiler baseline unless migration is explicitly in scope. For new projects, prefer at minimum C++17 for structured bindings and `if constexpr`, and C++20 where the toolchain (GCC 10+, Clang 14+, MSVC 19.29+) reliably supports it.

**C++17** — genuinely current baseline:
- Structured bindings (`auto [it, ok] = map.insert(...)`) instead of `.first`/`.second`
- `if constexpr` for compile-time branching without SFINAE tricks
- `std::optional<T>`, `std::variant<T...>`, `std::any` for absence/sum-types/type-erasure
- `std::string_view` for non-owning string parameters
- Class template argument deduction (CTAD) — `std::vector v{1, 2, 3};` needs no `<int>`
- `std::filesystem` for portable path/file operations
- `[[nodiscard]]`, `[[maybe_unused]]`, `[[fallthrough]]` attributes

**C++20** — adopt where the toolchain supports it:
- Concepts (`std::integral`, `std::invocable`, user-defined `requires` clauses) instead of `enable_if`/SFINAE
- Ranges (`std::ranges::sort`, views, pipe composition) instead of iterator-pair algorithms
- Coroutines (`co_await`/`co_yield`/`co_return`) for structured async code
- `std::span<T>` for bounds-aware, non-owning views over contiguous data
- `std::jthread` (auto-joining, cooperatively cancellable thread)
- Modules (`import`/`export module`) — adopt only after confirming build-system maturity (CMake 3.28+, compiler support); header/`#include` remains the safe default otherwise
- Three-way comparison (`operator<=>`) to replace hand-written relational operator sets
- Designated initializers, `std::atomic_ref`, `std::format` (or `{fmt}` as the pre-standard equivalent)

**C++23** — use only when the project's toolchain is confirmed current enough:
- `std::expected<T, E>` for explicit, allocation-free error returns as an alternative to exceptions
- Deducing `this` (explicit object parameters) to de-duplicate const/non-const and ref-qualified overloads
- `std::mdspan` for multi-dimensional array views
- `if consteval` for compile-time-vs-runtime branching
- `std::ranges::to` for materializing ranges into containers

For the authoritative, evolving detail, consult the C++ Core Guidelines and cppreference.com's per-standard feature pages. Everything below applies across C++17/20/23; prefer the newer forms above where the project's standard version allows.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | RAII & Resource Management | CRITICAL | `raii-` | 12 |
| 2 | Smart Pointers & Ownership | CRITICAL | `own-` | 13 |
| 3 | Memory Safety | CRITICAL | `mem-` | 14 |
| 4 | Error Handling | CRITICAL | `err-` | 13 |
| 5 | Templates & Generic Programming | HIGH | `tmpl-` | 12 |
| 6 | API Design | HIGH | `api-` | 14 |
| 7 | Concurrency | HIGH | `conc-` | 14 |
| 8 | Naming Conventions | MEDIUM | `name-` | 10 |
| 9 | Type Safety | MEDIUM | `type-` | 11 |
| 10 | Testing | MEDIUM | `test-` | 10 |
| 11 | Documentation | MEDIUM | `doc-` | 8 |
| 12 | Performance Patterns | MEDIUM | `perf-` | 12 |
| 13 | Project Structure | LOW | `proj-` | 9 |
| 14 | Linting & Static Analysis | LOW | `lint-` | 9 |
| 15 | Anti-patterns | REFERENCE | `anti-` | 15 |

---

## Quick Reference

### 1. RAII & Resource Management (CRITICAL)

- [`raii-scope-bound-resources`](rules/raii-scope-bound-resources.md) - Bind every resource to a scope-owning object
- [`raii-rule-of-zero`](rules/raii-rule-of-zero.md) - Prefer Rule of Zero; let members manage their own resources
- [`raii-rule-of-five`](rules/raii-rule-of-five.md) - Implement all five special members together, or none
- [`raii-unique-ptr-default`](rules/raii-unique-ptr-default.md) - Default to `unique_ptr` for sole ownership
- [`raii-custom-deleter`](rules/raii-custom-deleter.md) - Use custom deleters for non-memory resources
- [`raii-lock-guard`](rules/raii-lock-guard.md) - Use `lock_guard`/`scoped_lock`, never manual lock/unlock
- [`raii-scope-exit`](rules/raii-scope-exit.md) - Use RAII scope guards instead of goto-cleanup
- [`raii-no-manual-new-delete`](rules/raii-no-manual-new-delete.md) - Never pair manual `new`/`delete`; wrap in an owner
- [`raii-exception-safety-dtor`](rules/raii-exception-safety-dtor.md) - Destructors must not throw; mark `noexcept`
- [`raii-avoid-two-phase-init`](rules/raii-avoid-two-phase-init.md) - Avoid two-phase init; fully construct in the constructor
- [`raii-raii-for-transactions`](rules/raii-raii-for-transactions.md) - Use RAII for transactional commit/rollback
- [`raii-file-handle-wrap`](rules/raii-file-handle-wrap.md) - Wrap OS/file handles in RAII types

### 2. Smart Pointers & Ownership (CRITICAL)

- [`own-unique-ptr-sole`](rules/own-unique-ptr-sole.md) - `unique_ptr` for sole, transferable ownership
- [`own-shared-ptr-shared`](rules/own-shared-ptr-shared.md) - `shared_ptr` only for genuine shared ownership
- [`own-weak-ptr-break-cycles`](rules/own-weak-ptr-break-cycles.md) - `weak_ptr` to break `shared_ptr` cycles
- [`own-make-unique-shared`](rules/own-make-unique-shared.md) - Use `make_unique`/`make_shared` over raw `new`
- [`own-raw-pointer-non-owning`](rules/own-raw-pointer-non-owning.md) - Raw pointer/reference means non-owning
- [`own-span-view`](rules/own-span-view.md) - Use `std::span`/`string_view` for non-owning views
- [`own-pass-by-value-sink`](rules/own-pass-by-value-sink.md) - Take ownership by value (`unique_ptr`) when sinking
- [`own-observer-ptr-reference`](rules/own-observer-ptr-reference.md) - Prefer reference over pointer when null is invalid
- [`own-shared-ptr-not-default`](rules/own-shared-ptr-not-default.md) - Don't default to `shared_ptr` "just in case"
- [`own-enable-shared-from-this`](rules/own-enable-shared-from-this.md) - Use `enable_shared_from_this` correctly
- [`own-const-correctness-ownership`](rules/own-const-correctness-ownership.md) - Distinguish ownership from access via `const`
- [`own-move-transfer`](rules/own-move-transfer.md) - Use `std::move` to transfer ownership explicitly
- [`own-avoid-get-raw-escape`](rules/own-avoid-get-raw-escape.md) - Don't let `.get()` pointers outlive their owner

### 3. Memory Safety (CRITICAL)

- [`mem-span-bounds`](rules/mem-span-bounds.md) - Use `std::span` instead of pointer+length pairs
- [`mem-string-view-borrow`](rules/mem-string-view-borrow.md) - Use `std::string_view` for read-only string params
- [`mem-array-over-c-array`](rules/mem-array-over-c-array.md) - Use `std::array` instead of raw C arrays
- [`mem-vector-over-manual`](rules/mem-vector-over-manual.md) - Use `std::vector` instead of manual dynamic arrays
- [`mem-at-vs-brackets`](rules/mem-at-vs-brackets.md) - Use `.at()` at boundaries, `operator[]` in verified hot paths
- [`mem-no-dangling-reference`](rules/mem-no-dangling-reference.md) - Never return references/pointers to locals
- [`mem-iterator-invalidation`](rules/mem-iterator-invalidation.md) - Know which operations invalidate iterators
- [`mem-use-after-move`](rules/mem-use-after-move.md) - Don't use an object after `std::move` except to reassign
- [`mem-avoid-c-style-arrays-decay`](rules/mem-avoid-c-style-arrays-decay.md) - Avoid array-to-pointer decay in interfaces
- [`mem-sanitizer-required`](rules/mem-sanitizer-required.md) - Run ASan/UBSan in test builds, not just release
- [`mem-no-manual-index-arithmetic`](rules/mem-no-manual-index-arithmetic.md) - Avoid manual pointer/index arithmetic
- [`mem-null-check-before-deref`](rules/mem-null-check-before-deref.md) - Check pointer validity before dereference
- [`mem-lifetime-of-callback-captures`](rules/mem-lifetime-of-callback-captures.md) - Don't let lambda captures dangle
- [`mem-string-lifetime-c-str`](rules/mem-string-lifetime-c-str.md) - Don't retain `c_str()`/`data()` past source lifetime

### 4. Error Handling (CRITICAL)

- [`err-exceptions-vs-expected`](rules/err-exceptions-vs-expected.md) - Choose exceptions vs `std::expected`/error codes
- [`err-raii-exception-safety`](rules/err-raii-exception-safety.md) - Rely on RAII for exception-safe cleanup
- [`err-strong-exception-guarantee`](rules/err-strong-exception-guarantee.md) - Provide at least the basic guarantee
- [`err-noexcept-correctness`](rules/err-noexcept-correctness.md) - Mark move operations `noexcept`
- [`err-no-exceptions-across-abi`](rules/err-no-exceptions-across-abi.md) - Don't let exceptions cross `extern "C"`
- [`err-expected-for-recoverable`](rules/err-expected-for-recoverable.md) - Use `std::expected<T,E>` for recoverable failures
- [`err-optional-for-absence`](rules/err-optional-for-absence.md) - Use `std::optional<T>` for absence, not errors
- [`err-catch-by-const-ref`](rules/err-catch-by-const-ref.md) - Catch exceptions by `const&`, not by value
- [`err-no-catch-all-swallow`](rules/err-no-catch-all-swallow.md) - Don't swallow exceptions with empty `catch(...)`
- [`err-custom-exception-hierarchy`](rules/err-custom-exception-hierarchy.md) - Derive custom exceptions from `std::exception`
- [`err-nodiscard-fallible`](rules/err-nodiscard-fallible.md) - Mark fallible functions `[[nodiscard]]`
- [`err-error-context-preserve`](rules/err-error-context-preserve.md) - Preserve original cause when wrapping errors
- [`err-assert-vs-exception`](rules/err-assert-vs-exception.md) - `assert()` for programmer errors, exceptions for runtime errors

### 5. Templates & Generic Programming (HIGH)

- [`tmpl-concepts-over-sfinae`](rules/tmpl-concepts-over-sfinae.md) - Use C++20 concepts instead of SFINAE
- [`tmpl-if-constexpr-branch`](rules/tmpl-if-constexpr-branch.md) - Use `if constexpr` for compile-time branching
- [`tmpl-requires-clause`](rules/tmpl-requires-clause.md) - Use `requires` clauses to constrain templates precisely
- [`tmpl-avoid-bloat`](rules/tmpl-avoid-bloat.md) - Minimize template instantiation bloat
- [`tmpl-crtp-static-polymorphism`](rules/tmpl-crtp-static-polymorphism.md) - Use CRTP for static polymorphism
- [`tmpl-variadic-parameter-pack`](rules/tmpl-variadic-parameter-pack.md) - Use variadic templates and fold expressions
- [`tmpl-auto-template-param`](rules/tmpl-auto-template-param.md) - Use abbreviated function templates for simple generics
- [`tmpl-concept-standard-library`](rules/tmpl-concept-standard-library.md) - Prefer standard concepts over ad hoc traits
- [`tmpl-explicit-instantiation`](rules/tmpl-explicit-instantiation.md) - Use explicit instantiation to control compile time
- [`tmpl-type-traits-standard`](rules/tmpl-type-traits-standard.md) - Use `<type_traits>` instead of hand-rolled checks
- [`tmpl-template-template-param`](rules/tmpl-template-template-param.md) - Use template template parameters judiciously
- [`tmpl-constexpr-function`](rules/tmpl-constexpr-function.md) - Prefer `constexpr` functions over metaprogramming

### 6. API Design (HIGH)

- [`api-rule-of-zero-value-types`](rules/api-rule-of-zero-value-types.md) - Value types: rule of zero
- [`api-const-correctness`](rules/api-const-correctness.md) - Mark methods/parameters `const` wherever possible
- [`api-pass-by-value-sink-ref-view`](rules/api-pass-by-value-sink-ref-view.md) - Decision table for parameter passing
- [`api-nodiscard-return`](rules/api-nodiscard-return.md) - Annotate `[[nodiscard]]` on must-check returns
- [`api-pimpl-abi-stability`](rules/api-pimpl-abi-stability.md) - Use PIMPL for ABI-stable shared libraries
- [`api-avoid-stl-across-abi`](rules/api-avoid-stl-across-abi.md) - Don't expose STL containers across unstable ABI
- [`api-explicit-constructors`](rules/api-explicit-constructors.md) - Mark single-argument constructors `explicit`
- [`api-return-value-not-out-param`](rules/api-return-value-not-out-param.md) - Return values instead of out-parameters
- [`api-interface-segregation`](rules/api-interface-segregation.md) - Keep interfaces small and focused
- [`api-default-member-init`](rules/api-default-member-init.md) - Use default member initializers
- [`api-strong-types-over-bool`](rules/api-strong-types-over-bool.md) - Use `enum class` instead of multiple bools
- [`api-consistent-overload-set`](rules/api-consistent-overload-set.md) - Keep overload sets consistent and unambiguous
- [`api-header-only-inline`](rules/api-header-only-inline.md) - Mark header-only free functions `inline`
- [`api-deprecated-attribute`](rules/api-deprecated-attribute.md) - Use `[[deprecated]]` before removing API

### 7. Concurrency (HIGH)

- [`conc-jthread-over-thread`](rules/conc-jthread-over-thread.md) - Prefer `std::jthread` over `std::thread`
- [`conc-lock-guard-raii`](rules/conc-lock-guard-raii.md) - Always guard mutexes with RAII lock types
- [`conc-avoid-data-races`](rules/conc-avoid-data-races.md) - Guard every piece of shared mutable state
- [`conc-atomic-for-simple-state`](rules/conc-atomic-for-simple-state.md) - Use `std::atomic` for simple counters/flags
- [`conc-lock-ordering-deadlock`](rules/conc-lock-ordering-deadlock.md) - Establish lock ordering or use `scoped_lock`
- [`conc-condition-variable-predicate`](rules/conc-condition-variable-predicate.md) - Always guard `wait` with a predicate
- [`conc-async-future-tasks`](rules/conc-async-future-tasks.md) - Use `std::async`/`std::future` for simple parallelism
- [`conc-coroutines-async-io`](rules/conc-coroutines-async-io.md) - Use C++20 coroutines for structured async I/O
- [`conc-thread-pool-over-raw-threads`](rules/conc-thread-pool-over-raw-threads.md) - Use a thread pool, not raw threads per task
- [`conc-shared-mutex-readers`](rules/conc-shared-mutex-readers.md) - Use `std::shared_mutex` when reads dominate
- [`conc-avoid-detach`](rules/conc-avoid-detach.md) - Avoid `std::thread::detach()`
- [`conc-immutable-sharing`](rules/conc-immutable-sharing.md) - Prefer sharing immutable data over synchronizing mutable data
- [`conc-thread-local-storage`](rules/conc-thread-local-storage.md) - Use `thread_local` for per-thread state
- [`conc-memory-order-relaxed-care`](rules/conc-memory-order-relaxed-care.md) - Default to `seq_cst`; justify weaker orders

### 8. Naming Conventions (MEDIUM)

- [`name-types-pascal`](rules/name-types-pascal.md) - `PascalCase` for types, classes, enums, concepts
- [`name-functions-lower-snake`](rules/name-functions-lower-snake.md) - `lower_snake_case` for functions and variables
- [`name-member-trailing-underscore`](rules/name-member-trailing-underscore.md) - Trailing underscore for private members
- [`name-constants-kcamel-or-caps`](rules/name-constants-kcamel-or-caps.md) - One consistent constant convention project-wide
- [`name-macros-all-caps`](rules/name-macros-all-caps.md) - `ALL_CAPS` only for macros
- [`name-namespace-lower-snake`](rules/name-namespace-lower-snake.md) - Short `lower_snake_case` namespaces
- [`name-template-param-single-letter`](rules/name-template-param-single-letter.md) - Single-letter or PascalCase template params
- [`name-boolean-is-has`](rules/name-boolean-is-has.md) - Prefix booleans with `is_`/`has_`/`can_`
- [`name-file-name-match-class`](rules/name-file-name-match-class.md) - Match file name to primary type name
- [`name-avoid-hungarian`](rules/name-avoid-hungarian.md) - Avoid Hungarian notation in modern C++

### 9. Type Safety (MEDIUM)

- [`type-enum-class-over-enum`](rules/type-enum-class-over-enum.md) - Use `enum class` instead of unscoped `enum`
- [`type-strong-typedef-ids`](rules/type-strong-typedef-ids.md) - Wrap raw ids/handles in strong types
- [`type-optional-nullable`](rules/type-optional-nullable.md) - Use `std::optional<T>` instead of sentinel values
- [`type-variant-over-union`](rules/type-variant-over-union.md) - Use `std::variant` instead of raw unions
- [`type-avoid-c-style-cast`](rules/type-avoid-c-style-cast.md) - Use named casts, never C-style casts
- [`type-dynamic-cast-polymorphic`](rules/type-dynamic-cast-polymorphic.md) - Use `dynamic_cast`/visitor over manual type tags
- [`type-narrowing-conversion-explicit`](rules/type-narrowing-conversion-explicit.md) - Make narrowing conversions explicit
- [`type-auto-when-clear`](rules/type-auto-when-clear.md) - Use `auto` when the type is obvious or noisy
- [`type-structured-bindings`](rules/type-structured-bindings.md) - Use structured bindings to unpack aggregates
- [`type-any-for-heterogeneous`](rules/type-any-for-heterogeneous.md) - Use `std::any` sparingly, only for real type erasure
- [`type-strongly-typed-units`](rules/type-strongly-typed-units.md) - Use strongly-typed units instead of raw numerics

### 10. Testing (MEDIUM)

- [`test-gtest-fixtures`](rules/test-gtest-fixtures.md) - Use GoogleTest fixtures (`TEST_F`) for shared setup
- [`test-catch2-sections`](rules/test-catch2-sections.md) - Use Catch2 `SECTION` for given/when/then tests
- [`test-gmock-interfaces`](rules/test-gmock-interfaces.md) - Design mockable interfaces for gMock
- [`test-arrange-act-assert`](rules/test-arrange-act-assert.md) - Structure tests as arrange/act/assert
- [`test-sanitizer-ci`](rules/test-sanitizer-ci.md) - Run sanitizer builds as part of the test suite
- [`test-fuzz-entrypoints`](rules/test-fuzz-entrypoints.md) - Provide libFuzzer entry points for parsers
- [`test-death-test-invariants`](rules/test-death-test-invariants.md) - Use death tests to verify invariant enforcement
- [`test-parameterized-tests`](rules/test-parameterized-tests.md) - Use parameterized tests instead of copy-pasted cases
- [`test-no-shared-mutable-fixture`](rules/test-no-shared-mutable-fixture.md) - Avoid shared mutable state between tests
- [`test-mock-time`](rules/test-mock-time.md) - Inject a Clock abstraction for time-dependent code

### 11. Documentation (MEDIUM)

- [`doc-doxygen-public-api`](rules/doc-doxygen-public-api.md) - Document all public API with Doxygen comments
- [`doc-brief-detailed-tags`](rules/doc-brief-detailed-tags.md) - Use `\brief`/`\param`/`\return`/`\throws` consistently
- [`doc-ownership-contract`](rules/doc-ownership-contract.md) - Document ownership/lifetime for pointer parameters
- [`doc-thread-safety-contract`](rules/doc-thread-safety-contract.md) - Document thread-safety guarantees
- [`doc-header-comment-invariants`](rules/doc-header-comment-invariants.md) - Document class invariants near the declaration
- [`doc-example-usage`](rules/doc-example-usage.md) - Provide a minimal usage example for non-trivial APIs
- [`doc-deprecated-migration`](rules/doc-deprecated-migration.md) - Document migration path for `[[deprecated]]` API
- [`doc-generated-docs-ci`](rules/doc-generated-docs-ci.md) - Build Doxygen docs in CI to catch broken references

### 12. Performance Patterns (MEDIUM)

- [`perf-move-semantics`](rules/perf-move-semantics.md) - Use `std::move` to avoid unnecessary copies
- [`perf-emplace-over-push`](rules/perf-emplace-over-push.md) - Use `emplace_back` over `push_back(T(...))`
- [`perf-reserve-known-size`](rules/perf-reserve-known-size.md) - Call `reserve()` when final size is known
- [`perf-pass-by-const-ref-large`](rules/perf-pass-by-const-ref-large.md) - Pass large objects by `const&`
- [`perf-avoid-virtual-hot-path`](rules/perf-avoid-virtual-hot-path.md) - Avoid virtual dispatch in hot inner loops
- [`perf-return-value-optimization`](rules/perf-return-value-optimization.md) - Rely on RVO/NRVO; return by value
- [`perf-avoid-shared-ptr-atomic-overhead`](rules/perf-avoid-shared-ptr-atomic-overhead.md) - Avoid `shared_ptr` atomics in hot paths
- [`perf-cache-friendly-soa`](rules/perf-cache-friendly-soa.md) - Prefer structure-of-arrays for cache-friendly loops
- [`perf-avoid-unneeded-allocation`](rules/perf-avoid-unneeded-allocation.md) - Avoid unnecessary heap allocation in loops
- [`perf-string-concatenation`](rules/perf-string-concatenation.md) - Avoid repeated string concatenation
- [`perf-algorithm-over-handwritten-loop`](rules/perf-algorithm-over-handwritten-loop.md) - Prefer `<algorithm>`/`<ranges>` over hand-written loops
- [`perf-profile-before-optimize`](rules/perf-profile-before-optimize.md) - Profile before micro-optimizing

### 13. Project Structure (LOW)

- [`proj-header-source-split`](rules/proj-header-source-split.md) - Split declarations from definitions
- [`proj-include-guards-pragma-once`](rules/proj-include-guards-pragma-once.md) - Use `#pragma once` in every header
- [`proj-avoid-circular-includes`](rules/proj-avoid-circular-includes.md) - Avoid circular includes via forward declarations
- [`proj-modules-adoption`](rules/proj-modules-adoption.md) - Consider C++20 modules where toolchain support allows
- [`proj-minimal-includes`](rules/proj-minimal-includes.md) - Include only what you use; forward-declare
- [`proj-namespace-per-library`](rules/proj-namespace-per-library.md) - Wrap library code in a project namespace
- [`proj-cmake-target-based`](rules/proj-cmake-target-based.md) - Use modern target-based CMake
- [`proj-separate-public-private-headers`](rules/proj-separate-public-private-headers.md) - Separate public and internal headers
- [`proj-precompiled-headers-large-builds`](rules/proj-precompiled-headers-large-builds.md) - Use PCH/unity builds only after profiling

### 14. Linting & Static Analysis (LOW)

- [`lint-clang-tidy-baseline`](rules/lint-clang-tidy-baseline.md) - Run clang-tidy with a curated check baseline
- [`lint-compiler-warnings-as-errors`](rules/lint-compiler-warnings-as-errors.md) - Compile with `-Wall -Wextra -Wpedantic -Werror`
- [`lint-address-sanitizer`](rules/lint-address-sanitizer.md) - Build and test regularly with AddressSanitizer
- [`lint-undefined-behavior-sanitizer`](rules/lint-undefined-behavior-sanitizer.md) - Build and test with UndefinedBehaviorSanitizer
- [`lint-thread-sanitizer`](rules/lint-thread-sanitizer.md) - Build and test concurrent code with ThreadSanitizer
- [`lint-cppcheck-static-analysis`](rules/lint-cppcheck-static-analysis.md) - Run cppcheck as a second opinion
- [`lint-clang-format-consistent`](rules/lint-clang-format-consistent.md) - Enforce a single `.clang-format` style
- [`lint-warning-free-baseline`](rules/lint-warning-free-baseline.md) - Treat new warnings as build failures
- [`lint-include-what-you-use-tool`](rules/lint-include-what-you-use-tool.md) - Run include-what-you-use to keep includes minimal

### 15. Anti-patterns (REFERENCE)

- [`anti-raw-new-delete`](rules/anti-raw-new-delete.md) - Don't use raw `new`/`delete` for ownership
- [`anti-c-style-cast`](rules/anti-c-style-cast.md) - Don't use C-style casts
- [`anti-using-namespace-std-header`](rules/anti-using-namespace-std-header.md) - Don't put `using namespace std;` in headers
- [`anti-output-parameters`](rules/anti-output-parameters.md) - Don't use output parameters when you can return a value
- [`anti-god-class`](rules/anti-god-class.md) - Don't build God classes with too many responsibilities
- [`anti-manual-memory-raii-available`](rules/anti-manual-memory-raii-available.md) - Don't hand-manage memory when RAII suffices
- [`anti-macro-for-constants`](rules/anti-macro-for-constants.md) - Don't use `#define` for constants
- [`anti-macro-for-functions`](rules/anti-macro-for-functions.md) - Don't use function-like macros over templates/inline functions
- [`anti-naked-new-in-constructor`](rules/anti-naked-new-in-constructor.md) - Don't leak resources when a constructor throws
- [`anti-shared-ptr-everywhere`](rules/anti-shared-ptr-everywhere.md) - Don't reach for `shared_ptr` as the default
- [`anti-catch-all-swallow`](rules/anti-catch-all-swallow.md) - Don't write empty `catch(...)` blocks
- [`anti-void-star-type-erasure`](rules/anti-void-star-type-erasure.md) - Don't use `void*` when templates/`variant`/`any` exist
- [`anti-non-virtual-destructor-base`](rules/anti-non-virtual-destructor-base.md) - Don't give a polymorphic base a public non-virtual destructor
- [`anti-slicing-by-value`](rules/anti-slicing-by-value.md) - Don't pass/store polymorphic types by value
- [`anti-global-mutable-state`](rules/anti-global-mutable-state.md) - Don't rely on mutable global/static state

---

## Recommended Tooling & Config

### `CMakeLists.txt` warnings and sanitizers

```cmake
add_library(myproject_warnings INTERFACE)
target_compile_options(myproject_warnings INTERFACE
  $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall -Wextra -Wpedantic -Wshadow
    -Wconversion -Wsign-conversion -Wnon-virtual-dtor -Wold-style-cast
    -Woverloaded-virtual -Wnull-dereference -Wdouble-promotion
    -Werror>
  $<$<CXX_COMPILER_ID:MSVC>:/W4 /permissive- /WX>
)

option(ENABLE_SANITIZERS "Build with ASan+UBSan" OFF)
if(ENABLE_SANITIZERS)
  add_compile_options(-fsanitize=address,undefined -fno-omit-frame-pointer)
  add_link_options(-fsanitize=address,undefined)
endif()

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

target_link_libraries(my_target PRIVATE myproject_warnings)
```

### `.clang-tidy`

```yaml
Checks: >
  -*,
  bugprone-*,
  clang-analyzer-*,
  cppcoreguidelines-*,
  -cppcoreguidelines-avoid-magic-numbers,
  modernize-*,
  -modernize-use-trailing-return-type,
  performance-*,
  portability-*,
  readability-*,
  -readability-magic-numbers,
  -readability-identifier-length

WarningsAsErrors: 'bugprone-*,clang-analyzer-*,cppcoreguidelines-slicing'
HeaderFilterRegex: '^(include|src)/'
FormatStyle: file
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing C++ code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New class/struct | `raii-`, `own-`, `api-` |
| New free function | `err-`, `name-`, `type-` |
| Ownership/lifetime review | `own-`, `mem-`, `raii-` |
| Error handling | `err-`, `api-` |
| Generic/template code | `tmpl-`, `type-` |
| Concurrent code | `conc-`, `own-`, `mem-` |
| Performance tuning | `perf-`, `mem-`, `conc-` |
| Code review | `anti-`, `lint-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) - choosing and implementing GoF and idiomatic design patterns (also covers C++: RAII-based patterns, CRTP, PIMPL).
- [security-review](../security-review/SKILL.md) - security-audit checklists (memory safety, integer overflow, injection, concurrency hazards) for reviewing/auditing C++.
- `c-coding` - sibling skill for plain C (manual memory management, no classes/templates/exceptions, C ABI). Use `cpp-coding` for idiomatic modern C++ with RAII, smart pointers, templates, and the STL; use `c-coding` when the codebase is C or a C-compatible subset.

## Sources

This skill synthesizes best practices from:
- [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines) (Stroustrup/Sutter)
- *Effective Modern C++* by Scott Meyers
- [cppreference.com](https://en.cppreference.com/) per-standard feature documentation
- [CERT C++ Coding Standard](https://wiki.sei.cmu.edu/confluence/display/cplusplus)
- Production codebases: LLVM, Chromium, Abseil, Folly
- clang-tidy / `cppcoreguidelines-*` and `modernize-*` check documentation
- Community conventions (2024-2026)
