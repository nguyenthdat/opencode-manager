---
name: go-coding
description: "Comprehensive idiomatic Go guidance: 166 prioritized rules across 14 categories, covering error handling, concurrency, memory/performance, API design, generics, HTTP/server idioms, type safety, testing, and anti-patterns. Use when writing, reviewing, refactoring, optimizing, or debugging Go (`.go` files, `go.mod`, `go.work`). Preserve the target project's declared Go version and module layout; apply 1.22+ loop-variable scoping, 1.23+ range-over-func iterators, and 1.24+ generic/tooling guidance only when the project's go.mod actually targets that version."
compatibility: opencode
metadata:
  domain: go
  audience: software-engineer
  edition: project-declared
---

# Go Best Practices

Comprehensive guide for writing high-quality, idiomatic Go code. Contains 166 rules across 14 categories, prioritized by impact. Project constraints override generic defaults: preserve the declared Go version (the `go` directive in `go.mod`), module layout, and dependency policy unless the user explicitly requests a change.

## When to Apply

Reference these guidelines when:
- Writing new Go functions, types, or packages
- Implementing error handling or concurrent code
- Designing public APIs for a library or service
- Reviewing code for goroutine/channel/mutex correctness
- Optimizing memory usage or reducing allocations
- Building HTTP servers, clients, or middleware
- Refactoring existing Go code
- Setting up or tightening `golangci-lint` configuration
- Migrating a module to a newer Go version (1.22, 1.23, 1.24+)

## Modern Go (1.22 - 1.24+)

Go's compatibility promise means old code keeps working, but each recent release changed defaults or added standard-library tools worth adopting deliberately once a project's `go.mod` actually declares that minimum version:

```go
// go.mod
module example.com/myproject

go 1.24   // raise this only to the lowest version your project actually verifies
```

- **Per-iteration loop variables (Go 1.22).** `for i, v := range xs` now creates a *new* `i`/`v` for each iteration instead of reusing one variable for the whole loop. The classic `go func() { use(v) }()` closure-capture bug inside a loop is fixed by default for any module whose `go.mod` declares `go 1.22` or later - no more `v := v` workaround needed in new code, though it remains harmless to keep in code that must still build under older `go` directives.
- **`range` over integers (Go 1.22).** `for i := range 10 { ... }` iterates `i` from `0` to `9` - a concise replacement for `for i := 0; i < 10; i++` in the common case of simply counting.
- **Enhanced `net/http.ServeMux` (Go 1.22).** The standard router now supports method matching and wildcard path segments natively: `mux.HandleFunc("GET /users/{id}", handler)`, with `r.PathValue("id")` to read it - closing much of the gap that used to require a third-party router by default (see `http-router-choice`).
- **`min`, `max`, `clear` builtins (Go 1.21).** `min(a, b)`, `max(a, b, c)`, and `clear(m)` (empties a map or zeroes a slice) are built-in functions, replacing small hand-written helpers.
- **`slices`, `maps`, `cmp` standard packages (Go 1.21).** Generic, well-tested implementations of common slice/map operations and ordering comparisons - prefer these over hand-rolled loops (see `gen-slices-package`, `gen-maps-package`, `gen-cmp-package`).
- **Structured logging with `log/slog` (Go 1.21).** A standard structured/leveled logging API (`slog.Info("msg", "key", value)`) - prefer it over ad hoc `log.Printf` formatting for anything that feeds log aggregation or needs typed fields.
- **`range` over functions / iterators (Go 1.23).** `for v := range seq` now works over a function of type `func(yield func(V) bool)` (or the `(K, V)` two-value form), enabling custom, lazily-evaluated iterators - `maps.Keys`/`maps.Values`/`slices.Values` return these iterator types directly.
- **`testing.B.Loop()` (Go 1.24).** A cleaner benchmark loop that keeps setup code outside the timed region and prevents the compiler from eliminating a benchmark's side-effect-free result (see `test-benchmark-b-loop`).
- **Generic type aliases (Go 1.24).** Type aliases (`type Set[T comparable] = map[T]struct{}`) can now themselves be parameterized, useful for naming a generic instantiation without introducing a new defined type.
- **`go.work` workspace mode (Go 1.18+, broadly adopted).** For local, simultaneous development across multiple modules that depend on each other, prefer a `go.work` file over temporary `replace` directives in `go.mod` (see `proj-go-work-multi-module`).
- **Weak pointers and `runtime.AddCleanup` (Go 1.24).** New low-level primitives (`weak.Pointer[T]`, a safer successor to `runtime.SetFinalizer`) for advanced cache/memory-management use cases - niche, but worth knowing about if building a cache that must not prevent garbage collection.

