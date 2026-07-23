---
name: zig-coding
description: "Comprehensive idiomatic Zig guidance: 177 prioritized rules across 15 categories covering allocators, comptime, error unions, and safety modes. Use when writing, reviewing, refactoring, optimizing, or debugging Zig (`.zig` files, `build.zig`, `build.zig.zon`). Zig is pre-1.0: std-lib APIs, ArrayList/HashMap shapes, and build.zig fields churn between releases — defer to the project's declared Zig version (build.zig.zon `minimum_zig_version`) over any specific API shape shown here."
compatibility: opencode
metadata:
  domain: zig
  audience: software-engineer
  edition: project-declared
---

# Zig Best Practices

Comprehensive guide for writing high-quality, idiomatic Zig code. Contains 177 rules across 15 categories, prioritized by impact. Zig has no borrow checker, no exceptions, no operator overloading, and no hidden allocation — its core discipline is explicit allocators, `comptime` generics, and error unions (`!T`) instead of ownership tracking. Project constraints override generic defaults: preserve the declared Zig version and any project-specific allocator/build conventions unless the user explicitly requests a migration.

## When to Apply

Reference these guidelines when:
- Writing new Zig functions, structs, or modules
- Choosing and threading `std.mem.Allocator` through a call graph
- Designing error sets and `!T`/`?T` return shapes
- Writing `comptime`-generic functions or data structures
- Reviewing code for leaked allocations or unchecked `.?`/`unreachable` usage
- Optimizing hot paths or tuning build/safety modes
- Interfacing with C via `@cImport`/`export fn`
- Refactoring existing Zig code or updating `build.zig`/`build.zig.zon`

## Zig Is Pre-1.0: Version Discipline Matters

Zig has no stable 1.0 release; the language and standard library both still change between minor versions (0.11 removed language-level `async`/`await`; `ArrayList`/`HashMap` field-default and managed/unmanaged conventions have shifted across releases; `build.zig`/`build.zig.zon` fields have been renamed and restructured more than once). Treat every std-lib API shape shown in this skill as illustrative, and verify it against the project's actually declared and verified Zig version before relying on exact signatures:

```zig
// build.zig.zon
.{
    .name = "my_project",
    .version = "0.1.0",
    .minimum_zig_version = "0.13.0", // the authoritative version for this project
}
```

The language and library features below are current, idiomatic Zig practice as of 0.13/0.14 and the active `master`/dev branch, applied consistently across this skill:

- **`comptime` generics, not a separate generics syntax.** A function returning `type`, parameterized by `comptime` arguments, is how Zig expresses generic types and functions — there is no `<T>`/`template<T>` syntax to learn separately.
- **Error unions (`!T`) and named error sets**, not exceptions. Every fallible function's signature says so; `try`/`catch`/`errdefer` are the only propagation and recovery mechanisms.
- **Explicit allocators.** `std.mem.Allocator` is passed as an ordinary parameter everywhere allocation happens — there is no global/default heap.
- **`defer`/`errdefer` for cleanup**, not destructors or RAII — Zig has neither, so `defer` discipline is the only cleanup mechanism.
- **No hidden allocations, no exceptions, no operator overloading.** A function's signature and body are a complete, honest description of what it can do.
- **Tagged unions (`union(enum)`)** for closed variant sets, with compiler-enforced exhaustive `switch`.
- **No language-level `async`/`await`** in current releases (removed pending redesign) — concurrency is expressed with `std.Thread` and, in some ecosystems, library-level event loops.

