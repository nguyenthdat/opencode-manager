---
name: codebase-design
description: "Module-level design vocabulary and decision process for deep interfaces, seam placement, dependency direction, and module decomposition. Use when designing a new module/package/crate/namespace, evaluating an existing module's depth and testability, placing a seam between units that vary independently, reviewing dependency graphs for cycles or leaky abstractions, or designing cross-language FFI boundaries in multi-language repositories. Covers Rust, TypeScript, Python, Go, C#, Kotlin, Java, C, C++, Swift, Objective-C, Zig, Lua, Ruby, PHP, JavaScript, Groovy, PowerShell, Bash, Assembly, and any language pair for FFI interop. Do not use for system-level architecture decisions (see `software-architect`) or code-level pattern selection (see `design-patterns`)."
compatibility: opencode
metadata:
  domain: cross-language
  audience: senior-developer
  workflow: module-design-interface-review
---

# Codebase Design

Given a module or service already exists (or is being created), design its interface, depth, seam, visibility, and dependency direction. This skill sits between system architecture (`software-architect`) and code-level patterns (`design-patterns`): architecture decomposes the system into containers; codebase-design designs each container's module boundaries; design-patterns picks the code construct inside a module.

This skill is language-agnostic in its **decision process**, but every decision must land in the target language's idiomatic construct. Pair it with the relevant per-language coding-standards skill from the team's roster (`rust-coding`, `typescript-coding`, `python-coding`, `go-coding`, `csharp-coding`, `kotlin-coding`, `java-coding`, `c-coding`, `cpp-coding`, `swift-coding`, `objectivec-coding`, `zig-coding`, `lua-coding`, `ruby-coding`, `php-coding`, `javascript-coding`, `groovy-coding`, `powershell-coding`, `bash-coding`, `assembly-coding`) whenever implementation is in scope. For FFI work involving more than one language, load every relevant language skill.

## Core Vocabulary

Because "component," "service," "API," and "boundary" deliberately blur useful distinctions, this skill uses precise terms:

| Term | Definition | Test |
|---|---|---|
| **Module** | A named, independently-replaceable unit with a defined interface. A crate, package, namespace, library, or source file that owns its own state and namespace. | Can you delete this module and have the complexity go away, not reappear across N callers? |
| **Interface** | Every fact a caller must know to use the module correctly: signatures, invariants, ordering, error modes, performance, and resource/thread-safety contracts. Not just the type-level surface. | Can a new team member read only the interface and use the module correctly? |
| **Depth** | How much behaviour the module delivers divided by how much interface the caller must learn. Deep = small interface, lots of behaviour. Shallow = interface nearly as complex as implementation. | (behaviour delivered) / (interface surface area) — the deletion test measures this |
| **Seam** | A place where you can change behaviour without editing the code at that location (Feathers). An interface that already has at least one alternative implementation, or a strong near-term need for one. | Does at least one real alternative implementation exist or is one concretely planned? |
| **Leverage** | How much a caller exercises per unit of interface. The depth from the caller's perspective. | If one function call does one thing, leverage=1. If one call orchestrates 5 validated, logged, safe operations, leverage>1. |
| **Locality** | How close the evidence of a design decision sits to the code it affects. High locality = decision visible at the call site. Low locality = decision buried in a distant config, annotation, or convention. | Can you see the design decision from the place you're reading? |

## Required Workflow

### 1. Discover Module Boundaries

Before designing, map the existing or proposed decomposition:

- **Domain scan**: what distinct responsibilities exist in the request/feature? Each responsibility is a candidate module. A responsibility is "owns this data," "enforces this invariant," or "coordinates this workflow," not "contains these files in the same folder."
- **Change-rate scan**: which responsibilities change for different reasons? Two responsibilities that always change together may belong in the same module. Two that change independently need a seam between them.
- **Team-ownership scan** (multi-team repos): which team owns which responsibility? Module boundaries that align with team boundaries survive project turbulence; boundaries that cut across team ownership erode under schedule pressure.
- **Deletion test**: for each candidate module, imagine deleting it. If its complexity reappears across N callers, it was doing real work (it has depth). If its complexity vanishes, it was a pass-through (shallow — reconsider).