Always check the project's actual `go` directive in `go.mod` (and its CI matrix) before assuming a given version's features are available - a library targeting broad compatibility may deliberately lag behind the latest release.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Error Handling | CRITICAL | `err-` | 14 |
| 2 | Concurrency | CRITICAL | `conc-` | 16 |
| 3 | Memory & Performance | CRITICAL | `mem-` | 15 |
| 4 | API & Interface Design | HIGH | `api-` | 13 |
| 5 | Generics | HIGH | `gen-` | 8 |
| 6 | HTTP & Server Idioms | HIGH | `http-` | 10 |
| 7 | Type Safety | HIGH/MEDIUM | `type-` | 10 |
| 8 | Struct & Composition Patterns | MEDIUM | `struct-` | 8 |
| 9 | Naming Conventions | MEDIUM | `name-` | 12 |
| 10 | Testing | MEDIUM | `test-` | 14 |
| 11 | Documentation | MEDIUM | `doc-` | 9 |
| 12 | Project Structure | LOW | `proj-` | 10 |
| 13 | Linting | LOW | `lint-` | 11 |
| 14 | Anti-patterns | REFERENCE | `anti-` | 16 |

---

## Quick Reference

### 1. Error Handling (CRITICAL)

- [`err-as-type-assert`](rules/err-as-type-assert.md) - Use `errors.As` to extract a typed error from a chain
- [`err-avoid-shadowing`](rules/err-avoid-shadowing.md) - Be careful when `:=` shadows an outer `err` in a nested block
- [`err-check-immediately`](rules/err-check-immediately.md) - Check an error immediately after the call that can produce it
- [`err-custom-type`](rules/err-custom-type.md) - Define custom error types for errors that carry structured data
- [`err-is-not-equality`](rules/err-is-not-equality.md) - Use `errors.Is` to compare errors, not `==`
- [`err-join-multiple`](rules/err-join-multiple.md) - Use `errors.Join` to combine multiple independent errors into one
- [`err-lowercase-msg`](rules/err-lowercase-msg.md) - Error messages: lowercase, no trailing punctuation
- [`err-nil-check-interface`](rules/err-nil-check-interface.md) - A typed nil stored in an `error` interface is not `== nil`
- [`err-no-ignore`](rules/err-no-ignore.md) - Never silently discard an error with `_ = err` or a bare ignored return
- [`err-panic-programmer-bugs`](rules/err-panic-programmer-bugs.md) - Panic only for programmer bugs, never for expected/recoverable conditions
- [`err-recover-boundary`](rules/err-recover-boundary.md) - Recover panics only at a well-defined boundary (goroutine root, HTTP middleware)
- [`err-return-early`](rules/err-return-early.md) - Use guard clauses: return on error immediately instead of nesting the happy path
- [`err-sentinel-var`](rules/err-sentinel-var.md) - Declare sentinel errors as package-level `var Err... = errors.New(...)`
- [`err-wrap-fmt-w`](rules/err-wrap-fmt-w.md) - Wrap errors with `fmt.Errorf("...: %w", err)` to preserve the chain

### 2. Concurrency (CRITICAL)