Everything below applies across recent versions; where a specific API name or shape is likely to have changed, the rule says so explicitly and points at checking the project's declared version.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Allocators & Memory Management | CRITICAL | `alloc-` | 14 |
| 2 | Error Handling | CRITICAL | `err-` | 13 |
| 3 | Comptime & Generics | CRITICAL | `comptime-` | 12 |
| 4 | Optionals & Control Flow | HIGH | `opt-` | 12 |
| 5 | Slices & Arrays | HIGH | `slice-` | 10 |
| 6 | API/Struct Design | HIGH | `api-` | 14 |
| 7 | Naming Conventions | MEDIUM | `name-` | 12 |
| 8 | Testing | MEDIUM | `test-` | 12 |
| 9 | Documentation | MEDIUM | `doc-` | 10 |
| 10 | Performance Patterns | MEDIUM | `perf-` | 12 |
| 11 | C Interop | MEDIUM | `interop-` | 10 |
| 12 | Project Structure | LOW | `proj-` | 12 |
| 13 | Linting & Safety Modes | LOW | `lint-` | 10 |
| 14 | Concurrency | MEDIUM | `conc-` | 8 |
| 15 | Anti-patterns | REFERENCE | `anti-` | 16 |

---

## Quick Reference

### 1. Allocators & Memory Management (CRITICAL)

- [`alloc-explicit-param`](rules/alloc-explicit-param.md) - Pass `std.mem.Allocator` explicitly as a parameter
- [`alloc-no-global`](rules/alloc-no-global.md) - Avoid global or hidden allocator state
- [`alloc-gpa-debug`](rules/alloc-gpa-debug.md) - Use `GeneralPurposeAllocator` in debug/dev builds
- [`alloc-arena-scoped`](rules/alloc-arena-scoped.md) - Use `ArenaAllocator` for request/batch-scoped work
- [`alloc-fixed-buffer`](rules/alloc-fixed-buffer.md) - Use `FixedBufferAllocator` for bounded stack-backed allocations
- [`alloc-page-allocator`](rules/alloc-page-allocator.md) - Reach for `page_allocator` sparingly, for coarse allocations
- [`alloc-defer-free`](rules/alloc-defer-free.md) - Pair every allocation with `defer allocator.free(...)`
- [`alloc-errdefer-cleanup`](rules/alloc-errdefer-cleanup.md) - Use `errdefer` for cleanup on error-only paths
- [`alloc-init-deinit-pair`](rules/alloc-init-deinit-pair.md) - Store the allocator and pair `init` with `deinit`
- [`alloc-arraylist-managed`](rules/alloc-arraylist-managed.md) - Know managed vs. unmanaged container conventions
- [`alloc-testing-allocator`](rules/alloc-testing-allocator.md) - Use `std.testing.allocator` to catch leaks in tests
- [`alloc-avoid-hidden`](rules/alloc-avoid-hidden.md) - Make every allocation visible in the function signature
- [`alloc-free-order`](rules/alloc-free-order.md) - Free nested/owned members in reverse acquisition order
- [`alloc-capacity-hint`](rules/alloc-capacity-hint.md) - Pre-size containers when the count is known

### 2. Error Handling (CRITICAL)

- [`err-error-union-return`](rules/err-error-union-return.md) - Return `!T` as the default fallible-return shape
- [`err-error-set-explicit`](rules/err-error-set-explicit.md) - Declare explicit error sets at public API boundaries
- [`err-error-set-inferred`](rules/err-error-set-inferred.md) - Allow inferred error sets for internal helpers
- [`err-try-propagate`](rules/err-try-propagate.md) - Use `try` for clean propagation
- [`err-catch-handle`](rules/err-catch-handle.md) - Use `catch |err|` to actually handle, not just silence
- [`err-errdefer-rollback`](rules/err-errdefer-rollback.md) - Use `errdefer` for rollback on partial success
- [`err-no-unreachable-recoverable`](rules/err-no-unreachable-recoverable.md) - Never use `unreachable` for a recoverable error
- [`err-orelse-optional`](rules/err-orelse-optional.md) - Use `orelse` for optionals, keep it distinct from `catch`
- [`err-merge-error-sets`](rules/err-merge-error-sets.md) - Merge error sets with `||` deliberately, avoid `anyerror`
- [`err-anyerror-boundary`](rules/err-anyerror-boundary.md) - Reserve `anyerror` for genuinely open-ended boundaries
- [`err-error-payload`](rules/err-error-payload.md) - Attach context via logging/out-params since errors carry none
- [`err-switch-exhaustive-err`](rules/err-switch-exhaustive-err.md) - Exhaustively switch on error sets when recovery differs
- [`err-return-vs-log`](rules/err-return-vs-log.md) - Return errors up the stack instead of logging-and-swallowing