Record the decomposition in the architecture artifact with a module diagram or a responsibility table, not just a folder listing. Folder structure follows the design, not the other way around.

### 2. Design the Interface (Make It Deep)

An interface is the sum of everything a caller must know. A deep interface delivers maximal behaviour behind a minimal caller-facing surface.

**Interface checklist** (read `references/interface-checklist.md` for full evaluation rubric):

- **Minimal signatures**: the fewest parameters that let the caller express intent. Use the language's narrowest sufficient type per parameter (references/borrows over owned values, interfaces/protocols over concrete collections, `impl Trait`/generics over `dyn`/boxed types where possible). Reject parameters the function can derive internally.
- **Explicit invariants**: document in the interface what the module guarantees to uphold (e.g. "returned slices are always non-empty," "this function is idempotent," "callers must not call `close` twice"). A caller must never have to read the implementation to use the module safely.
- **Explicit error modes**: every fallible operation returns a typed failure (not a boolean, not a string, not a null/None without explanation). The caller must know what can fail and why without reading the implementation.
- **Resource contracts**: who allocates, who frees, who must call `close`/`dispose`/`Drop`. Where the language automates cleanup (Rust `Drop`, C++ RAII, Go `defer`, Python `with`, C# `using`/`IDisposable`), rely on it. Where it doesn't (C, Zig without `defer`, manual Lua GC), document the contract explicitly.
- **Thread/concurrency contracts**: `Send`/`Sync` semantics (Rust), thread-safety guarantees (all languages), cancellation safety (async contexts), reentrancy (all languages). A module that is accidentally safe today is a regression risk tomorrow — declare the contract.
- **Performance contracts**: if the interface guarantees O(1), amortized O(log n), or "does not allocate," say so. A caller building a hot path needs to know what they're paying for.

**Depth measurement** (the practical form — no formulas):

Run these concrete tests on the proposed interface:

1. **The one-function test**: can a caller accomplish the module's primary task with a single function call, or does it require a multi-step dance (create, configure, open, process, close)? A multi-step dance is sometimes correct (streaming, transactions), but every step should deliver its own leverage. If `open()` just sets a flag and `close()` just clears it, the module is shallow.
2. **The documentation test**: count the concepts a caller must learn to use the module. Each public type, each public function, each configuration knob, each ordering requirement is a concept. A deep module has <7 concepts for its primary use case.
3. **The information-hiding test**: how many implementation details can you change without touching the interface? If the storage format, the algorithm, the internal concurrency model, or the error recovery strategy are all hidden behind the same interface, the module is deep. If changing any of them breaks a caller, the interface leaks implementation.
4. **The plumbing ratio**: what fraction of the module's lines are pure infrastructure (serialization, logging, validation, error-wrapping, retry) vs. pure domain logic? A plumbing ratio > 50% signals that the module may be a pass-through for another module that does the real work — check the deletion test.

### 3. Place the Seam

A seam is the mechanism that lets you replace one implementation with another without changing callers. Not every interface needs to be a seam — a seam exists only when variation is real.

**Seam placement rules**:

- **One adapter = hypothetical; two adapters = real**: do not cut a seam until a second implementation is concretely required or under active development. A seam that exists for only one implementation is technical debt dressed as architecture.
- **Seam at the point of variation, not at the point of convenience**: if the variation is "different payment providers," the seam sits around the payment operation, not around the entire checkout workflow.
- **Seam at the module boundary, not inside it**: a seam should be the module's public interface. An internal seam (a private trait, an abstract base class used only inside one module) is a code-organization choice, not a design decision — it belongs in `design-patterns` territory.
- **Test seams are real seams**: if the primary purpose of a seam is testability (injecting a mock clock, a fake database, a test logger), that's valid — tests are a real consumer with a real alternative implementation. But it means the seam's contract (the interface the test relies on) is as real as any production contract, and changing it breaks tests.
- **Cross-language seams (FFI boundaries)**: when the seam crosses a language boundary, the contract expands to include memory ownership, data layout, calling convention, error-propagation mechanism, and thread/model compatibility. Design FFI seams with the full contract in mind — see `references/ffi-cross-language.md`.

**Seam inventory**: for each proposed seam, record:

```text
Seam: <where the call crosses>
Current implementations: <the one(s) that exist today>
Planned implementations: <the one(s) concretely required soon>
Variation axis: <what changes across implementations>
Testability: <is a test double feasible at this seam?>
Stability: <how likely is this interface to change?>
```

### 4. Set Visibility and Encapsulation

Every module should expose the narrowest possible public surface, using the language's visibility/access-control mechanism.

Visibility rules per language family — read `references/module-idioms-by-language.md` for full per-language detail:

| Language family | Default rule | Maximum private scope | Public surface |
|---|---|---|---|
| Rust | `pub(crate)` for cross-module access within the crate; `pub` only for the public API | `pub(crate)` or private (default) | `pub` items re-exported through `lib.rs` or a `prelude` |
| TypeScript/JavaScript | `export` only the public interface; keep everything else module-private | Un-exported declarations | Barrel export from `index.ts`/`index.js` |
| Python | `__all__` or leading-underscore for internal; no underscore for public | Module-private (no `__all__` entry, or `_` prefix) | `__all__` list or `__init__.py` re-exports |
| Go | Unexported (lowercase) for internal; exported (Uppercase) for public | Unexported package scope | Exported names in the package |
| C#/.NET | `internal` for within-assembly; `public` for consumers | `private` / `internal` / `file` (C#11+) | `public` types members, with `EditorBrowsable` for IDE hiding |
| JVM (Java/Kotlin/Groovy) | `package-private` or `internal` (Kotlin) for within-module; `public` for consumers | `private` / package-private / `internal` | `public` classes and members |
| Apple (Swift/ObjC) | `internal`/`package` (Swift) for within-module; `public`/`open` for consumers | `private`/`fileprivate`/`internal` | `public`/`open` protocol conformances and methods |
| C/C++ | `static` file-scope for internal; header-exposed for public | `static` functions, anonymous namespace (C++), or opaque pointer (PIMPL) | Header-declared, non-`static` symbols |
| Zig | File-scope `const`/`fn` by default; `pub` for public | Non-`pub` declarations | `pub` declarations |
| Lua | Local variable/function by default (`local function`); module table for public | `local` everything | Returned module table |
| Dynamic (Ruby/PHP) | `private`/`protected` for internal; `public` for consumers | Language-appropriate private scope | Public methods, autoload or explicit requires |
| Shell (Bash/PowerShell) | `local` variables and functions; `source`/dot-source for module imports | `local` scope | Function exports, module manifest (PowerShell) |

**Visibility enforcement**: after designing the public surface, write a lint/test rule that flags new public items without explicit approval. In Rust, `#[deny(unreachable_pub)]` with `pub(crate)` defaults. In TypeScript, use a barrel-file lint. In Go, lint for exported symbols in internal packages.

### 5. Direct Dependencies

Dependency direction is the strongest predictor of a module's long-term change cost. Dependencies should flow from less stable to more stable, from concrete to abstract, and from leaf modules toward the domain core — never in a cycle.

**Dependency direction rules**:

- **Acyclic dependency principle**: the module dependency graph must be a DAG. A cycle means the two modules are one module that has been split at the wrong seam — merge them, extract a shared interface, or invert the dependency.
- **Depend on stable abstractions, not volatile concretes**: a module should depend on interfaces/traits/protocols that change less often than its own code. If module A depends on module B, and B changes more often than A, B is pulling A into its change radius — invert the dependency (dependency inversion: both depend on an abstraction owned by A).
- **Domain core is leafward**: the domain/business-logic module should have zero dependencies on infrastructure modules (database, HTTP, filesystem, queue). Infrastructure modules depend on the domain core through interfaces/ports, never the reverse. This is the single test that separates a maintainable codebase from a framework that happened to get business logic written inside it.
- **Cross-language dependency direction**: in a multi-language repo, the dependency direction follows the same rule but adds a language boundary cost. Prefer a single language per module. When a module must span languages (e.g. a Rust core with Python bindings), the Rust module owns the contract and the Python module is a thin consumer. When two modules in different languages must communicate, the FFI seam is the interface — neither module imports the other's source; both depend on a shared C-ABI contract. See `references/ffi-cross-language.md`.
- **Test dependency rule**: test code depends on production code, never the reverse. A `#[cfg(test)]` block (Rust), a `_test.go` file (Go), a test project (C#/Java/Kotlin), or a `test_*.py` file (Python) is a downstream consumer that validates the interface. If production code needs test-only hooks, those hooks are part of the public interface (or the module is insufficiently deep — the hook is compensating for a seam that should exist).

**Dependency audit**: draw the module graph. For each edge A→B, answer:
- What does A need from B (data, behaviour, coordination)?
- How often does B change relative to A?
- If B were replaced, would A need to change?
- Is there a cycle? (Run the language's cycle detector: `cargo udeps`+manual, `madge` for JS/TS, `import-linter` for Python, `goda` for Go, `ndepend` for .NET.)

### 6. Design for Testability

A well-designed module is testable through its public interface without test-only workarounds. If testing requires reflection, monkey-patching, or accessing private internals, the module's interface is insufficiently deep — the test is telling you where the seam should have been.

**Testability principles**:

- **Test through the public interface only**: every behaviour a test needs to verify must be reachable through the module's public API. Internal helpers get tested as a side effect of testing the public entry points. If an internal function is so complex it needs dedicated tests, it's a candidate module with its own interface.
- **Replaceable dependencies at the seam**: every external dependency (database, network, filesystem, clock, random) should be replaceable through the module's interface — not through global monkey-patching, not through a test-only config flag that branches inside production code. If the module creates its own dependencies internally (hard-coded `new HttpClient()`, `open("real_file.txt")`), it's not testable. The caller supplies dependencies through the interface (constructor injection, function parameter, trait/generic bound).
- **No test-only public API**: never expose a function, type, or method only to make it testable. If a caller wouldn't invoke it in production, it shouldn't exist. Instead, use the language's test-module mechanism (`#[cfg(test)]` in Rust, `_test.go` in Go, internal-test project in .NET, test-scoped visibility in Java) to test internal units from a sibling test.
- **Fakes are tests too**: a fake (in-memory database, deterministic clock, recording logger) is a real implementation of the module's seam contract. It must uphold the same contract as the production implementation. When the production implementation changes behaviour, the fake must change too — or the tests become a second, conflicting specification.

Read `references/seam-testability.md` for per-language testability patterns and the seam-as-contract framework.

### 7. Cross-Language Module Design (Multi-Language Repos)

Multi-language repositories introduce design constraints that single-language repos avoid: memory ownership across language boundaries, calling-convention compatibility, error-model translation, type-system alignment, and build-system coordination.

When the repo contains modules in multiple languages:

1. **Language-per-module, not language-per-layer**: each module is written in exactly one language. Do not split a single module's logic across two languages (e.g. validation in Python, persistence in Rust, all in one module). That's not a module — it's a dependency graph across languages, and the language boundary is now a module boundary.

2. **FFI seam is the module interface**: when module A (language X) calls module B (language Y), the FFI boundary is the public interface. Design it with all the same rigour as any other interface: minimal surface, explicit invariants, typed errors, resource contracts. The C ABI (or the platform's equivalent) is the wire format — treat it as the contract.

3. **One language owns memory, the other borrows it**: at every FFI call, decide explicitly which language allocates, which deallocates, and whether ownership transfers across the boundary. Never let two languages independently free the same allocation. The owner is the language whose allocator created the memory; the borrower accesses it through an opaque handle or a borrow with a documented lifetime. After the FFI call returns, the borrower must not hold a dangling reference.

4. **Error model translation**: each language has its own error idiom. At the FFI boundary, translate: Rust `Result<T, E>` → C `int` return code + out-parameter or thread-local error; Go `(T, error)` → C return code + out-parameter; Python exception → C error code (catch at the boundary); C#/Java/Kotlin exception → C error code; C++ exception → C error code (catch at boundary; never let a C++ exception unwind through C frames). On the caller side, translate back: C return code → caller's native error idiom.

5. **Build-system coordination**: the build system must know the dependency order between languages. A Rust crate that exposes C-ABI functions to Python via `ctypes`/`cffi` must build before the Python module that loads it. Record the build dependency graph explicitly in the architecture artifact — "the Rust core builds first, then the Python bindings, then the Go CLI links against the shared library."

Full per-pair FFI patterns (Rust↔Python, Rust↔TypeScript, Go↔C, Python↔C, C++↔Rust, C#↔C, Swift↔Rust, and all other common pairs) are in `references/ffi-cross-language.md`.

## Review Rules

Treat as **BLOCKER** when they risk correctness, maintainability, or cross-language safety:

- The module dependency graph contains a cycle. The modules are one module split at the wrong seam.
- A public interface leaks implementation details (storage format, algorithm choice, internal data structure) that would break callers if changed.
- A cross-language FFI seam has no explicit memory-ownership documentation (who allocates, who frees, lifetime).
- A domain/core module directly depends on an infrastructure module (database driver, HTTP client, filesystem library).
- A module's public surface has >10 public types/functions without a re-export/prelude/barrel that reduces the caller's cognitive load.
- A proposed seam has only one implementation and no concrete near-term plan for a second — it's speculative abstraction.
- Test code requires accessing private module internals — the module's interface is insufficiently deep.

Treat as **WARNING**:

- A module is a pass-through (fails the deletion test — removing it just moves the call one level up).
- The plumbing ratio exceeds 50% without a documented reason (some modules exist to encapsulate infrastructure, which is a valid design).
- A module exposes `static mut`/global mutable state (Rust), module-level mutable singletons (Python/TypeScript/Go/C#/Java), or unsynchronized globals (C/C++/Zig).
- Public documentation for the module describes *how* it works (implementation) rather than *what* it guarantees (interface contract).
- The module's dependency direction violates the stability rule (unstable module depends on more-stable module — the reverse of what's safe).

## Decision Record

For every materially significant module-design decision, record in the architecture or run artifact:

```text
Module: <name and language>
Responsibility: <what this module owns — data, invariant, workflow>
Interface depth: <number of public concepts for the primary use case>
Seam(s): <where the module can be replaced; what alternative implementations exist>
Dependencies: <what this module depends on, in stability order>
Cross-language boundary: <if any, which language pair, who owns memory>
Testability: <how the module is tested through its public interface>
Alternatives: <at least one other decomposition or interface shape considered and rejected>
```

## Verification

After designing or reviewing a module:

1. Run the **deletion test** on each candidate module: imagine deleting it. Where does the complexity go?
2. Run the **one-function test** on each module's primary use case: can it be invoked with one call?
3. Run the **dependency audit**: draw the graph, check for cycles, verify domain-core isolation.
4. For FFI seams: verify that the memory-ownership contract is documented and that error-model translation is explicit at every boundary.
5. Run the project's native build/lint/test gates for the affected language(s).

## References

- `references/module-idioms-by-language.md` — per-language module patterns, visibility, packaging, and module-system conventions for all 20+ languages.
- `references/ffi-cross-language.md` — cross-language FFI design patterns: Rust↔C, Python↔C, Go↔C, C++↔Rust, C#↔C, Swift↔Rust, Node↔Rust, and multi-language build-system coordination.
- `references/interface-checklist.md` — full interface-depth evaluation rubric with concrete pass/fail criteria.
- `references/seam-testability.md` — seam placement as a testability strategy, per-language test-double patterns, and the fake-as-contract framework.
