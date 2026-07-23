---
name: c-coding
description: "Comprehensive idiomatic C guidance: 185 prioritized rules across 15 categories, covering C99/C11/C17/C23 (plain C, not C++). Use aggressively when writing, reviewing, refactoring, debugging, or security-auditing any `.c`/`.h` file — manual memory management, pointer arithmetic, buffer sizing, error-code conventions, undefined behavior, and concurrency are exactly the areas where C code silently goes wrong. Preserve the project's declared C standard version and existing conventions; apply C11/C17/C23 features (`_Generic`, `static_assert`, designated initializers, `<stdint.h>`, `nullptr`, `constexpr`, `#embed`) only when the project's declared standard supports them."
compatibility: opencode
metadata:
  domain: c
  audience: software-engineer
  edition: project-declared
---

# C Best Practices

Comprehensive guide for writing high-quality, memory-safe, portable C code. Contains 185 rules across 15 categories, prioritized by impact. C has no ownership system, no borrow checker, no destructors, and no bounds checking — nearly every correctness guarantee that other languages give you for free must be maintained by convention and discipline in C. Project constraints override generic defaults: preserve the declared C standard version, target platform assumptions, and existing error-handling conventions unless the user explicitly requests a modernization or migration.

## When to Apply

Reference these guidelines when:
- Writing new C functions, structs, or modules
- Implementing manual memory management (allocation, ownership, cleanup)
- Designing public C library APIs and headers
- Reviewing code for buffer overflows, use-after-free, or undefined behavior
- Handling errors via return codes, `errno`, or the goto-cleanup pattern
- Writing multi-threaded C code (pthreads, atomics)
- Optimizing hot paths or reducing allocation overhead
- Refactoring legacy C code toward a modern standard
- Setting up compiler warnings, sanitizers, and static analysis in CI

## Modern C: C11/C17/C23 Features Worth Using

C has evolved substantially since C89/C99. For an existing codebase, preserve its declared standard version (`-std=c99`, `-std=c11`, `-std=c17`, `-std=c23`) unless a modernization is explicitly in scope. For new code, default to `-std=c17` (widely supported, stable) or `-std=c23` where the toolchain is confirmed to support it, and apply these features where the project's standard allows:

```c
/* C11 */
_Static_assert(sizeof(int) == 4, "this code assumes 32-bit int");   /* static_assert since C23 is a keyword */
_Generic((x), int: handle_int, double: handle_double)(x);            /* type-generic dispatch */
_Thread_local int counter;                                            /* thread-local storage */
_Alignas(64) struct cache_line_data data;                              /* explicit alignment */
#include <stdatomic.h>                                                  /* atomic types and operations */

/* C99, foundational and universally supported today */
struct point p = { .x = 1, .y = 2 };   /* designated initializers */
#include <stdint.h>                       /* int32_t, uint64_t, etc. — fixed-width types */
#include <stdbool.h>                       /* bool, true, false */
int arr[n];                                 /* variable-length arrays: use with caution, see mem-stack-vs-heap */

/* C23 */
bool ok = true;              /* bool/true/false/nullptr are now keywords, no #include needed */
nullptr_t np = nullptr;        /* type-safe null pointer constant, distinct from integer 0 */
constexpr int max = 100;         /* true compile-time constant, stronger than #define or const */
#embed "data.bin"                  /* embed binary file contents directly as an initializer list */
[[nodiscard]] int must_check(void);  /* standard attribute, replaces compiler-specific warn_unused_result */
```

Annex K's `_s`-suffixed "bounds-checking interfaces" (`strcpy_s`, `memcpy_s`, ...) are part of the C11/C17 standard but remain optional for implementations to provide, and adoption is inconsistent: glibc has never implemented them, while Microsoft's CRT provides its own similar-but-not-identical `_s` functions. Do not rely on Annex K being available; prefer the well-supported bounded alternatives this skill recommends (`snprintf`, `strlcpy` where available, explicit length-checked helpers) instead.

For the authoritative, complete feature list per standard, consult the ISO C standard drafts (N1570 for C11, N2310 for C23) or your compiler's C conformance documentation. Everything below applies across standard versions; prefer the modern forms above where the project's declared standard supports them.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Rules |
|----------|----------|--------|--------|-------|
| 1 | Memory Management & Safety | CRITICAL | `mem-` | 16 |
| 2 | Pointers & Arrays | CRITICAL | `ptr-` | 14 |
| 3 | Error Handling | CRITICAL | `err-` | 12 |
| 4 | Undefined Behavior Avoidance | CRITICAL | `ub-` | 14 |
| 5 | Concurrency | CRITICAL | `conc-` | 10 |
| 6 | API/Interface Design | HIGH | `api-` | 14 |
| 7 | String Handling | HIGH | `str-` | 12 |
| 8 | Naming Conventions | MEDIUM | `name-` | 12 |
| 9 | Type Safety | MEDIUM | `type-` | 12 |
| 10 | Testing | MEDIUM | `test-` | 12 |
| 11 | Documentation | MEDIUM | `doc-` | 10 |
| 12 | Performance Patterns | MEDIUM | `perf-` | 11 |
| 13 | Project Structure | LOW | `proj-` | 10 |
| 14 | Linting & Static Analysis | LOW | `lint-` | 10 |
| 15 | Anti-patterns | REFERENCE | `anti-` | 16 |

---

## Quick Reference

### 1. Memory Management & Safety (CRITICAL)