### 3. Comptime & Generics (CRITICAL)

- [`comptime-generic-param`](rules/comptime-generic-param.md) - Use `comptime` type parameters for generic functions
- [`comptime-anytype-discipline`](rules/comptime-anytype-discipline.md) - Use `anytype` sparingly, prefer named `comptime T`
- [`comptime-typeinfo-reflect`](rules/comptime-typeinfo-reflect.md) - Use `@typeInfo` for compile-time reflection
- [`comptime-generic-struct`](rules/comptime-generic-struct.md) - Build generic types via a function returning `type`
- [`comptime-config-validate`](rules/comptime-config-validate.md) - Validate compile-time invariants in a `comptime` block
- [`comptime-block-compute`](rules/comptime-block-compute.md) - Precompute values once at compile time
- [`comptime-avoid-bloat`](rules/comptime-avoid-bloat.md) - Avoid comptime bloat from excessive instantiation
- [`comptime-duck-interface`](rules/comptime-duck-interface.md) - Use comptime duck typing for closed-set static dispatch
- [`comptime-known-int`](rules/comptime-known-int.md) - Let `comptime_int`/`comptime_float` do arbitrary-precision math
- [`comptime-inline-for`](rules/comptime-inline-for.md) - Use `inline for` to unroll over compile-time-known sequences
- [`comptime-compile-error`](rules/comptime-compile-error.md) - Use `@compileError` for clear generic constraint failures
- [`comptime-specialize-branch`](rules/comptime-specialize-branch.md) - Use `if (comptime ...)` to specialize per type

### 4. Optionals & Control Flow (HIGH)

- [`opt-optional-type`](rules/opt-optional-type.md) - Use `?T` for values that may legitimately be absent
- [`opt-orelse-default`](rules/opt-orelse-default.md) - Use `orelse` for defaults, early-return, or panic
- [`opt-if-capture`](rules/opt-if-capture.md) - Use `if (x) |val|` to safely unwrap an optional
- [`opt-while-capture`](rules/opt-while-capture.md) - Use `while (iter.next()) |item|` for iterator-style loops
- [`opt-avoid-force-unwrap`](rules/opt-avoid-force-unwrap.md) - Avoid `.?` outside provably-safe contexts
- [`opt-switch-exhaustive`](rules/opt-switch-exhaustive.md) - Rely on exhaustive `switch` over enums/tagged unions
- [`opt-switch-else-explicit`](rules/opt-switch-else-explicit.md) - Use `else` prongs deliberately, not as a reflex
- [`opt-labeled-break`](rules/opt-labeled-break.md) - Use labeled blocks/loops instead of boolean flags
- [`opt-labeled-block-value`](rules/opt-labeled-block-value.md) - Use a labeled block to produce a value
- [`opt-nested-optional-avoid`](rules/opt-nested-optional-avoid.md) - Avoid nested optional/error-union confusion
- [`opt-null-vs-error`](rules/opt-null-vs-error.md) - Choose `?T` vs `!T` based on whether absence has a reason
- [`opt-optional-pointer`](rules/opt-optional-pointer.md) - Use `?*T` instead of a sentinel address

### 5. Slices & Arrays (HIGH)