- [`conc-atomic-counters`](rules/conc-atomic-counters.md) - Use `sync/atomic` for simple counters and flags instead of a mutex
- [`conc-channel-buffered-backpressure`](rules/conc-channel-buffered-backpressure.md) - Choose channel buffer size deliberately for backpressure and decoupling
- [`conc-channel-close-sender`](rules/conc-channel-close-sender.md) - Only the sender closes a channel; a receiver never closes it
- [`conc-channel-directional`](rules/conc-channel-directional.md) - Use directional channel types (`chan<-`, `<-chan`) in function signatures
- [`conc-context-cancel-propagate`](rules/conc-context-cancel-propagate.md) - Propagate cancellation and deadlines through every downstream call
- [`conc-context-first-param`](rules/conc-context-first-param.md) - Pass `context.Context` as the first parameter, named `ctx`
- [`conc-errgroup-parallel`](rules/conc-errgroup-parallel.md) - Use `golang.org/x/sync/errgroup` for parallel work that can fail
- [`conc-goroutine-lifecycle`](rules/conc-goroutine-lifecycle.md) - Every goroutine you start needs a clear owner and a way to stop
- [`conc-mutex-minimal-scope`](rules/conc-mutex-minimal-scope.md) - Keep the critical section under a mutex as small as possible
- [`conc-once-init`](rules/conc-once-init.md) - Use `sync.Once` for one-time, thread-safe initialization
- [`conc-pipeline-pattern`](rules/conc-pipeline-pattern.md) - Compose concurrent stages as a pipeline connected by channels
- [`conc-race-detector-ci`](rules/conc-race-detector-ci.md) - Run `go test -race` in CI for every package with concurrent code
- [`conc-rwmutex-read-heavy`](rules/conc-rwmutex-read-heavy.md) - Use `sync.RWMutex` when reads vastly outnumber writes
- [`conc-select-timeout`](rules/conc-select-timeout.md) - Use `select` with `ctx.Done()` or `time.After` to bound blocking operations
- [`conc-waitgroup-usage`](rules/conc-waitgroup-usage.md) - Use `sync.WaitGroup` to wait for a known set of goroutines to finish
- [`conc-worker-pool-bounded`](rules/conc-worker-pool-bounded.md) - Use a bounded worker pool instead of spawning a goroutine per unit of work

### 3. Memory & Performance (CRITICAL)

- [`mem-assert-type-size`](rules/mem-assert-type-size.md) - Add a compile-time assertion to catch accidental struct size regressions
- [`mem-avoid-interface-boxing`](rules/mem-avoid-interface-boxing.md) - Avoid unnecessary `any`/`interface{}` boxing in hot paths
- [`mem-benchmark-alloc`](rules/mem-benchmark-alloc.md) - Use `testing.B` with `-benchmem`/`b.ReportAllocs()` to track allocations
- [`mem-buffered-io`](rules/mem-buffered-io.md) - Wrap I/O in `bufio.Reader`/`bufio.Writer` for read/write-heavy loops
- [`mem-copy-large-struct`](rules/mem-copy-large-struct.md) - Pass large structs by pointer to avoid copying them on every call
- [`mem-defer-loop-cost`](rules/mem-defer-loop-cost.md) - Avoid `defer` inside tight loops; scope it to a per-iteration function instead
- [`mem-json-decoder-stream`](rules/mem-json-decoder-stream.md) - Use `json.Decoder` to stream large payloads instead of `json.Unmarshal`
- [`mem-map-preallocate`](rules/mem-map-preallocate.md) - Use `make(map[K]V, n)` to size-hint a map when the count is known
- [`mem-nil-slice-vs-empty`](rules/mem-nil-slice-vs-empty.md) - Know the difference between a nil slice and an empty (non-nil) slice
- [`mem-slice-aliasing-append`](rules/mem-slice-aliasing-append.md) - Understand slice aliasing: `append` and re-slicing can silently share backing arrays
- [`mem-slice-preallocate`](rules/mem-slice-preallocate.md) - Use `make([]T, 0, n)` to preallocate slice capacity when the size is known
- [`mem-string-byte-conversion`](rules/mem-string-byte-conversion.md) - Avoid unnecessary `[]byte` <-> `string` conversions in hot paths
- [`mem-strings-builder`](rules/mem-strings-builder.md) - Use `strings.Builder` instead of `+` concatenation in loops
- [`mem-struct-field-alignment`](rules/mem-struct-field-alignment.md) - Order struct fields from largest to smallest to minimize padding
- [`mem-sync-pool-reuse`](rules/mem-sync-pool-reuse.md) - Use `sync.Pool` to reuse short-lived, expensive-to-allocate buffers