- [`mem-arena-allocator`](rules/mem-arena-allocator.md) - Use arena/pool allocation for batches of allocations that share a lifetime
- [`mem-avoid-buffer-overflow`](rules/mem-avoid-buffer-overflow.md) - Never write or read past the bounds of an allocated buffer
- [`mem-calloc-over-malloc-memset`](rules/mem-calloc-over-malloc-memset.md) - Use `calloc()` when you need zeroed memory, not `malloc()` + `memset()`
- [`mem-check-malloc-failure`](rules/mem-check-malloc-failure.md) - Always check the return value of `malloc`/`calloc`/`realloc` for `NULL`
- [`mem-flexible-array-member`](rules/mem-flexible-array-member.md) - Use a C99 flexible array member for variable-length trailing data instead of a fixed oversized buffer or two allocations
- [`mem-free-list-pool`](rules/mem-free-list-pool.md) - Use a free-list pool allocator for objects that are frequently created and destroyed in a fixed size
- [`mem-free-null-pointer`](rules/mem-free-null-pointer.md) - Set pointers to `NULL` immediately after `free()` to prevent accidental reuse
- [`mem-init-before-use`](rules/mem-init-before-use.md) - Initialize every variable before it is read; never rely on indeterminate values
- [`mem-no-double-free`](rules/mem-no-double-free.md) - Never free the same pointer twice
- [`mem-no-use-after-free`](rules/mem-no-use-after-free.md) - Never dereference or use memory after it has been freed
- [`mem-realloc-temp-pointer`](rules/mem-realloc-temp-pointer.md) - Assign `realloc()`'s result to a temporary pointer, never overwrite the original in place
- [`mem-single-owner-free`](rules/mem-single-owner-free.md) - Establish one clear owner responsible for freeing each allocation
- [`mem-sizeof-pointer-pitfall`](rules/mem-sizeof-pointer-pitfall.md) - Use `sizeof(*ptr)` instead of `sizeof(type)` to keep allocation size in sync with the variable's actual type
- [`mem-stack-vs-heap`](rules/mem-stack-vs-heap.md) - Prefer stack allocation for small, short-lived, bounded-size data over heap allocation
- [`mem-struct-padding-awareness`](rules/mem-struct-padding-awareness.md) - Be aware of compiler-inserted struct padding when reasoning about `sizeof`, serialization, or ABI
- [`mem-valgrind-asan-verify`](rules/mem-valgrind-asan-verify.md) - Verify allocator discipline continuously with Valgrind and/or AddressSanitizer, not just code review

### 2. Pointers & Arrays (CRITICAL)

- [`ptr-array-decay-awareness`](rules/ptr-array-decay-awareness.md) - Know that arrays decay to pointers at function boundaries, and always pass the length alongside
- [`ptr-array-vs-pointer-param`](rules/ptr-array-vs-pointer-param.md) - Write array-style function parameters in the way that best documents intent, understanding both are pointers
- [`ptr-bounds-before-index`](rules/ptr-bounds-before-index.md) - Validate an index against the buffer's bounds before using it to index or offset a pointer
- [`ptr-const-correct-params`](rules/ptr-const-correct-params.md) - Mark pointer parameters `const` whenever the function does not modify the pointee
- [`ptr-explicit-void-cast`](rules/ptr-explicit-void-cast.md) - Cast a `void *` explicitly when assigning to or from an incompatible pointer type, and never obscure a type change with an implicit cast
- [`ptr-function-pointer-typedef`](rules/ptr-function-pointer-typedef.md) - Typedef function pointer types instead of spelling out raw function-pointer syntax at every use site
- [`ptr-multidim-indexing-bounds`](rules/ptr-multidim-indexing-bounds.md) - When flattening multi-dimensional data into a 1D buffer, centralize the index math and bound-check every dimension
- [`ptr-no-arithmetic-past-bounds`](rules/ptr-no-arithmetic-past-bounds.md) - Only form pointers within an array (or one past its end); never compute or dereference a pointer beyond that range
- [`ptr-no-dangling-return`](rules/ptr-no-dangling-return.md) - Never return a pointer to a local (stack) variable from a function
- [`ptr-no-uninitialized-pointer`](rules/ptr-no-uninitialized-pointer.md) - Always initialize pointer variables, even to `NULL`, at declaration
- [`ptr-null-check-before-deref`](rules/ptr-null-check-before-deref.md) - Check a pointer against `NULL` before dereferencing it whenever it can plausibly be `NULL`
- [`ptr-pointer-to-pointer-clarity`](rules/ptr-pointer-to-pointer-clarity.md) - Use pointer-to-pointer parameters only to let a function modify the caller's pointer itself, and name/document them clearly
- [`ptr-restrict-keyword-usage`](rules/ptr-restrict-keyword-usage.md) - Use `restrict` on pointer parameters only when you can guarantee the pointed-to objects never overlap
- [`ptr-type-punning-memcpy`](rules/ptr-type-punning-memcpy.md) - Use `memcpy` (or a `union`) for type punning, never cast a pointer to an unrelated type and dereference it

### 3. Error Handling (CRITICAL)