- [`slice-prefer-over-array-ptr`](rules/slice-prefer-over-array-ptr.md) - Accept `[]const T` instead of fixed arrays/pointers
- [`slice-const-when-readonly`](rules/slice-const-when-readonly.md) - Use `[]const T` for read-only slice parameters
- [`slice-sentinel-terminated`](rules/slice-sentinel-terminated.md) - Use `[:0]const u8` at C-string boundaries
- [`slice-many-item-ptr`](rules/slice-many-item-ptr.md) - Understand `[*]T` vs `[]T` vs `*T`
- [`slice-bounds-safety`](rules/slice-bounds-safety.md) - Rely on Debug/ReleaseSafe bounds checking
- [`slice-array-vs-slice`](rules/slice-array-vs-slice.md) - Fixed array for compile-time size, slice for runtime size
- [`slice-string-as-u8`](rules/slice-string-as-u8.md) - Treat strings as `[]const u8`, there's no `String` type
- [`slice-concat-alloc`](rules/slice-concat-alloc.md) - Build strings with `std.mem.concat`/`allocPrint` explicitly
- [`slice-iterate-native`](rules/slice-iterate-native.md) - Iterate with `for (items) |item|`, not manual indexing
- [`slice-avoid-copy`](rules/slice-avoid-copy.md) - Pass slices by reference semantics, avoid unnecessary copies

### 6. API/Struct Design (HIGH)

- [`api-init-deinit-convention`](rules/api-init-deinit-convention.md) - Follow `init`/`deinit` for resource-owning types
- [`api-struct-methods`](rules/api-struct-methods.md) - Use struct methods for behavior tied to a type
- [`api-tagged-union-variants`](rules/api-tagged-union-variants.md) - Use `union(enum)` for closed variant sets
- [`api-explicit-fallibility`](rules/api-explicit-fallibility.md) - Keep signatures honest about failure and allocation
- [`api-no-hidden-control-flow`](rules/api-no-hidden-control-flow.md) - No exceptions, no operator overloading, no surprises
- [`api-self-value-vs-ptr`](rules/api-self-value-vs-ptr.md) - Choose `self: Self` vs `self: *Self` deliberately
- [`api-public-fields-vs-methods`](rules/api-public-fields-vs-methods.md) - Fields for data bags, methods to guard invariants
- [`api-options-struct`](rules/api-options-struct.md) - Use an Options/Config struct for many optional parameters
- [`api-error-union-in-init`](rules/api-error-union-in-init.md) - Surface init/allocation failure via `!T`, not a panic
- [`api-comptime-interface`](rules/api-comptime-interface.md) - Document comptime "interfaces" as a method contract
- [`api-vtable-dynamic`](rules/api-vtable-dynamic.md) - Use an explicit vtable for genuine runtime polymorphism
- [`api-avoid-god-struct`](rules/api-avoid-god-struct.md) - Split responsibilities instead of one god-struct
- [`api-return-error-union-not-optional-mix`](rules/api-return-error-union-not-optional-mix.md) - Stay consistent between `?T` and `!T` in one API
- [`api-namespace-file`](rules/api-namespace-file.md) - Use a file as an implicit namespace

### 7. Naming Conventions (MEDIUM)

- [`name-types-titlecase`](rules/name-types-titlecase.md) - `TitleCase` for structs, enums, unions, error sets
- [`name-funcs-camelcase`](rules/name-funcs-camelcase.md) - `camelCase` for functions, methods, variables
- [`name-consts-screaming-or-camel`](rules/name-consts-screaming-or-camel.md) - `SCREAMING_SNAKE_CASE` sparingly, `camelCase` otherwise
- [`name-files-as-namespace`](rules/name-files-as-namespace.md) - Name a file to match the namespace it exposes
- [`name-error-set-members`](rules/name-error-set-members.md) - Name error members descriptively in `TitleCase`
- [`name-fields-snake-or-camel`](rules/name-fields-snake-or-camel.md) - `snake_case` for struct fields
- [`name-bool-is-has`](rules/name-bool-is-has.md) - `is`/`has`/`can` prefixes for boolean-returning functions
- [`name-generic-type-param`](rules/name-generic-type-param.md) - Descriptive names for multi-role type parameters
- [`name-acronym-case`](rules/name-acronym-case.md) - Treat acronyms as ordinary words: `Uri`, not `URI`
- [`name-underscore-unused`](rules/name-underscore-unused.md) - Use `_ = x;` to discard intentionally-unused values
- [`name-test-description`](rules/name-test-description.md) - Give `test` blocks descriptive string names
- [`name-no-hungarian`](rules/name-no-hungarian.md) - Avoid Hungarian notation and redundant type-in-name prefixes