### 4. API & Interface Design (HIGH)

- [`api-accept-interfaces-return-structs`](rules/api-accept-interfaces-return-structs.md) - Accept interfaces as parameters, return concrete structs
- [`api-avoid-any-overuse`](rules/api-avoid-any-overuse.md) - Avoid `any`/`interface{}` in APIs when a concrete or generic type would work
- [`api-avoid-global-state`](rules/api-avoid-global-state.md) - Avoid package-level mutable state in libraries; make dependencies explicit
- [`api-constructor-new-prefix`](rules/api-constructor-new-prefix.md) - Name constructors `New` or `NewXxx`, returning a ready-to-use value
- [`api-embedding-vs-composition`](rules/api-embedding-vs-composition.md) - Prefer composition; use struct embedding deliberately, not as a shortcut
- [`api-functional-options`](rules/api-functional-options.md) - Use the functional options pattern for constructors with many optional parameters
- [`api-io-reader-writer`](rules/api-io-reader-writer.md) - Accept `io.Reader`/`io.Writer` instead of concrete types like `*os.File` or `*bytes.Buffer`
- [`api-minimal-exported-surface`](rules/api-minimal-exported-surface.md) - Keep the exported API surface minimal; default to unexported
- [`api-return-error-last`](rules/api-return-error-last.md) - Return `error` as the last value in a multi-value return
- [`api-small-interfaces`](rules/api-small-interfaces.md) - Keep interfaces small and focused - one or two methods
- [`api-stringer-interface`](rules/api-stringer-interface.md) - Implement `fmt.Stringer` for types that need a readable string form
- [`api-table-driven-config`](rules/api-table-driven-config.md) - Use a struct-based config over long positional parameter lists
- [`api-variadic-config`](rules/api-variadic-config.md) - Use variadic parameters for optional trailing arguments, not for required ones

### 5. Generics (HIGH)

- [`gen-avoid-unnecessary-generics`](rules/gen-avoid-unnecessary-generics.md) - Don't add a type parameter when a concrete type or interface already works
- [`gen-cmp-package`](rules/gen-cmp-package.md) - Use the `cmp` package for ordering comparisons instead of hand-rolled logic
- [`gen-comparable-constraint`](rules/gen-comparable-constraint.md) - Use the `comparable` constraint for generic code that needs `==`/`!=` or map keys
- [`gen-constraints-narrow`](rules/gen-constraints-narrow.md) - Write the narrowest type constraint that satisfies your function's needs
- [`gen-generic-methods-limitation`](rules/gen-generic-methods-limitation.md) - Remember methods can't introduce new type parameters beyond the receiver's
- [`gen-maps-package`](rules/gen-maps-package.md) - Use the `maps` standard library package for common map operations
- [`gen-slices-package`](rules/gen-slices-package.md) - Use the `slices` standard library package instead of hand-rolled loops
- [`gen-type-inference-omit`](rules/gen-type-inference-omit.md) - Omit explicit type arguments when the compiler can infer them

### 6. HTTP & Server Idioms (HIGH)

- [`http-client-reuse`](rules/http-client-reuse.md) - Reuse a single `http.Client`/`http.Transport` instead of creating one per request
- [`http-client-timeout`](rules/http-client-timeout.md) - Always set a timeout on `http.Client` - never use the zero-value default
- [`http-context-timeout-middleware`](rules/http-context-timeout-middleware.md) - Apply a request-scoped timeout via middleware, not ad hoc per-handler code
- [`http-graceful-shutdown`](rules/http-graceful-shutdown.md) - Use `http.Server.Shutdown` with signal handling for a clean stop
- [`http-handler-signature`](rules/http-handler-signature.md) - Write handlers as `func(http.ResponseWriter, *http.Request)`, wired via `http.Handler`
- [`http-json-error-response`](rules/http-json-error-response.md) - Return a consistent, structured JSON error envelope from every handler
- [`http-middleware-chaining`](rules/http-middleware-chaining.md) - Chain `http.Handler` middleware in a clear, explicit order
- [`http-request-body-limit`](rules/http-request-body-limit.md) - Bound request body size with `http.MaxBytesReader`
- [`http-router-choice`](rules/http-router-choice.md) - Choose your router deliberately: stdlib `ServeMux` (1.22+) is often enough
- [`http-status-codes-explicit`](rules/http-status-codes-explicit.md) - Set HTTP status codes explicitly and correctly, using the named constants