- [`err-assert-vs-runtime-check`](rules/err-assert-vs-runtime-check.md) - Use `assert()` for programmer errors and invariants you control; use runtime error handling for anything derived from external input
- [`err-check-return-values`](rules/err-check-return-values.md) - Check the return value of every function that can fail, including "boring" ones like `close`, `write`, and `fclose`
- [`err-consistent-return-codes`](rules/err-consistent-return-codes.md) - Pick one return-code convention per module/library and apply it consistently
- [`err-document-error-contract`](rules/err-document-error-contract.md) - Document, in the header, exactly which error codes a function can return and what each one means
- [`err-errno-usage`](rules/err-errno-usage.md) - Read `errno` only immediately after a call that failed, and never assume it was reset to zero on success
- [`err-error-enum-not-magic-int`](rules/err-error-enum-not-magic-int.md) - Represent error codes as a named `enum`, not bare integer literals
- [`err-fail-fast-invariant`](rules/err-fail-fast-invariant.md) - Abort immediately when an internal invariant is violated, rather than continuing with corrupted state
- [`err-goto-cleanup-single-exit`](rules/err-goto-cleanup-single-exit.md) - Use `goto` to jump forward to a single cleanup section when a function acquires multiple resources
- [`err-negative-errno-convention`](rules/err-negative-errno-convention.md) - When adopting the negative-errno return convention, return `-errno_value` on failure and never mix it with `-1`/`errno` in the same API
- [`err-out-param-for-result`](rules/err-out-param-for-result.md) - Return the status code from the function and hand back the actual result through an output parameter
- [`err-partial-init-rollback`](rules/err-partial-init-rollback.md) - When a multi-step initialization fails partway through, roll back exactly the steps that already succeeded
- [`err-perror-strerror`](rules/err-perror-strerror.md) - Report system-call failures with `strerror`/`perror` (or thread-safe `strerror_r`), not a bare error number

### 4. Undefined Behavior Avoidance (CRITICAL)

- [`ub-cast-away-const`](rules/ub-cast-away-const.md) - Never cast away `const` and then write through the resulting pointer
- [`ub-format-string-mismatch`](rules/ub-format-string-mismatch.md) - Every `printf`/`scanf`-family format specifier must exactly match the type of its corresponding argument
- [`ub-indeterminate-padding-bits`](rules/ub-indeterminate-padding-bits.md) - Never rely on the contents of struct padding bytes, and zero them explicitly before comparing, hashing, or transmitting a struct
- [`ub-integer-division-by-zero`](rules/ub-integer-division-by-zero.md) - Check the divisor before performing integer division or modulo; division by zero is undefined behavior for integers
- [`ub-invalid-function-pointer-cast`](rules/ub-invalid-function-pointer-cast.md) - Never call a function through a function pointer cast to an incompatible function type
- [`ub-modifying-string-literal`](rules/ub-modifying-string-literal.md) - Never write through a pointer to a string literal; string literals may be stored in read-only memory
- [`ub-null-pointer-arithmetic`](rules/ub-null-pointer-arithmetic.md) - Never perform pointer arithmetic on a `NULL` pointer, including `NULL + 0`
- [`ub-out-of-bounds-access`](rules/ub-out-of-bounds-access.md) - Accessing an array or buffer outside its allocated bounds is undefined behavior, regardless of whether it "seems to work"
- [`ub-restrict-correctness`](rules/ub-restrict-correctness.md) - Never mark a pointer parameter `restrict` if a caller can supply overlapping/aliased memory for it
- [`ub-sequence-point-violation`](rules/ub-sequence-point-violation.md) - Never modify a variable more than once, or read and modify it in an unsequenced way, between sequence points
- [`ub-shift-by-invalid-amount`](rules/ub-shift-by-invalid-amount.md) - Never shift a value by a negative amount or by an amount greater than or equal to its type's bit width
- [`ub-signed-integer-overflow`](rules/ub-signed-integer-overflow.md) - Never let a signed integer computation overflow; use unsigned types, wider types, or overflow-checked arithmetic instead
- [`ub-strict-aliasing-rule`](rules/ub-strict-aliasing-rule.md) - Never access an object through a pointer of an incompatible type; the compiler is allowed to assume this never happens
- [`ub-uninitialized-variable-read`](rules/ub-uninitialized-variable-read.md) - Reading an automatic (stack) variable before it has been assigned a value is undefined behavior

### 5. Concurrency (CRITICAL)

