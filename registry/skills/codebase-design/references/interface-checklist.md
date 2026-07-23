# Interface Depth Evaluation Checklist

A deep interface delivers maximal behaviour behind a minimal caller-facing surface. A shallow interface exposes nearly as much complexity as the implementation. Use this checklist to evaluate any module's interface before or after implementation.

## Quick-Check (5-Minute Triage)

Answer yes/no. Each "no" is a shallowness signal:

1. Can a caller accomplish the module's primary task with a single function call or constructor + one method call?
2. Does the module's public documentation describe *what* it guarantees, not *how* it works internally?
3. Can you change the internal storage format (e.g. hashmap → B-tree, JSON file → SQLite) without changing any public signature or documented behavior?
4. If two callers need different behaviour from this module (e.g. one wants in-memory, another wants on-disk), can they both reuse the same interface by supplying different construction parameters, without the module exposing two separate APIs?
5. Does deleting the module cause its complexity to reappear in at least 3 callers, rather than vanishing entirely?

**Score**: 5/5 = deep. 3-4/5 = adequate. 1-2/5 = reconsider the interface. 0/5 = the module is a pass-through.

## Full Evaluation Rubric

### 1. Signature Depth (Minimal Parameters)

| Criterion | Pass | Fail |
|---|---|---|
| Primary function has ≤3 parameters | The function expresses intent with minimal caller-supplied data | Callers must supply values the function could derive internally (e.g. passing a container size separately, passing a config object that's always the same) |
| Boolean parameters are avoided | Behavioural branches are expressed through separate functions or an enum | `fn process(data, dry_run: bool, validate: bool, verbose: bool)` — each bool is a hidden sub-function |
| Output parameters are avoided where return values work | Return the result directly. Use out-parameters only for multi-return where the language lacks tuples | Caller must allocate and pass an empty container for the function to fill |
| No `null`/`None`/`nil` sentinel for "skip this operation" | Omit the parameter or use an `Option`/`Maybe`/`Optional` wrapper that the language forces the caller to handle | `do_thing(x, None)` — the `None` is a config branch the caller shouldn't have to express |

**Why it matters**: every parameter is a concept the caller must learn. A function with 7 parameters has at least 7 concepts, plus their interactions. A function with 2 parameters has at most 2 concepts.

### 2. Invariant Depth (Guarantees, Not Hints)

| Criterion | Pass | Fail |
|---|---|---|
| Return-value contract is explicit | Type signature + docs say what's returned and what's not (e.g. "returns non-empty Vec<Record>" or "returns None only when the key has never been written") | Doc says "returns the records" but callers don't know whether an empty list means "no records" or "error swallowed" |
| Error modes are enumerated in the type | `Result<T, MyError>` (Rust), `Either<E, T>` (TypeScript), explicit exception types (Python/Java/C#), `(T, error)` (Go) | Function returns `-1` on error, caller guesses what went wrong |
| State transitions are documented | `open()` → `read()`/`write()` → `close()`. `close()` must not be followed by any call. | Callers discover the state machine by reading the implementation or hitting runtime panics |
| Idempotency is declared | If calling `close()` twice is safe, the interface says so. If not, it says so. | Callers add `if not closed: close()` guards defensively because the contract is unknown |
| Resource lifecycle is explicit in the type | `Drop` (Rust), `IDisposable` (C#), context manager (Python), `defer` (Go), RAII (C++) | Caller must remember to call `close()` and there's no compiler/linter help |

**Why it matters**: every unstated invariant is a bug waiting to happen. If two callers infer different invariants from silent behaviour, one of them is wrong — and the module author gets the bug report.

### 3. Information-Hiding Depth

| Criterion | Pass | Fail |
|---|---|---|
| Storage format is hidden | Interface exposes "store key-value" and "get by key"; implementation can be hashmap, B-tree, or remote RPC | Interface exposes `get_page(index)`, `flush_wal()`, `compact()` — callers know it's a paged store |
| Algorithm choice is hidden | Interface exposes "sort this" or "search this"; implementation can be quicksort, mergesort, or radix depending on input | Interface exposes `quicksort_with_pivot_strategy(data, pivot)` |
| Concurrency model is hidden | Caller calls the function; the module uses threads, async, or single-threaded internally | Interface exposes `start_workers(n)`, `submit_to_pool(task)` |
| Serialization format is hidden | "save" and "load" accept/output domain types. Internal format is JSON, protobuf, or custom binary | Interface exposes `to_json()` and `from_json()` — the format is now a permanent contract |
| Configuration is consolidated | One config struct/object/dict with documented defaults. Caller overrides what they need | 15 separate setter methods, some of which must be called in a specific order |

**Why it matters**: information-hiding is the mechanism that makes modules replaceable. If the internal storage format is visible in the interface, changing it is a breaking change. If it's hidden, changing it is a patch release.

### 4. Caller Cognitive Load

| Criterion | Pass | Fail |
|---|---|---|
| Concepts ≤ 7 for primary use case | The caller learns ≤7 types/functions/config keys to accomplish the main task | Caller must learn 15+ concepts just to do the one obvious thing |
| No "must call this before that" without type-state enforcement | If `open()` must be called before `read()`, `open()` returns a type that's required by `read()` (builder pattern, type-state, session object) | Callers get a runtime panic "not initialized" after calling `read()` before `open()` |
| Defaults are sensible | `new()` or the default config produces a usable module without further configuration | `new()` produces something that panics/crashes/does nothing until 5 more methods are called |
| Error recovery path is clear | Each error is documented with "what the caller should do next" (retry, fail, use fallback) | Error is returned without guidance; caller must read the source to know if retry is safe |
| Public surface is curated | A prelude/barrel/index re-exports the 5-10 symbols callers actually need | Callers must import from deeply nested internal paths (`from module.internal.impl.v2.handlers import do_thing`) |

**Why it matters**: cognitive load is the true cost of an interface. A module that takes 30 minutes to learn is 10x more expensive than one that takes 3 minutes — even if both produce the same output.

### 5. Extensibility

| Criterion | Pass | Fail |
|---|---|---|
| Seam for the thing that varies | If the storage backend varies, the seam is `trait Storage { fn get(&self, key) -> Result<Value>; }`. If nothing varies, no seam. | Every function takes a `Box<dyn Fn(...)>` callback "for extensibility" — speculative abstraction |
| New features don't require new public types | Adding a new query capability adds a parameter to an existing function, not a new `QueryV2` type | Every new feature introduces a new top-level public type, doubling the interface surface |
| Backward-compatible additions | Adding a new optional parameter or a new method to an interface is backward-compatible by design | The interface was designed with positional-only parameters (C), no overloads, no optional/default values |

**Why it matters**: a deep interface that can't evolve becomes shallow over time as workarounds accumulate in callers.

## Depth Scorecard

For every module evaluation, fill this out:

```text
Module: <name>
Primary use case: <one sentence>
Public types: <count>
Public functions: <count>
Total concepts for primary use case: <number>

Signature depth: <pass/fail — number of criteria passed from section 1>
Invariant depth: <pass/fail — number of criteria passed from section 2>
Information-hiding: <pass/fail — number of criteria passed from section 3>
Cognitive load: <pass/fail — number of criteria passed from section 4>
Extensibility: <pass/fail — number of criteria passed from section 5>

Quick-check score: <0-5>
Average section pass rate: <percentage>

Verdict: <Deep | Adequate | Shallow — with justification>
Recommended action: <none | deepen by merging modules | deepen by hiding implementation | split because too many concerns | add a seam because variation is real>
```