### 7. Type Safety (HIGH/MEDIUM)

- [`type-avoid-panic-in-library`](rules/type-avoid-panic-in-library.md) - Library code returns errors; it does not panic on bad input or failure
- [`type-conversion-explicit`](rules/type-conversion-explicit.md) - Prefer explicit, checked type conversions; avoid `unsafe.Pointer` unless truly necessary
- [`type-defined-types-safety`](rules/type-defined-types-safety.md) - Use defined types instead of primitive obsession for domain concepts
- [`type-embedding-interface-satisfaction`](rules/type-embedding-interface-satisfaction.md) - Use interface embedding deliberately to build larger contracts from small ones
- [`type-iota-enum`](rules/type-iota-enum.md) - Use `iota` to define enum-like constants, with a defined type for safety
- [`type-nil-interface-pitfall`](rules/type-nil-interface-pitfall.md) - A nil concrete value stored in an interface is not itself `nil`
- [`type-pointer-vs-value-receiver`](rules/type-pointer-vs-value-receiver.md) - Pick pointer or value receivers deliberately, and stay consistent per type
- [`type-stringer-enum`](rules/type-stringer-enum.md) - Give enum-like types a `String()` method and validate values at the boundary
- [`type-struct-tags-correctness`](rules/type-struct-tags-correctness.md) - Write struct tags with correct syntax and the options you actually intend
- [`type-zero-value-useful`](rules/type-zero-value-useful.md) - Design types so their zero value is immediately useful

### 8. Struct & Composition Patterns (MEDIUM)

- [`struct-avoid-god-struct`](rules/struct-avoid-god-struct.md) - Avoid a single struct that accumulates every field the whole program touches
- [`struct-comparable-design`](rules/struct-comparable-design.md) - Design a struct deliberately when it needs to support `==` or be a map key
- [`struct-constructor-validation`](rules/struct-constructor-validation.md) - Validate invariants in the constructor, not scattered across every method
- [`struct-embedding-delegation`](rules/struct-embedding-delegation.md) - Use struct embedding to delegate to an inner type while overriding specific methods
- [`struct-init-keyed-fields`](rules/struct-init-keyed-fields.md) - Always use keyed fields in struct literals for exported/cross-package structs
- [`struct-nested-vs-flat`](rules/struct-nested-vs-flat.md) - Nest related fields into a sub-struct when they form a cohesive group
- [`struct-tags-json-omitempty`](rules/struct-tags-json-omitempty.md) - Understand exactly what `omitempty` does - and doesn't - omit
- [`struct-unexported-fields-encapsulation`](rules/struct-unexported-fields-encapsulation.md) - Keep fields unexported unless callers genuinely need direct access

### 9. Naming Conventions (MEDIUM)