- [`conc-atomic-for-flags-counters`](rules/conc-atomic-for-flags-counters.md) - Use C11 `_Atomic` (or `<stdatomic.h>`) for simple shared flags and counters instead of a mutex
- [`conc-atomic-memory-order`](rules/conc-atomic-memory-order.md) - Choose the weakest memory order that is still correct for each atomic operation, and default to `memory_order_seq_cst` when unsure
- [`conc-avoid-data-races`](rules/conc-avoid-data-races.md) - Treat any variable touched by more than one thread as requiring explicit synchronization, with no implicit exceptions
- [`conc-avoid-deadlock-lock-ordering`](rules/conc-avoid-deadlock-lock-ordering.md) - When a thread must hold more than one lock at a time, always acquire them in the same global order everywhere
- [`conc-condvar-wait-predicate`](rules/conc-condvar-wait-predicate.md) - Always wait on a condition variable inside a loop that re-checks the actual predicate, never a bare `if`
- [`conc-mutex-protect-shared-state`](rules/conc-mutex-protect-shared-state.md) - Guard every piece of mutable state shared across threads with a mutex (or another synchronization primitive), no exceptions
- [`conc-once-init-pthread-once`](rules/conc-once-init-pthread-once.md) - Use `pthread_once` (or a `static` local with C11's guaranteed thread-safe initialization) for one-time, thread-safe lazy initialization
- [`conc-thread-create-join-discipline`](rules/conc-thread-create-join-discipline.md) - Join or explicitly detach every thread you create; never let a joinable thread outlive your interest in its result silently
- [`conc-thread-local-storage`](rules/conc-thread-local-storage.md) - Use `_Thread_local` (C11) for per-thread state instead of hand-rolled indexing or unsynchronized globals
- [`conc-volatile-not-for-sync`](rules/conc-volatile-not-for-sync.md) - Do not use `volatile` for thread synchronization; it prevents compiler caching but provides no atomicity or memory ordering

### 6. API/Interface Design (HIGH)

- [`api-avoid-global-state`](rules/api-avoid-global-state.md) - Prefer passing explicit state through function parameters (often a context/handle struct) over mutable global variables
- [`api-callback-with-userdata`](rules/api-callback-with-userdata.md) - Give every callback-accepting API a `void *user_data` (or `ctx`) parameter, threaded through unchanged to the callback
- [`api-consistent-prefix-naming`](rules/api-consistent-prefix-naming.md) - Prefix every public symbol in a library with a short, consistent module name
- [`api-const-correct-signatures`](rules/api-const-correct-signatures.md) - Apply `const` throughout public function signatures so the API itself documents what can and cannot be mutated
- [`api-error-propagation-design`](rules/api-error-propagation-design.md) - Design a library's API around one propagation mechanism (return codes) and make every fallible function follow it, including "unlikely to fail" ones
- [`api-header-c-linkage-guard`](rules/api-header-c-linkage-guard.md) - Wrap public C headers in `extern "C"` guards so they remain usable from C++ callers without name mangling issues
- [`api-init-cleanup-pair`](rules/api-init-cleanup-pair.md) - Every `_create`/`_init`/`_open` function must have a matching `_destroy`/`_deinit`/`_close`, and both must be documented together
- [`api-minimal-public-surface`](rules/api-minimal-public-surface.md) - Expose the smallest possible set of public functions and types; make everything else `static` or move it to a private header
- [`api-opaque-struct-encapsulation`](rules/api-opaque-struct-encapsulation.md) - Hide a struct's fields from consumers by exposing only a forward-declared (opaque) pointer type in the public header
- [`api-out-param-convention`](rules/api-out-param-convention.md) - Order output parameters consistently (after inputs), name them with an `out_`/`_out` convention, and never write to them on failure
- [`api-printf-style-format-attribute`](rules/api-printf-style-format-attribute.md) - Annotate every `printf`-style variadic public function with `__attribute__((format(printf, ...)))` (or the MSVC equivalent) so the compiler checks format strings at call sites
- [`api-return-owned-vs-borrowed-doc`](rules/api-return-owned-vs-borrowed-doc.md) - Document, for every function returning a pointer, whether the caller owns it (must free) or is only borrowing it (must not free, may not outlive the source)
- [`api-single-responsibility-function`](rules/api-single-responsibility-function.md) - Give each public function exactly one responsibility, and split functions that both compute and have side effects into separate calls where practical
- [`api-stable-abi-layout`](rules/api-stable-abi-layout.md) - For a shared library with a versioned ABI, avoid changing struct layout or function signatures in ways that break binary compatibility

### 7. String Handling (HIGH)

- [`str-avoid-gets`](rules/str-avoid-gets.md) - Never use `gets()`; it was removed from the C standard entirely because it cannot be used safely
- [`str-avoid-scanf-unbounded`](rules/str-avoid-scanf-unbounded.md) - Always specify a field width with `%s`/`%[...]` in `scanf`-family calls; an unbounded `%s` is as unsafe as `gets()`
- [`str-avoid-sprintf-use-snprintf`](rules/str-avoid-sprintf-use-snprintf.md) - Use `snprintf` instead of `sprintf`, and always check its return value against the destination buffer size
- [`str-avoid-strcpy-strcat`](rules/str-avoid-strcpy-strcat.md) - Avoid `strcpy`/`strcat`; use a bounded alternative that takes the destination buffer's size
- [`str-buffer-size-discipline`](rules/str-buffer-size-discipline.md) - Always pass a buffer's size alongside its pointer, computed with `sizeof` at the buffer's declaration site, never as a separately-tracked magic number
- [`str-compare-with-strncmp`](rules/str-compare-with-strncmp.md) - Use `strncmp`/`memcmp` with an explicit, known length when comparing strings whose length you already control, instead of unbounded `strcmp`
- [`str-null-termination-invariant`](rules/str-null-termination-invariant.md) - Maintain the C string invariant everywhere: every byte buffer treated as a string must have a `'\0'` within its bounds before any `str*` function touches it
- [`str-safe-string-copy-pattern`](rules/str-safe-string-copy-pattern.md) - Standardize on one bounded, always-null-terminating copy helper and use it everywhere instead of ad hoc `strcpy`/`strncpy` calls
- [`str-string-building-dynamic`](rules/str-string-building-dynamic.md) - Build large or unbounded strings with a growable buffer that tracks length and capacity, not repeated fixed-size `strcat`/`snprintf` into a static buffer
- [`str-strlen-cost-awareness`](rules/str-strlen-cost-awareness.md) - Remember `strlen()` is O(n); cache the length instead of recomputing it repeatedly in a loop
- [`str-strncpy-null-termination-footgun`](rules/str-strncpy-null-termination-footgun.md) - `strncpy` does not guarantee null-termination and pads the remainder with zeros; handle both surprises explicitly or avoid it
- [`str-utf8-byte-vs-char`](rules/str-utf8-byte-vs-char.md) - Never assume one `char` equals one displayed character; treat UTF-8 text as a byte sequence and use a proper library for character-level operations

### 8. Naming Conventions (MEDIUM)

- [`name-avoid-abbreviation-ambiguity`](rules/name-avoid-abbreviation-ambiguity.md) - Avoid cryptic or ambiguous abbreviations in identifiers; spell out names unless the abbreviation is truly universal in context
- [`name-avoid-reserved-identifiers`](rules/name-avoid-reserved-identifiers.md) - Never name your own identifiers with a leading underscore, or a leading underscore followed by a capital letter or another underscore — those are reserved to the C implementation
- [`name-boolean-is-has-prefix`](rules/name-boolean-is-has-prefix.md) - Name boolean-returning functions and variables with an `is_`/`has_`/`can_`/`should_` prefix so their meaning is unambiguous at every call site
- [`name-consistent-module-prefix`](rules/name-consistent-module-prefix.md) - Apply the same short module prefix to every public function, type, and constant belonging to that module, without exception
- [`name-enum-constant-prefix`](rules/name-enum-constant-prefix.md) - Prefix every enumerator with the enum's own name so its origin and intent are clear wherever it's used, since C enum constants share the global namespace
- [`name-header-guard-naming`](rules/name-header-guard-naming.md) - Name include guards after the full relative header path in `ALL_CAPS_WITH_UNDERSCORES`, so guard names never collide across a project
- [`name-macro-all-caps`](rules/name-macro-all-caps.md) - Name object-like and function-like macros in `ALL_CAPS_WITH_UNDERSCORES` to visually distinguish them from ordinary functions and variables
- [`name-pointer-variable-suffix`](rules/name-pointer-variable-suffix.md) - Adopt a lightweight, optional naming signal for pointer variables (e.g. a `p`/`ptr` prefix or suffix) only when it measurably improves clarity, and apply it consistently if you do
- [`name-snake-case-functions`](rules/name-snake-case-functions.md) - Use `lower_snake_case` for function and variable names, matching the convention used by the C standard library and most C codebases
- [`name-static-file-scope-prefix`](rules/name-static-file-scope-prefix.md) - Adopt a lightweight naming signal (or at minimum, consistent use of `static`) so internal-linkage helpers are visually distinguishable from the module's public API
- [`name-struct-typedef-convention`](rules/name-struct-typedef-convention.md) - Pick one consistent convention for naming structs and their typedefs, and apply it project-wide: either `typedef struct foo foo;` or a distinguishing suffix, never both styles mixed
- [`name-verb-noun-function-names`](rules/name-verb-noun-function-names.md) - Name functions as `verb_noun` (or `module_verb_noun`) so the name alone communicates the action performed

### 9. Type Safety (MEDIUM)

- [`type-avoid-implicit-int`](rules/type-avoid-implicit-int.md) - Always write an explicit return type and explicit parameter types; never rely on old, now-removed "implicit int" defaults
- [`type-avoid-implicit-narrowing`](rules/type-avoid-implicit-narrowing.md) - Make narrowing conversions (wide type to narrow type, e.g. `long` to `int`) explicit, and check the value's range before converting when data loss would be a bug
- [`type-avoid-plain-char-arithmetic`](rules/type-avoid-plain-char-arithmetic.md) - Cast to `unsigned char` before passing a `char` to functions like `toupper`/`isdigit`, or before using it as an array index; plain `char`'s signedness is implementation-defined
- [`type-bool-stdbool`](rules/type-bool-stdbool.md) - Use `bool` from `<stdbool.h>` (C99) for boolean values, not a bare `int` with implied `0`/`1` meaning
- [`type-const-correctness`](rules/type-const-correctness.md) - Apply `const` to every variable, parameter, and pointee that is not intentionally mutated, throughout the codebase, not just at public API boundaries
- [`type-enum-for-closed-sets`](rules/type-enum-for-closed-sets.md) - Represent a fixed, closed set of named states or options with an `enum`, not a bare `int` with implied meanings
- [`type-fixed-width-stdint`](rules/type-fixed-width-stdint.md) - Use `<stdint.h>` fixed-width types (`int32_t`, `uint64_t`, ...) whenever a value's exact size matters, instead of `int`/`long`/`short`
- [`type-generic-macro`](rules/type-generic-macro.md) - Use C11 `_Generic` to write type-safe, type-dispatching macros instead of unsafe function-like macros or void-pointer-based generic functions
- [`type-size-t-for-sizes`](rules/type-size-t-for-sizes.md) - Use `size_t` for sizes, counts, and indices, matching what `sizeof`, `strlen`, and the allocation functions already return
- [`type-static-assert-invariants`](rules/type-static-assert-invariants.md) - Use `static_assert` (C11, standard keyword in C23) to verify type-layout and configuration invariants at compile time instead of discovering violations at runtime
- [`type-struct-designated-init`](rules/type-struct-designated-init.md) - Use C99 designated initializers to initialize structs by field name, rather than positional initialization
- [`type-volatile-for-hardware-mmio`](rules/type-volatile-for-hardware-mmio.md) - Use `volatile` for memory-mapped hardware registers and signal-handler-shared variables, and understand that it is not a concurrency primitive

### 10. Testing (MEDIUM)

- [`test-arrange-act-assert-c`](rules/test-arrange-act-assert-c.md) - Structure every C test in three clear phases — arrange (set up inputs), act (call the function under test), assert (check the result) — with a blank line between them
- [`test-assert-based-harness`](rules/test-assert-based-harness.md) - For small projects, a minimal `assert`-based test harness is an acceptable, honest alternative to a full framework, as long as it reports aggregate results
- [`test-boundary-value-testing`](rules/test-boundary-value-testing.md) - Write explicit tests for boundary values — zero, one, the maximum, the minimum, empty, and off-by-one neighbors — not just "typical" inputs
- [`test-ci-matrix-compilers`](rules/test-ci-matrix-compilers.md) - Run the test suite in CI across multiple compilers (GCC and Clang, at minimum) and at least two C standard versions
- [`test-coverage-gcov`](rules/test-coverage-gcov.md) - Measure test coverage with `gcov`/`llvm-cov` and use it to find untested code paths, not as a target to game
- [`test-descriptive-test-names`](rules/test-descriptive-test-names.md) - Name each test function after the specific behavior it verifies, in the form `test_<unit>_<condition>_<expected_result>`
- [`test-fuzz-entry-point`](rules/test-fuzz-entry-point.md) - Expose a dedicated fuzz-testing entry point (`LLVMFuzzerTestOneInput`) for parsers and anything that handles untrusted input
- [`test-integration-test-separate-binary`](rules/test-integration-test-separate-binary.md) - Build integration tests as a separate test binary/executable from unit tests, linking against the library rather than duplicating its source
- [`test-mock-via-function-pointers`](rules/test-mock-via-function-pointers.md) - Inject dependencies (I/O, time, randomness) through function pointers or a small interface struct so tests can substitute fakes
- [`test-sanitizers-in-test-ci`](rules/test-sanitizers-in-test-ci.md) - Run the full test suite under AddressSanitizer and UndefinedBehaviorSanitizer on every CI build, not just occasionally by hand
- [`test-static-functions-via-include`](rules/test-static-functions-via-include.md) - Test `static` (internal-linkage) helper functions either by `#include`-ing the `.c` file directly into a test-only translation unit, or by exposing them through a test-only internal header
- [`test-unit-test-framework`](rules/test-unit-test-framework.md) - Use an established C unit-testing framework (Unity, Check, or CMocka) instead of ad hoc `printf`-based assertions

### 11. Documentation (MEDIUM)

- [`doc-changelog-versioning`](rules/doc-changelog-versioning.md) - Maintain a changelog documenting every public-API-visible change, tagged against the library's version number, especially breaking changes
- [`doc-comment-why-not-what`](rules/doc-comment-why-not-what.md) - Write comments that explain why the code does something non-obvious, not comments that just restate what the code already says
- [`doc-document-error-conditions`](rules/doc-document-error-conditions.md) - Enumerate every specific error condition a function can produce in its documentation, not just "may fail"
- [`doc-document-ownership-lifetime`](rules/doc-document-ownership-lifetime.md) - Document, in the comment for every function that returns or accepts a pointer, exactly who owns the memory and how long it remains valid
- [`doc-doxygen-function-comments`](rules/doc-doxygen-function-comments.md) - Document every public function with a Doxygen-style comment covering its purpose, parameters, return value, and error conditions
- [`doc-example-usage-in-header`](rules/doc-example-usage-in-header.md) - Include a short, realistic usage example in the header comment for any non-trivial public API, especially ones with a specific required call order
- [`doc-header-comment-convention`](rules/doc-header-comment-convention.md) - Start every source and header file with a brief comment stating its purpose, and keep it current as the file's role changes
- [`doc-module-level-overview-comment`](rules/doc-module-level-overview-comment.md) - Give every module (a header plus its `.c` file(s)) a top-level overview comment describing its responsibilities, key types, and how it fits into the larger system
- [`doc-thread-safety-notes`](rules/doc-thread-safety-notes.md) - State explicitly, for every public function and type, whether it is safe to call/access concurrently from multiple threads
- [`doc-todo-fixme-convention`](rules/doc-todo-fixme-convention.md) - Mark known-incomplete or known-broken code with a consistent, greppable `TODO`/`FIXME` tag that includes an owner or issue reference

### 12. Performance Patterns (MEDIUM)

- [`perf-avoid-alloc-in-hot-loop`](rules/perf-avoid-alloc-in-hot-loop.md) - Hoist allocation out of hot loops; allocate once before the loop and reuse the buffer, or use a pool/arena
- [`perf-avoid-false-sharing`](rules/perf-avoid-false-sharing.md) - Pad or align per-thread data so independently-updated fields don't share the same CPU cache line
- [`perf-branch-prediction-hints`](rules/perf-branch-prediction-hints.md) - Use `__builtin_expect` (or C++20/C23-style `[[likely]]`/`[[unlikely]]` attributes where available) to hint rare error branches to the compiler, only after profiling shows it matters
- [`perf-cache-friendly-struct-layout`](rules/perf-cache-friendly-struct-layout.md) - Order struct fields and lay out arrays so the data actually accessed together in hot code lives close together in memory
- [`perf-const-for-optimizer`](rules/perf-const-for-optimizer.md) - Mark values `const` (and pointers-to-data `const`-qualified) wherever true, giving the optimizer more freedom to cache, reorder, and avoid redundant reloads
- [`perf-inline-small-functions`](rules/perf-inline-small-functions.md) - Mark small, frequently-called functions `static inline` (typically in a header) to let the compiler eliminate call overhead, and let the compiler override you when it disagrees
- [`perf-loop-invariant-hoisting`](rules/perf-loop-invariant-hoisting.md) - Move computation that doesn't change between loop iterations outside the loop, even though optimizing compilers often do this automatically
- [`perf-minimize-copies-pass-by-pointer`](rules/perf-minimize-copies-pass-by-pointer.md) - Pass large structs by `const` pointer rather than by value, to avoid copying their full contents on every call
- [`perf-profile-before-optimize`](rules/perf-profile-before-optimize.md) - Profile with real workloads before optimizing anything; intuition about where time is spent in C code is frequently wrong
- [`perf-restrict-optimizer-hint`](rules/perf-restrict-optimizer-hint.md) - Add `restrict` to pointer parameters in hot numeric loops once you've verified no aliasing, to let the compiler vectorize more aggressively
- [`perf-struct-of-arrays`](rules/perf-struct-of-arrays.md) - For hot loops that process one field across many objects, prefer a struct-of-arrays (SoA) layout over an array-of-structs (AoS) layout

### 13. Project Structure (LOW)

- [`proj-avoid-circular-includes`](rules/proj-avoid-circular-includes.md) - Never let two headers `#include` each other directly or indirectly; break the cycle with forward declarations or by extracting shared types into a third header
- [`proj-build-system-cmake-makefile`](rules/proj-build-system-cmake-makefile.md) - Use a real build system (CMake or a well-structured Makefile) with explicit warning/sanitizer flags, rather than ad hoc compile-and-run commands
- [`proj-consistent-directory-layout`](rules/proj-consistent-directory-layout.md) - Adopt a conventional, predictable directory layout (`src/`, `include/`, `tests/`, `docs/`) so contributors and tooling can find things without asking
- [`proj-header-source-split`](rules/proj-header-source-split.md) - Separate a module's public declarations (`.h`) from its implementation (`.c`), and keep only what consumers genuinely need in the header
- [`proj-include-what-you-use`](rules/proj-include-what-you-use.md) - `#include` exactly the headers a file directly uses symbols from — never rely on a symbol being transitively available through another header
- [`proj-internal-header-naming`](rules/proj-internal-header-naming.md) - Name and locate internal-only headers so they are obviously not part of the public API — e.g. an `internal/` subdirectory or an `_internal.h` suffix
- [`proj-one-module-per-file`](rules/proj-one-module-per-file.md) - Keep each `.c`/`.h` pair focused on a single, cohesive responsibility; split a file once it accumulates more than one clear reason to change
- [`proj-public-vs-private-headers-dir`](rules/proj-public-vs-private-headers-dir.md) - Physically separate a library's public headers (installed, part of the API) from its private/internal headers (never installed) using distinct directories
- [`proj-single-header-library-tradeoffs`](rules/proj-single-header-library-tradeoffs.md) - Use the single-header-library pattern (`STB_IMPLEMENTATION`-style) deliberately, understanding its build-time and compile-time trade-offs, rather than as a default distribution format
- [`proj-versioned-public-header`](rules/proj-versioned-public-header.md) - Expose a library's version number programmatically through its public header, not just in documentation or a build script

### 14. Linting & Static Analysis (LOW)

- [`lint-address-sanitizer`](rules/lint-address-sanitizer.md) - Build and run tests with AddressSanitizer (`-fsanitize=address`) to detect buffer overflows, use-after-free, and double-free at the exact point they occur
- [`lint-clang-tidy-checks`](rules/lint-clang-tidy-checks.md) - Run `clang-tidy` with a curated check set in CI to catch bug patterns and style issues beyond what compiler warnings cover
- [`lint-cppcheck-static-analysis`](rules/lint-cppcheck-static-analysis.md) - Run `cppcheck` in CI as a fast, low-false-positive complement to clang-tidy and compiler warnings
- [`lint-enable-wall-wextra-wpedantic`](rules/lint-enable-wall-wextra-wpedantic.md) - Compile every C project with `-Wall -Wextra -Wpedantic` at minimum, as a non-negotiable baseline
- [`lint-memory-sanitizer`](rules/lint-memory-sanitizer.md) - Use MemorySanitizer (`-fsanitize=memory`, Clang-only) to detect reads of uninitialized memory that other tools miss
- [`lint-scan-build-clang-analyzer`](rules/lint-scan-build-clang-analyzer.md) - Run Clang's path-sensitive static analyzer (`scan-build`) periodically to find deep, cross-function bugs that pattern-based linters miss
- [`lint-static-analysis-in-ci`](rules/lint-static-analysis-in-ci.md) - Run static analysis (clang-tidy, cppcheck, scan-build) as a required, blocking CI job, not as an optional local-only tool
- [`lint-thread-sanitizer`](rules/lint-thread-sanitizer.md) - Build and run multi-threaded test suites with ThreadSanitizer (`-fsanitize=thread`) to detect data races directly
- [`lint-undefined-behavior-sanitizer`](rules/lint-undefined-behavior-sanitizer.md) - Build and run tests with UndefinedBehaviorSanitizer (`-fsanitize=undefined`) to catch signed overflow, misaligned access, invalid casts, and other UB at runtime
- [`lint-werror-in-ci`](rules/lint-werror-in-ci.md) - Build with `-Werror` in CI (though not necessarily in every local dev build) so warnings cannot silently accumulate

### 15. Anti-patterns (REFERENCE)

- [`anti-casting-malloc-return`](rules/anti-casting-malloc-return.md) - Don't cast the return value of `malloc`/`calloc`/`realloc` in C; it's unnecessary and can mask a missing `#include <stdlib.h>`
- [`anti-comparing-floats-equality`](rules/anti-comparing-floats-equality.md) - Don't compare floating-point values with `==`/`!=`; compare against an epsilon-bounded difference (or, for exact cases, use integer/fixed-point representations)
- [`anti-deeply-nested-code`](rules/anti-deeply-nested-code.md) - Don't nest conditionals and loops more than 2-3 levels deep; use early returns/guard clauses to flatten control flow
- [`anti-global-mutable-state`](rules/anti-global-mutable-state.md) - Don't rely on mutable global/static variables for state that should be explicit and scoped
- [`anti-goto-spaghetti`](rules/anti-goto-spaghetti.md) - Don't use `goto` for arbitrary jumps, backward loops, or jumping into the middle of a block; reserve it for the forward-only cleanup pattern
- [`anti-huge-functions`](rules/anti-huge-functions.md) - Don't let a function grow to hundreds of lines covering multiple responsibilities; split it along natural sub-task boundaries
- [`anti-ignoring-compiler-warnings`](rules/anti-ignoring-compiler-warnings.md) - Don't ship code with unaddressed compiler warnings; treat every warning as a bug report until proven otherwise
- [`anti-ignoring-syscall-return-value`](rules/anti-ignoring-syscall-return-value.md) - Don't ignore the return value of system calls like `write`, `read`, `close`, and `fork`; each can fail or partially complete
- [`anti-macro-abuse`](rules/anti-macro-abuse.md) - Don't use function-like macros where a `static inline` function would be equally efficient and type-safe
- [`anti-magic-numbers`](rules/anti-magic-numbers.md) - Don't use unexplained numeric literals in code; name them as constants or enum values
- [`anti-mixing-signed-unsigned-compare`](rules/anti-mixing-signed-unsigned-compare.md) - Don't compare a signed and an unsigned integer directly; the signed value is implicitly converted to unsigned, which can silently invert the comparison's intent
- [`anti-not-checking-snprintf-truncation`](rules/anti-not-checking-snprintf-truncation.md) - Don't ignore `snprintf`'s return value; a return `>= buffer size` means the output was silently truncated
- [`anti-return-stack-address`](rules/anti-return-stack-address.md) - Don't return a pointer or reference to a local (automatic-storage) variable from a function
- [`anti-sizeof-array-parameter`](rules/anti-sizeof-array-parameter.md) - Don't call `sizeof` on a pointer parameter expecting the original array's size; arrays decay to pointers at function boundaries
- [`anti-unchecked-malloc`](rules/anti-unchecked-malloc.md) - Don't call `malloc`/`calloc`/`realloc` without checking the result for `NULL`
- [`anti-unsafe-string-functions`](rules/anti-unsafe-string-functions.md) - Don't use `gets`, unbounded `strcpy`/`strcat`/`sprintf`, or unbounded `scanf("%s", ...)`; use their bounded counterparts

---

## Recommended Build Configuration

### Makefile

```make
CC      = cc
STD     = -std=c17
WARN    = -Wall -Wextra -Wpedantic -Werror -Wshadow -Wconversion -Wformat=2
SAN     = -fsanitize=address,undefined
CFLAGS  = $(STD) $(WARN) -g -O1 $(SAN)
LDFLAGS = $(SAN)

SRCS    = $(wildcard src/*.c)
OBJS    = $(SRCS:.c=.o)

app: $(OBJS)
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $(OBJS)

%.o: %.c
	$(CC) $(CFLAGS) -Iinclude -c $< -o $@

test: app
	./app

clean:
	rm -f $(OBJS) app

.PHONY: test clean
```

### CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.20)
project(mylib C)

set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_EXTENSIONS OFF)