### 8. Testing (MEDIUM)

- [`test-builtin-test-block`](rules/test-builtin-test-block.md) - Use built-in `test` blocks colocated with code
- [`test-std-testing-expect`](rules/test-std-testing-expect.md) - Use `expectEqual`/`expectEqualStrings` for clear assertions
- [`test-testing-allocator-leak`](rules/test-testing-allocator-leak.md) - Use `std.testing.allocator` to catch leaks automatically
- [`test-arrange-act-assert`](rules/test-arrange-act-assert.md) - Structure tests as arrange/act/assert
- [`test-error-union-expect`](rules/test-error-union-expect.md) - Use `expectError` for specific error assertions
- [`test-fuzz-input`](rules/test-fuzz-input.md) - Use built-in fuzz testing for parsers and untrusted input
- [`test-refAllDecls`](rules/test-refAllDecls.md) - Ensure tests in imported files are actually discovered
- [`test-doc-comment-example`](rules/test-doc-comment-example.md) - Mirror doc examples as real, runnable tests
- [`test-separate-test-file`](rules/test-separate-test-file.md) - Separate files for larger integration scenarios
- [`test-table-driven`](rules/test-table-driven.md) - Use a case table and loop for similar inputs
- [`test-zig-test-command`](rules/test-zig-test-command.md) - Run `zig build test` in CI on every change
- [`test-mock-dependency`](rules/test-mock-dependency.md) - Inject fakes via `anytype`/vtable, not a mocking framework

### 9. Documentation (MEDIUM)

- [`doc-doc-comment-slash3`](rules/doc-doc-comment-slash3.md) - Use `///` on public declarations
- [`doc-module-doc-slash2`](rules/doc-module-doc-slash2.md) - Use `//!` for module-level documentation
- [`doc-error-set-document`](rules/doc-error-set-document.md) - Document error sets and when each fires
- [`doc-allocator-ownership`](rules/doc-allocator-ownership.md) - Document allocator/ownership contracts explicitly
- [`doc-params-return`](rules/doc-params-return.md) - Document non-obvious parameters, returns, side effects
- [`doc-examples-runnable`](rules/doc-examples-runnable.md) - Include runnable examples, mirrored by a test
- [`doc-safety-invariants`](rules/doc-safety-invariants.md) - Document invariants behind `unreachable`/disabled safety
- [`doc-readme-build`](rules/doc-readme-build.md) - Maintain a README documenting build/test/dependency use
- [`doc-changelog-version`](rules/doc-changelog-version.md) - Document Zig-version compatibility and breaking changes
- [`doc-public-api-only`](rules/doc-public-api-only.md) - Reserve full doc comments for `pub` declarations

### 10. Performance Patterns (MEDIUM)