- [`name-avoid-underscores`](rules/name-avoid-underscores.md) - Never use underscores within Go identifiers (types, funcs, vars, fields)
- [`name-boolean-prefix`](rules/name-boolean-prefix.md) - Prefix boolean variables and methods with `Is`, `Has`, `Can`, or similar
- [`name-context-var-ctx`](rules/name-context-var-ctx.md) - Name `context.Context` variables and parameters `ctx`
- [`name-error-var-err`](rules/name-error-var-err.md) - Name error variables `err`, consistently
- [`name-initialisms`](rules/name-initialisms.md) - Keep initialisms at consistent casing: `ID`, `URL`, `HTTP` - not `Id`, `Url`, `Http`
- [`name-interface-er-suffix`](rules/name-interface-er-suffix.md) - Name single-method interfaces with an `-er` suffix derived from the method
- [`name-mixedcaps`](rules/name-mixedcaps.md) - Use `MixedCaps`/`mixedCaps`, never underscores, for multi-word identifiers
- [`name-no-get-prefix`](rules/name-no-get-prefix.md) - Don't prefix simple accessors with `Get`
- [`name-no-stutter`](rules/name-no-stutter.md) - Avoid repeating the package name in its own exported identifiers
- [`name-package-lowercase-short`](rules/name-package-lowercase-short.md) - Package names: lowercase, short, no underscores or mixedCaps
- [`name-receiver-consistency`](rules/name-receiver-consistency.md) - Use the same receiver name across every method of a type
- [`name-short-receiver`](rules/name-short-receiver.md) - Use short, consistent receiver names - one or two letters, an abbreviation of the type

### 10. Testing (MEDIUM)

- [`test-avoid-sleep`](rules/test-avoid-sleep.md) - Avoid `time.Sleep` for synchronization in tests; wait on a real signal instead
- [`test-benchmark-b-loop`](rules/test-benchmark-b-loop.md) - Write benchmarks with `testing.B`, preferring `b.Loop()` on Go 1.24+
- [`test-cleanup-t-cleanup`](rules/test-cleanup-t-cleanup.md) - Use `t.Cleanup()` for teardown instead of manual `defer` in test helpers
- [`test-descriptive-names`](rules/test-descriptive-names.md) - Name tests and subtests after the behavior being verified, not generic labels
- [`test-fuzz-testing`](rules/test-fuzz-testing.md) - Use `testing.F` fuzz tests to find edge cases in parsing/decoding code
- [`test-golden-files`](rules/test-golden-files.md) - Use golden files to test large or complex expected output
- [`test-helper-marker`](rules/test-helper-marker.md) - Call `t.Helper()` in test helper functions so failures report the right line
- [`test-httptest-server`](rules/test-httptest-server.md) - Use `httptest.NewServer`/`httptest.NewRecorder` to test HTTP code without a real network
- [`test-mock-interfaces`](rules/test-mock-interfaces.md) - Depend on small interfaces so hand-written or generated fakes are easy to build
- [`test-parallel-t-parallel`](rules/test-parallel-t-parallel.md) - Call `t.Parallel()` to run independent tests concurrently
- [`test-race-flag`](rules/test-race-flag.md) - Write tests that actually exercise concurrent paths, then run them with `-race`
- [`test-subtests-t-run`](rules/test-subtests-t-run.md) - Use `t.Run` to create named, independently-reportable subtests
- [`test-table-driven`](rules/test-table-driven.md) - Structure tests with multiple cases as a table, driven by a single loop
- [`test-testify-vs-stdlib`](rules/test-testify-vs-stdlib.md) - Choose `testify` assertions or stdlib `testing` deliberately, and stay consistent

### 11. Documentation (MEDIUM)

- [`doc-avoid-redundant-comments`](rules/doc-avoid-redundant-comments.md) - Don't write comments that just restate what the code already says
- [`doc-changelog-readme`](rules/doc-changelog-readme.md) - Maintain a README and CHANGELOG at the project root
- [`doc-comment-starts-with-name`](rules/doc-comment-starts-with-name.md) - Doc comments start with the name of the thing they document
- [`doc-deprecated-comment`](rules/doc-deprecated-comment.md) - Mark deprecated identifiers with a `// Deprecated:` comment
- [`doc-example-tests`](rules/doc-example-tests.md) - Write `Example` functions so documentation examples are compiled and verified
- [`doc-godoc-formatting`](rules/doc-godoc-formatting.md) - Use Go's doc comment formatting (headings, lists, links) instead of ad hoc text
- [`doc-intra-links`](rules/doc-intra-links.md) - Use `[Identifier]` doc links to cross-reference related types and functions
- [`doc-package-doc-file`](rules/doc-package-doc-file.md) - Put package-level documentation in a dedicated `doc.go` file for larger packages
- [`doc-package-overview-first-sentence`](rules/doc-package-overview-first-sentence.md) - Make the first sentence of a doc comment a complete, standalone summary