add_compile_options(-Wall -Wextra -Wpedantic -Werror -Wshadow -Wconversion)

option(ENABLE_SANITIZERS "Build with ASan/UBSan" ON)
if(ENABLE_SANITIZERS)
  add_compile_options(-fsanitize=address,undefined -fno-omit-frame-pointer)
  add_link_options(-fsanitize=address,undefined)
endif()

add_library(mylib src/widget.c src/connection.c)
target_include_directories(mylib PUBLIC include PRIVATE src)

enable_testing()
add_executable(mylib_tests tests/unit/test_widget.c)
target_link_libraries(mylib_tests PRIVATE mylib)
add_test(NAME mylib_tests COMMAND mylib_tests)
```

---

## How to Use

This skill provides rule identifiers for quick reference. When generating or reviewing C code:

1. **Check relevant category** based on task type
2. **Apply rules** with matching prefix
3. **Prioritize** CRITICAL > HIGH > MEDIUM > LOW
4. **Read rule files** in `rules/` for detailed examples

### Rule Application by Task

| Task | Primary Categories |
|------|---------------------|
| New function | `err-`, `ptr-`, `name-` |
| Memory allocation/ownership | `mem-`, `api-` |
| New struct/public API | `api-`, `type-`, `doc-` |
| String/buffer handling | `str-`, `mem-`, `ub-` |
| Error handling | `err-`, `api-` |
| Multi-threaded code | `conc-`, `mem-` |
| Undefined-behavior audit | `ub-`, `ptr-`, `lint-` |
| Performance tuning | `perf-`, `mem-`, `ptr-` |
| Code review | `anti-`, `lint-`, `ub-` |
| CI/build setup | `lint-`, `test-`, `proj-` |

---

## Related Skills

- [design-patterns](../design-patterns/SKILL.md) - choosing and implementing GoF and idiomatic design patterns; apply its C-adaptable patterns (opaque handles, function-pointer-based strategy/visitor, object pools) alongside this skill's `api-` and `mem-` rules.
- [security-review](../security-review/SKILL.md) - security-audit checklists (memory-safety, injection, unsafe-function findings) for reviewing/auditing C code; use together with this skill's `mem-`, `ptr-`, `ub-`, and `str-` categories when doing a security-focused pass.

## Sources

This skill synthesizes best practices from:
- [CERT C Coding Standard](https://wiki.sei.cmu.edu/confluence/display/c/SEI+CERT+C+Coding+Standard)
- [MISRA C:2012 (with Amendments)](https://misra.org.uk/)
- *C Programming: A Modern Approach*, 2nd Edition, by K. N. King
- *Effective C: An Introduction to Professional C Programming*, by Robert C. Seacord
- ISO/IEC 9899 (the C standard): C99, C11, C17, and C23 drafts
- POSIX.1-2017 (IEEE Std 1003.1) for system-call and threading conventions
- [Linux kernel coding style](https://www.kernel.org/doc/html/latest/process/coding-style.html)
- Production codebases: SQLite, Redis, curl, PostgreSQL, the Linux kernel
- Clang/GCC diagnostics documentation; AddressSanitizer/UBSan/ThreadSanitizer documentation
- Community conventions (2024-2026)