- [`perf-avoid-alloc-hot-path`](rules/perf-avoid-alloc-hot-path.md) - Avoid allocating inside hot loops
- [`perf-comptime-lookup-table`](rules/perf-comptime-lookup-table.md) - Precompute lookup tables at compile time
- [`perf-slice-over-copy`](rules/perf-slice-over-copy.md) - Use slice views to avoid unnecessary copies
- [`perf-vector-simd`](rules/perf-vector-simd.md) - Use `@Vector` for data-parallel numeric operations
- [`perf-packed-struct`](rules/perf-packed-struct.md) - Use `packed struct` for memory-dense layouts
- [`perf-arraylist-capacity`](rules/perf-arraylist-capacity.md) - Pre-size `ArrayList` before a known bulk append
- [`perf-inline-hint`](rules/perf-inline-hint.md) - Use `inline` sparingly, for small, genuinely hot functions
- [`perf-release-fast-hotpath`](rules/perf-release-fast-hotpath.md) - Reach for `ReleaseFast` only on profiled hot paths
- [`perf-avoid-anytype-cost`](rules/perf-avoid-anytype-cost.md) - Avoid `anytype` fan-out bloat on hot generic paths
- [`perf-struct-of-arrays`](rules/perf-struct-of-arrays.md) - Struct-of-arrays for cache-friendly large-dataset iteration
- [`perf-comptime-format`](rules/perf-comptime-format.md) - Use comptime-known format strings for `std.fmt`
- [`perf-benchmark-before`](rules/perf-benchmark-before.md) - Profile before applying any of the above

### 11. C Interop (MEDIUM)

- [`interop-cimport-cinclude`](rules/interop-cimport-cinclude.md) - Use `@cImport`/`@cInclude` for C headers
- [`interop-c-abi-types`](rules/interop-c-abi-types.md) - Translate C ABI types with `c_int`/`c_long` correctly
- [`interop-export-c-calling-convention`](rules/interop-export-c-calling-convention.md) - Use `export fn` to expose Zig to C
- [`interop-extern-struct`](rules/interop-extern-struct.md) - Use `extern struct` for C-compatible layout
- [`interop-zig-as-c-compiler`](rules/interop-zig-as-c-compiler.md) - Use `zig cc`/`zig c++` as a drop-in C compiler
- [`interop-null-terminated-strings`](rules/interop-null-terminated-strings.md) - Handle C strings explicitly at the boundary
- [`interop-callconv-explicit`](rules/interop-callconv-explicit.md) - Mark non-default calling conventions explicitly
- [`interop-build-linklibc`](rules/interop-build-linklibc.md) - Link libc explicitly when calling C-dependent APIs
- [`interop-opaque-type`](rules/interop-opaque-type.md) - Use `opaque {}` for FFI handles with hidden internals
- [`interop-error-boundary-c`](rules/interop-error-boundary-c.md) - Translate error unions to C-friendly status codes

### 12. Project Structure (LOW)

- [`proj-build-zig-module`](rules/proj-build-zig-module.md) - Organize `build.zig` around explicit modules
- [`proj-build-zig-zon-deps`](rules/proj-build-zig-zon-deps.md) - Manage dependencies via `build.zig.zon` with pinned hashes
- [`proj-src-root-module`](rules/proj-src-root-module.md) - Separate `root.zig` library logic from `main.zig`
- [`proj-flat-small`](rules/proj-flat-small.md) - Keep small projects flat
- [`proj-pub-visibility`](rules/proj-pub-visibility.md) - Default to file-private, expose only the real contract
- [`proj-package-boundaries`](rules/proj-package-boundaries.md) - Draw boundaries around cohesive functionality
- [`proj-build-steps-custom`](rules/proj-build-steps-custom.md) - Define custom `b.step` targets for common tasks
- [`proj-vendored-vs-zon`](rules/proj-vendored-vs-zon.md) - Prefer `build.zig.zon` deps over vendoring, with exceptions
- [`proj-workspace-multi-package`](rules/proj-workspace-multi-package.md) - Coordinate multi-package repos from a root build
- [`proj-examples-dir`](rules/proj-examples-dir.md) - Keep runnable examples wired into `build.zig`
- [`proj-version-pin`](rules/proj-version-pin.md) - Pin the declared Zig version in `build.zig.zon`
- [`proj-cross-compile-targets`](rules/proj-cross-compile-targets.md) - Declare and test supported cross-compile targets

### 13. Linting & Safety Modes (LOW)