### 12. Project Structure (LOW)

- [`proj-avoid-circular-deps`](rules/proj-avoid-circular-deps.md) - Design package boundaries to avoid import cycles
- [`proj-cmd-per-binary`](rules/proj-cmd-per-binary.md) - Put each binary's entry point in its own `cmd/<name>/main.go`
- [`proj-flat-small-packages`](rules/proj-flat-small-packages.md) - Keep small projects and packages flat; don't impose structure prematurely
- [`proj-go-work-multi-module`](rules/proj-go-work-multi-module.md) - Use `go.work` for local development across multiple modules
- [`proj-internal-packages`](rules/proj-internal-packages.md) - Use `internal/` packages to restrict visibility, enforced by the compiler
- [`proj-main-thin`](rules/proj-main-thin.md) - Keep `main.go` minimal: wire dependencies, don't implement logic
- [`proj-module-hygiene`](rules/proj-module-hygiene.md) - Keep `go.mod`/`go.sum` clean, minimal, and current
- [`proj-package-by-feature`](rules/proj-package-by-feature.md) - Organize packages by feature/domain, not by technical layer
- [`proj-standard-layout`](rules/proj-standard-layout.md) - Follow the community-standard layout: `cmd/`, `internal/`, root package
- [`proj-version-module-path`](rules/proj-version-module-path.md) - Include a `/vN` suffix in the module path for major version 2 and above

### 13. Linting (LOW)

- [`lint-ci-gating`](rules/lint-ci-gating.md) - Fail CI on lint, format, vet, and test failures - don't just report them
- [`lint-errcheck-enabled`](rules/lint-errcheck-enabled.md) - Enable `errcheck` to catch every unhandled error return value
- [`lint-gofmt-goimports`](rules/lint-gofmt-goimports.md) - Run `gofmt`/`goimports` on save and gate CI on formatted code
- [`lint-golangci-lint-config`](rules/lint-golangci-lint-config.md) - Configure `golangci-lint` as the single entry point for all Go linters
- [`lint-gosec-security`](rules/lint-gosec-security.md) - Enable `gosec` to catch common security mistakes in Go code
- [`lint-govet-enabled`](rules/lint-govet-enabled.md) - Run `go vet` (directly or via `golangci-lint`) on every build
- [`lint-missing-docs`](rules/lint-missing-docs.md) - Enforce doc comments on every exported identifier via linting
- [`lint-revive-style`](rules/lint-revive-style.md) - Use `revive` for configurable style and convention checks
- [`lint-shadow-check`](rules/lint-shadow-check.md) - Enable the `shadow` analyzer to catch accidental variable shadowing
- [`lint-staticcheck-enabled`](rules/lint-staticcheck-enabled.md) - Enable `staticcheck` for deep static analysis beyond `go vet`
- [`lint-unused-detection`](rules/lint-unused-detection.md) - Enable `unused`/`deadcode` checks to catch dead code and unused identifiers

### 14. Anti-patterns (REFERENCE)