- [`lint-debug-default`](rules/lint-debug-default.md) - Default to `Debug` during development
- [`lint-releasesafe-prod`](rules/lint-releasesafe-prod.md) - Use `ReleaseSafe` in production by default
- [`lint-releasefast-hotpath`](rules/lint-releasefast-hotpath.md) - Reserve `ReleaseFast` for profiled hot paths
- [`lint-releasesmall-embedded`](rules/lint-releasesmall-embedded.md) - Use `ReleaseSmall` for size-constrained targets
- [`lint-zig-fmt-ci`](rules/lint-zig-fmt-ci.md) - Run `zig fmt --check` in CI
- [`lint-zig-fmt-precommit`](rules/lint-zig-fmt-precommit.md) - Run `zig fmt` locally before committing
- [`lint-sanitize-undefined`](rules/lint-sanitize-undefined.md) - Trust Debug/ReleaseSafe's built-in safety checks
- [`lint-build-mode-per-target`](rules/lint-build-mode-per-target.md) - Distinct optimize modes per build target
- [`lint-warnings-as-errors`](rules/lint-warnings-as-errors.md) - Treat warnings/deprecations as blocking in CI
- [`lint-avoid-suppress-safety`](rules/lint-avoid-suppress-safety.md) - Avoid `@setRuntimeSafety(false)` outside justified hot paths

### 14. Concurrency (MEDIUM)

- [`conc-thread-spawn`](rules/conc-thread-spawn.md) - Use `std.Thread.spawn` with explicit `join`
- [`conc-mutex-guard`](rules/conc-mutex-guard.md) - Use `std.Thread.Mutex` to guard shared mutable state
- [`conc-atomic-ops`](rules/conc-atomic-ops.md) - Use `std.atomic` for lock-free counters/flags
- [`conc-once-init`](rules/conc-once-init.md) - Use `std.once` for one-time initialization
- [`conc-threadsafe-allocator`](rules/conc-threadsafe-allocator.md) - Wrap/choose a thread-safe allocator when sharing
- [`conc-condition-variable`](rules/conc-condition-variable.md) - Use `std.Thread.Condition` for wait/notify coordination
- [`conc-avoid-shared-mutable`](rules/conc-avoid-shared-mutable.md) - Prefer message passing over locking shared state
- [`conc-no-async-await`](rules/conc-no-async-await.md) - No language-level async/await; use threads instead

### 15. Anti-patterns (REFERENCE)

- [`anti-leak-missing-free`](rules/anti-leak-missing-free.md) - Don't leak allocations by missing `defer`/`free`
- [`anti-global-allocator`](rules/anti-global-allocator.md) - Don't use a global allocator instead of threading one through
- [`anti-force-unwrap-optional`](rules/anti-force-unwrap-optional.md) - Don't reach for `.?` as a shortcut
- [`anti-ignore-error-union`](rules/anti-ignore-error-union.md) - Don't discard error unions silently with `catch {}`
- [`anti-anytype-overuse`](rules/anti-anytype-overuse.md) - Don't overuse `anytype` where a constrained type belongs
- [`anti-comptime-bloat`](rules/anti-comptime-bloat.md) - Don't let unchecked generic instantiation balloon builds
- [`anti-catch-unreachable-abuse`](rules/anti-catch-unreachable-abuse.md) - Don't use `catch unreachable` on fallible ops
- [`anti-undefined-uninit`](rules/anti-undefined-uninit.md) - Don't read `undefined` memory before initializing it
- [`anti-manual-c-string-bugs`](rules/anti-manual-c-string-bugs.md) - Don't hand-roll C string null-termination
- [`anti-panic-for-recoverable`](rules/anti-panic-for-recoverable.md) - Don't `@panic` on a recoverable condition
- [`anti-mixed-allocator-free`](rules/anti-mixed-allocator-free.md) - Don't free with a different allocator than allocated
- [`anti-arena-in-long-lived`](rules/anti-arena-in-long-lived.md) - Don't use an arena for unbounded/long-lived data
- [`anti-copy-large-struct`](rules/anti-copy-large-struct.md) - Don't copy large structs by value unnecessarily
- [`anti-hardcoded-buffer-size`](rules/anti-hardcoded-buffer-size.md) - Don't hardcode buffer sizes without a checked bound
- [`anti-string-concat-loop`](rules/anti-string-concat-loop.md) - Don't repeatedly `allocPrint`/`concat` in a loop
- [`anti-ignore-safety-mode`](rules/anti-ignore-safety-mode.md) - Don't ship `ReleaseFast` never tested under safety checks