- [`anti-context-in-struct`](rules/anti-context-in-struct.md) - Don't store a `context.Context` as a struct field
- [`anti-defer-in-loop-leak`](rules/anti-defer-in-loop-leak.md) - Don't `defer` a resource release inside a loop body without scoping it per iteration
- [`anti-empty-interface-map`](rules/anti-empty-interface-map.md) - Don't use `map[string]any` as a substitute for a real, typed struct
- [`anti-error-string-format`](rules/anti-error-string-format.md) - Don't build wrapped errors with `%v`/string concatenation when `%w` is intended
- [`anti-goroutine-leak`](rules/anti-goroutine-leak.md) - Don't spawn a goroutine with no path to ever terminate
- [`anti-goroutine-per-request-unbounded`](rules/anti-goroutine-per-request-unbounded.md) - Don't spawn one goroutine per incoming item with no upper bound
- [`anti-ignore-error`](rules/anti-ignore-error.md) - Don't discard error return values with `_ = err` or a bare ignored call
- [`anti-init-function-abuse`](rules/anti-init-function-abuse.md) - Don't overload `init()` with side effects or logic that could fail
- [`anti-interface-pollution`](rules/anti-interface-pollution.md) - Don't accept or return interfaces broader than what the function actually uses
- [`anti-mutex-copy`](rules/anti-mutex-copy.md) - Never copy a struct that contains a `sync.Mutex` (or `WaitGroup`, `RWMutex`, etc.)
- [`anti-naked-return-abuse`](rules/anti-naked-return-abuse.md) - Avoid naked returns in anything but very short functions
- [`anti-package-level-mutable-state`](rules/anti-package-level-mutable-state.md) - Don't rely on package-level mutable variables shared across all callers
- [`anti-panic-recover-control-flow`](rules/anti-panic-recover-control-flow.md) - Don't use `panic`/`recover` as a substitute for normal control flow
- [`anti-premature-interface`](rules/anti-premature-interface.md) - Don't define an interface before a second implementation actually exists
- [`anti-shared-state-no-sync`](rules/anti-shared-state-no-sync.md) - Never access shared mutable state from multiple goroutines without synchronization
- [`anti-time-sleep-sync`](rules/anti-time-sleep-sync.md) - Don't use `time.Sleep` as a substitute for real synchronization

---

## Recommended `go.mod` / `.golangci.yml` Settings

```go
// go.mod
module example.com/myproject

go 1.24   // lowest version actually verified by this project's CI matrix
```

```yaml
# .golangci.yml
version: "2"

linters:
  default: standard
  enable:
    - govet
    - staticcheck
    - errcheck
    - revive
    - gosec
    - unused
    - ineffassign
    - bodyclose
    - sqlclosecheck
    - copyloopvar     # flags redundant pre-1.22 `x := x` capture idioms once go.mod targets 1.22+

linters-settings:
  govet:
    enable:
      - shadow
  revive:
    rules:
      - name: exported
      - name: error-strings
      - name: context-as-argument
      - name: var-naming
  errcheck:
    check-blank: true

issues:
  exclude-dirs:
    - vendor
    - testdata

formatters:
  enable:
    - gofmt
    - goimports
```

```yaml
# .github/workflows/ci.yml (excerpt)
- run: gofmt -l . | tee /dev/stderr | (! read -r)
- run: go vet ./...
- uses: golangci/golangci-lint-action@v6
- run: go test -race -shuffle=on ./...
- run: go mod tidy && git diff --exit-code go.mod go.sum
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing Go code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|-------------------|
| New function | `err-`, `name-`, `type-` |
| New struct/type | `struct-`, `type-`, `doc-` |
| New package/API | `api-`, `gen-`, `doc-` |
| Concurrent code | `conc-`, `err-` |
| HTTP server/client | `http-`, `conc-`, `err-` |
| Error handling | `err-`, `anti-` |
| Memory/performance tuning | `mem-`, `conc-` |
| Writing tests | `test-` |
| Code review | `anti-`, `lint-` |
| CI/tooling setup | `lint-`, `proj-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) - choosing and implementing GoF and idiomatic patterns; apply alongside this skill's API and naming rules for pattern-heavy Go design.
- [security-review](../security-review/SKILL.md) - security-focused audit checklists; apply alongside this skill's error-handling and concurrency rules when reviewing Go code for vulnerabilities.

## Sources

This skill synthesizes best practices from:
- [Effective Go](https://go.dev/doc/effective_go)
- [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments)
- [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md)
- [Google Go Style Guide](https://google.github.io/styleguide/go/)
- [Go Doc Comments](https://go.dev/doc/comment)
- The Go blog and release notes for Go 1.21-1.24
- `golangci-lint`, `staticcheck`, and `revive` rule documentation
- Production codebases: Kubernetes, `docker/moby`, Prometheus, CockroachDB, HashiCorp Terraform/Consul/Vault, `golang/go` standard library itself
- Community conventions (2024-2026)