---

## Recommended `build.zig`/`build.zig.zon` Settings

```zig
// build.zig.zon
.{
    .name = "my_project",
    .version = "0.1.0",
    .minimum_zig_version = "0.13.0", // the lowest version this project actually verifies
    .dependencies = .{},
    .paths = .{""},
}
```

```zig
// build.zig
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{}); // defaults to Debug for local dev

    const lib_mod = b.addModule("app_lib", .{
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
    });

    const exe = b.addExecutable(.{
        .name = "app",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize, // Debug locally; CI builds ReleaseSafe/ReleaseFast explicitly per below
    });
    exe.root_module.addImport("app_lib", lib_mod);
    b.installArtifact(exe);

    // Tests always run under a safety-checked mode, regardless of -Doptimize.
    const tests = b.addTest(.{
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = .Debug,
    });
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&b.addRunArtifact(tests).step);

    const fmt_check = b.addFmt(.{ .paths = &.{ "src", "build.zig" }, .check = true });
    const fmt_step = b.step("fmt-check", "Check formatting without modifying files");
    fmt_step.dependOn(&fmt_check.step);
}
```

```sh
# Per build-type recommendation:
zig build                          # Debug: full safety checks, fast compile — local dev default
zig build test                     # tests always run safety-checked (Debug/ReleaseSafe)
zig build -Doptimize=ReleaseSafe   # production default: optimized + safety checks retained
zig build -Doptimize=ReleaseFast   # only for profiled, safety-audited hot paths (see lint-releasefast-hotpath)
zig build -Doptimize=ReleaseSmall  # size-constrained targets: embedded, WASM
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing Zig code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples
5. **Verify std-lib/build.zig API shapes** against the project's declared Zig version before trusting an exact signature

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New function | `alloc-`, `err-`, `name-` |
| New struct/API | `api-`, `opt-`, `doc-` |
| Generic code | `comptime-`, `api-` |
| Error handling | `err-`, `opt-` |
| Memory management | `alloc-`, `slice-`, `perf-` |
| Performance tuning | `perf-`, `lint-`, `slice-` |
| C interop | `interop-`, `slice-` |
| Concurrency | `conc-`, `alloc-` |
| Code review | `anti-`, `lint-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) - choosing and implementing GoF and idiomatic patterns (tagged unions, comptime interfaces, and vtables in Zig; equivalent idioms in other languages).
- [security-review](../security-review/SKILL.md) - multi-language security-audit checklists (memory safety, FFI, concurrency, panic-DoS finders) applicable to Zig's manual-memory and C-interop surface.
- [c-coding](../c-coding/SKILL.md) - the C-side conventions relevant whenever Zig code crosses an FFI boundary via `@cImport`/`export fn`/`extern struct`.

## Sources

This skill synthesizes best practices from:
- [Zig Language Reference](https://ziglang.org/documentation/master/) (tracks the current release/dev docs)
- [ziglang.org Learn guides](https://ziglang.org/learn/) and official getting-started material
- "Zig in Depth" and other community learning resources covering comptime, allocators, and error handling
- Production codebases: the Zig standard library itself, TigerBeetle, Bun's Zig components
- Community conventions and style guidance from the Zig core team and active contributors (2024-2025)
