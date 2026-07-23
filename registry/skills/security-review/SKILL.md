---
name: security-review
description: >-
  Expert code security, correctness, and maintainability review for any language — Rust, TypeScript/JavaScript, Python, Go, C#, Kotlin, C, C++, Swift — used for code audits, PR/diff review, unsafe/native-interop audit, dependency and supply-chain review, or reviewing any module, service, or codebase. Triggered by: security review, audit, code review, PR review, unsafe review, vulnerability scan, dependency audit, crate/package review.
compatibility: opencode
metadata:
  review-clusters: "15 Rust clusters + thematic clusters per language"
  bug-classes: "254 total (69 Rust + 185 across TypeScript/Python/Go/C#/Kotlin/C/C++/Swift)"
---

# Security Review

Expert code review covering security, correctness, safety, and maintainability across any language this team works in. This skill combines manual code reasoning, language-specific security analysis, and tool-assisted validation. It is not a linter wrapper — it understands each language's semantics, memory/type/resource model, concurrency hazards, and attack surfaces.

## When to Use

- Full repository security audit
- PR or git diff review
- Unsafe / native-interop / FFI audit
- Dependency and supply chain review
- Single module, package, or service deep-dive
- Verification of fixes
- Bug-class-specific detection (e.g., "find all cancel-safety issues", "find all prototype pollution", "find all deserialization RCE")

## Review Modes

Before starting, clarify the scope. A leaf specialist uses the mode and exact paths supplied by the lead and never questions the user directly. When this skill is used directly and the user's scope is ambiguous, ask one concise question.

| Mode | Trigger phrases | What to do |
|---|---|---|
| Full Audit | "audit", "security review", "review the repo" | Whole-repo risk-based review |
| Diff Review | "PR", "diff", "this change", "review my changes" | Review changed code + callers/callees |
| Module Review | "review src/x/", "review the parser" | Deep-dive on a subtree |
| Unsafe Audit | "unsafe", "unsafe audit", "native audit" | Every unsafe/native-interop block, function, boundary |
| Dependency Review | "dependencies", "supply chain" | Manifest/lockfile, build scripts, transitive risk |
| Fix Verification | "did I fix", "verify the fix" | Confirm a fix and check for regressions |
| Bug-Class Hunt | "find all cancel-safety issues" | Targeted grep + review for one bug class |

## Workflow

### Phase 1: Repository Discovery

Before reviewing any code, identify which language(s) and build systems are in play, then use the matching commands below.

| Language | Manifest / build file | Entry-point conventions |
|---|---|---|
| Rust | `Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml` | `src/main.rs`, `src/lib.rs`, `examples/`, `tests/`, `benches/`, `build.rs` |
| TypeScript/JavaScript | `package.json`, `tsconfig.json`, lockfile (`package-lock.json`/`pnpm-lock.yaml`/`yarn.lock`) | `src/index.ts`, `main`/`exports` field, `bin/`, framework entry (`app.ts`, `server.ts`, `pages/`, `app/`) |
| Python | `pyproject.toml`, `setup.py`/`setup.cfg`, `requirements*.txt`, lockfile (`poetry.lock`/`uv.lock`) | `__main__.py`, `src/<pkg>/__init__.py`, console-script entry points, `wsgi.py`/`asgi.py` |
| Go | `go.mod`, `go.sum` | `main.go`/`cmd/*/main.go`, `internal/`, `pkg/` |
| C# | `*.csproj`, `*.sln`, `packages.lock.json` | `Program.cs`, `Startup.cs`, `*.Controllers/`, `Properties/launchSettings.json` |
| Kotlin | `build.gradle.kts`/`build.gradle`, `settings.gradle.kts` | `MainActivity.kt`/`Application.kt`, `src/main/kotlin/` |
| C | `Makefile`, `CMakeLists.txt`, `configure.ac` | `main.c`, header layout (`include/`), build targets |
| C++ | `CMakeLists.txt`, `Makefile`, `conanfile.txt`/`vcpkg.json` | `main.cpp`, `include/`, module boundaries |
| Swift | `Package.swift`, `*.xcodeproj`/`*.xcworkspace` | `main.swift`, `@main` entry, `Sources/<Target>/` |

Generic discovery commands (language-agnostic):

```bash
# What languages/build files are present
find . -maxdepth 3 \( -name 'Cargo.toml' -o -name 'package.json' -o -name 'pyproject.toml' \
  -o -name 'go.mod' -o -name '*.csproj' -o -name 'build.gradle*' \
  -o -name 'CMakeLists.txt' -o -name 'Package.swift' -o -name 'Makefile' \) -print

# CI configuration, always useful regardless of language
find . -maxdepth 3 -path '*/.github/workflows/*' -o -name 'Makefile' -o -name 'justfile'
```

Read the manifest(s), lockfile(s), and any `README.md`. Identify:
- Module/package/workspace boundaries
- Entry points (per table above)
- Feature flags / build configuration and their security impact
- Build/codegen scripts (`build.rs`, `setup.py`, Gradle plugins, CMake custom commands) and what they do
- Key dependencies (by count and sensitivity: crypto, networking, parsing, native interop)
- CI configuration (`.github/workflows/`, `Makefile`, `justfile`)

### Phase 2: Capability Detection

Probe the codebase for risk-relevant features. Use fast targeted commands, picking the row(s) for the language(s) actually present.

| Capability | Rust | TypeScript/JS | Python | Go | C# | Kotlin | C/C++ | Swift |
|---|---|---|---|---|---|---|---|---|
| Unsafe / native interop | `unsafe\s*(extern\|fn\|impl\|trait\|\{)` | `:\s*any\b`, `\beval\(`, `new Function\(` | `\bctypes\b`, `*.pyx`, `Extension(` in `setup.py` | `\bunsafe\.` , `import "C"` (cgo) | `\bunsafe\b`, `DllImport`, `Marshal\.` | raw JNI (`external fun`), `sun\.misc\.Unsafe` | effectively all code (pointers, casts, manual memory) | `Unsafe(Mutable)?(Raw)?Pointer`, `@_silgen_name`, ObjC bridging |
| Concurrency | `std::thread\|std::sync::\|tokio::sync\|parking_lot\|crossbeam\|Atomic\|Mutex\|RwLock\|UnsafeCell` | `Worker(Thread)?\|Atomics\.\|SharedArrayBuffer\|worker_threads` | `threading\.\|multiprocessing\.\|asyncio\.Lock\|concurrent\.futures` | `\bgo \|sync\.\|sync/atomic\|channel\b` | `Task\.\|lock\s*\(\|Monitor\.\|Interlocked\.\|System\.Threading` | `Thread(\|kotlinx\.coroutines\|synchronized\(\|@Volatile` | `pthread_\|std::thread\|std::mutex\|std::atomic` | `DispatchQueue\|Task \{\|actor \|@MainActor` |
| Async | `\basync\s+fn\b\|\.await\b` | `\basync\s+function\|\bawait\b\|\.then\(` | `\basync def\|\bawait\b` | goroutines + channels (no async keyword) | `\basync\s+Task\|\bawait\b` | `\bsuspend fun\|kotlinx\.coroutines` | N/A (or libuv/callback-based) | `\basync\s+func\|\bawait\b` |
| Path/FS ops | `PathBuf\|File::\|OpenOptions\|std::fs\|tokio::fs` | `\bfs\.\|path\.join\|readFile\|createReadStream` | `\bopen(\|os\.path\.\|pathlib\.Path` | `os\.Open\|filepath\.Join\|ioutil\.` | `File\.\|Path\.\|Directory\.` | `java\.io\.File\|Files\.` | `\bopen(\|fopen\|std::filesystem` | `FileManager\|URL(fileURLWithPath` |
| Networking | `TcpListener\|TcpStream\|hyper\|reqwest\|tonic` | `\bfetch(\|axios\|http\.request\|net\.Socket` | `requests\.\|httpx\.\|socket\.\|urllib` | `net/http\|net\.Dial` | `HttpClient\|Socket\|WebRequest` | `OkHttp\|Retrofit\|Ktor` | `socket(\|curl_\|boost::asio` | `URLSession\|Network\.framework` |
| Serialization | `serde\|Deserialize\|serde_json\|bincode` | `JSON\.parse\|deserialize\|class-transformer` | `pickle\.\|yaml\.load\|json\.loads\|marshal\.` | `encoding/gob\|json\.Unmarshal\|yaml\.Unmarshal` | `BinaryFormatter\|JsonSerializer\|XmlSerializer` | `kotlinx\.serialization\|Gson\|Jackson` | manual (de)serialization, `memcpy` into structs | `Codable\|JSONDecoder\|NSKeyedUnarchiver` |
| Process execution | `Command::new\|std::process` | `child_process\.\|exec(\|spawn(` | `subprocess\.\|os\.system\|os\.popen` | `os/exec\.Command` | `Process\.Start` | `ProcessBuilder\|Runtime\.getRuntime\(\)\.exec` | `system(\|exec(l\|v)\|popen(` | `Process(\)`, `NSTask` |
| Cryptography | `ring::\|aes::\|rsa::\|hmac::\|ed25519` | `crypto\.\|jsonwebtoken\|node:crypto` | `hashlib\.\|cryptography\.\|jwt\.` | `crypto/\|golang\.org/x/crypto` | `System\.Security\.Cryptography` | `javax\.crypto\|java\.security` | `openssl_\|EVP_\|CryptoAPI` | `CryptoKit\|CommonCrypto\|SecKey` |

For each capability detected, note which modules/packages/files are involved.

### Phase 3: Build Review Plan

Based on capability flags and scope, prioritize review areas. High-risk surfaces get priority, regardless of language:

1. Unsafe/native-interop code and FFI boundaries — always review first
2. Input parsing at trust boundaries
3. Authentication and authorization
4. Cryptography and secrets
5. Networking and protocol handling
6. Filesystem and process interaction
7. Concurrency, async, and shared state
8. Crash/exception paths reachable from untrusted input (panics, unhandled exceptions, unwraps, force-unwraps)
9. Public API safety contracts
10. Build scripts, codegen, and macros/annotation processors

Do NOT try to read every file equally. Use risk-based sampling: deep-dive the high-risk files, skim the rest.

### Phase 4: Review Execution

Review by cluster (see Review Clusters below). For each cluster:

1. Identify relevant files in scope using `rg` / `grep`
2. Read the high-risk files (not every match)
3. Trace data flow through trust boundaries
4. Validate assumptions with tools where available
5. Record findings in the standard finding format

Use local tools to validate, not guess. Pick the row(s) for the language(s) in scope:

| Language | Type/syntax check | Lint | Test | Dependency/vuln audit | Deep validation |
|---|---|---|---|---|---|
| Rust | `cargo check 2>&1` | `cargo clippy --all-targets 2>&1` | `cargo test 2>&1` | `cargo audit 2>&1` | `cargo +nightly miri test 2>&1` |
| TypeScript | `tsc --noEmit` | `eslint .` | `vitest run` / `jest` | `npm audit` / `pnpm audit` | — |
| Python | `mypy .` / `pyright` | `ruff check .` | `pytest` | `pip-audit` / `safety check` | `bandit -r .` |
| Go | `go build ./...` | `go vet ./...` / `staticcheck ./...` | `go test ./...` | `govulncheck ./...` | `go test -race ./...` |
| C# | `dotnet build` | Roslyn analyzers (`dotnet build` with analyzers enabled) | `dotnet test` | `dotnet list package --vulnerable` | — |
| Kotlin | `./gradlew compileKotlin` | `./gradlew detekt` / `ktlintCheck` | `./gradlew test` | `./gradlew dependencyCheckAnalyze` (if configured) | — |
| C/C++ | `gcc/clang -Wall -Wextra` | `clang-tidy` / `cppcheck` | `ctest` | manual (no standard registry) | `-fsanitize=address,undefined`, `valgrind` |
| Swift | `swift build` | `swiftlint` | `swift test` | — | Xcode static analyzer |
| Cross-language | — | `semgrep --config auto` (supports all of the above) | — | — | — |

If a tool is not installed, note it as a limitation and continue with manual review. Do not install tools without user approval.

### Phase 5: Produce Report

See Output Format below for the report structure. Key rules:
- Every finding must reference specific code (file path, function, line when available)
- Separate confirmed issues from suspicious patterns
- Include fix guidance for each finding
- Note tools that were and were not run
- If doing a diff review, flag blocking issues first

## Review Clusters

### Rust Deep-Dive (Cluster Reference Table)

Rust has the deepest reference library in this skill: 15 review clusters covering 69 bug classes, built out over extensive iteration. The prompts live in `references/rust/prompts/clusters/` and `references/rust/prompts/general/`. Use them as review guides — not as scripts to execute blindly. Read the relevant cluster prompt before reviewing that area, then apply the methodology with the actual code.

| Cluster | Gate | Key Bug Classes | Prompt |
|---|---|---|---|
| Unsafe Boundary & Safety Contracts | always | unsafe APIs, transmute, raw pointers, repr(C), safety docs, debug-assert safety | `references/rust/prompts/clusters/unsafe-boundary.md` |
| Memory Safety (unsafe) | has_unsafe | uninit reads, set_len, UAF, double-free, buffer overflow, union UB, panic-unwind | `references/rust/prompts/clusters/memory-safety.md` |
| Concurrency: Locking | has_concurrency | double-lock, ABBA deadlock, condvar, channel starvation, once reentrancy | `references/rust/prompts/clusters/concurrency-locking.md` |
| Concurrency: Data Races | has_concurrency | atomic races, unsafe Send/Sync, shared memory, static mut | `references/rust/prompts/clusters/concurrency-data-race.md` |
| Panic & DoS | always | unwrap on untrusted, overflow, OOB index, str-slice boundary, refcell borrow, resource exhaustion | `references/rust/prompts/clusters/panic-dos.md` |
| Recursion DoS | always | recursive deserialize, recursive format, recursive drop stack overflow | `references/rust/prompts/clusters/recursion-dos.md` |
| Error Handling | always | discarded Result, drop panic, lossy conversions, unflushed buffers | `references/rust/prompts/clusters/error-handling.md` |
| Logic Correctness | always | Ord/Eq/Hash consistency, float edge, string comparison, nondeterminism, collection key mutation | `references/rust/prompts/clusters/logic-correctness.md` |
| FFI Cross-Language | has_ffi | CString dangling, ABI mismatch, repr(C) padding, opaque pointers, foreign drop, closure FFI, dyn trait FFI | `references/rust/prompts/clusters/ffi-cross-language.md` |
| Layout Safety | has_packed_repr | packed field references | `references/rust/prompts/clusters/layout-safety.md` |
| Async Runtime | has_async | async blocking, cancel safety, select bias | `references/rust/prompts/clusters/async-runtime.md` |
| Static Hygiene | always | cargo lint config, MSRV mismatch, deprecated APIs | `references/rust/prompts/clusters/static-hygiene.md` |
| Resource Handling | always | raw fd lifecycle, destructor skip | `references/rust/prompts/clusters/resource-handling.md` |
| Input & OS Safety | has_fs_io | path traversal via join, TOCTOU | `references/rust/prompts/clusters/input-os-safety.md` |
| Info Disclosure | always | pointer exposure via Debug/Display | `references/rust/prompts/clusters/info-disclosure.md` |

In addition to the cluster prompts, `references/rust/prompts/general/` contains 55 individual bug-class finder prompts. These are useful for targeted bug-class hunts. Read the relevant finder prompt when the user asks for a specific bug class. `references/rust/scripts/` contains `build_run_plan.py`, `generate_sarif.py`, and `validate_artifacts.py` for orchestrated multi-worker Rust runs.

### Per-Language Bug-Class References

For every other language, a lighter but still specific bug-class checklist lives at `references/<language>.md`. Read the relevant file before reviewing that language's code:

| Language | Reference file | Approx. bug classes |
|---|---|---|
| TypeScript/JavaScript | `references/typescript.md` | 31 |
| Python | `references/python.md` | 27 |
| Go | `references/go.md` | 24 |
| C# | `references/csharp.md` | 24 |
| Kotlin | `references/kotlin.md` | 20 |
| C | `references/c.md` | 21 |
| C++ | `references/cpp.md` | 19 |
| Swift | `references/swift.md` | 19 |

Each file uses the same finding-format and severity conventions as this SKILL.md, organized into clusters that mirror the Rust categories where they transfer: memory/resource safety, concurrency, error handling, input validation/injection, crypto/secrets, auth/trust boundaries, supply chain, crash-induced DoS, logic correctness, and native-interop/FFI where applicable.

### Expanded Review Scope

The cluster/reference prompts cover specific bug classes. A thorough review must also examine broader design-level concerns:

**Cryptography and Secrets:**
- Custom crypto, weak algorithms, weak RNG (non-CSPRNG)
- Key/nonce/IV reuse, missing constant-time comparison
- Secret material logged or leaked via string conversion, error messages, or serialization
- TLS configuration, certificate verification, hostname validation
- Token generation and handling

**Auth and Trust Boundaries:**
- Auth bypass, missing role/permission checks
- Tenant/workspace isolation, confused deputy
- Privilege escalation paths, policy enforcement location
- Server-side vs client-side validation

**Filesystem and OS Interaction:**
- Symlink attacks, temp file races (TOCTOU, `/tmp` usage)
- Insecure permissions on created files
- Command injection via shell-out APIs with untrusted args
- Environment variable trust, signal handling

**Networking and Protocol Handling:**
- SSRF risks, redirect handling, proxy trust
- DNS trust, timeout/retry behavior
- Protocol parser ambiguity, request smuggling assumptions
- Unbounded connection or body size

**API Design and Maintainability:**
- Type-state / type-safety opportunities for misuse resistance
- Public API invariants and their enforcement
- Missing "must check result" enforcement on fallible operations (e.g. `#[must_use]`, ESLint `no-floating-promises`, Go `errcheck`)
- Type bounds/interfaces that leak implementation details
- Visibility/access-modifier audit (`pub`/`pub(crate)`, `public`/`internal`/`private`, `export`)
- Documentation of safety contracts on unsafe/native APIs

**Testing and Verification:**
- Unsafe/native invariant tests, sanitizer coverage (Miri, ASan/UBSan, TSan)
- Error-path testing, panic/exception-path testing
- Concurrency test coverage (loom/shuttle for Rust; `-race` for Go; stress tests elsewhere)
- Fuzz targets — `cargo fuzz` (Rust), libFuzzer/AFL++ (C/C++), Atheris (Python), go-fuzz/native `testing.F` (Go), jsfuzz (JS/TS) — and property tests (proptest, Hypothesis, fast-check)
- Regression tests for fixed bugs

**Performance and Resource Safety:**
- Unbounded allocation from untrusted input
- Unbounded recursion risk
- Memory/resource leaks (reference cycles, unclosed handles, channel/task leaks, goroutine leaks)
- File descriptor or connection leaks
- Blocking I/O in async/event-loop contexts
- Copy-heavy or allocation-heavy hot paths

## Tool Usage Rules

**Always prefer fast, targeted commands.** Check repo size before running anything expensive:

```bash
# Quick size check, adapt extension to the language in scope
find . -name '*.rs' -o -name '*.ts' -o -name '*.py' -o -name '*.go' -o -name '*.cs' \
  -o -name '*.kt' -o -name '*.c' -o -name '*.cpp' -o -name '*.swift' | wc -l
```

- For targeted review, scope tool invocations to the package/module under review rather than the whole workspace (`cargo check -p <crate>`, `go build ./path/...`, `pytest path/to/test_module.py`, etc.)
- Do not run a full workspace build/test on large repos without need
- Prefer `rg` over reading every file
- Use `git grep` for version-controlled code searches
- For large results, pipe to `head` or `wc -l` first, then drill down

**When tools are unavailable:**
- Report it and continue with manual review
- Do not install tools without user approval
- Fall back to manifest/lockfile inspection for dependency info if a vuln scanner is missing

**Git-aware review:**
- For diff reviews: `git diff`, `git log --oneline`, `git diff --stat`
- Check what changed: `git diff HEAD~1` or `git diff <base>...<head>`
- Look at test changes alongside code changes

## Finding Format

Every finding must use this structure:

```markdown
### Finding: [Title]

- **Finding ID:** [stable ID]
- **Bug class:** [lowercase-hyphenated defect ID; do not reuse the broad Category]
- **Impact kind:** Security | Correctness | Both
- **Severity:** Critical | High | Medium | Low | Informational
- **Confidence:** High | Medium | Low
- **Category:** [e.g., Memory/Native Safety, Concurrency, Error Handling, Input Validation, ...]
- **Affected code:**
  - **File:** `path/to/file.ext`
  - **Function/module:** `fn_name` or `module::path`
  - **Line(s):** L123-L145 (when available)
- **Evidence:** [Code snippet or description of the issue]
- **Why it matters:** [Security/correctness impact]
- **Exploitability / failure mode:** [How this could be triggered or exploited]
- **Recommended fix:** [Concrete suggestion]
- **Validation:** [How to verify the fix]
- **Regression test suggestion:** [What test to add]
```

### Severity Guidance

| Severity | Criteria |
|---|---|
| Critical | RCE, auth bypass, private key/credential exposure, reliable memory/native unsafety across trust boundary, severe data compromise |
| High | Likely exploitable bug, privilege escalation, serious DoS, unsound unsafe/native abstraction, sensitive data exposure |
| Medium | Security-relevant bug requiring specific conditions, significant correctness issue, missing auth check on limited path, dependency risk |
| Low | Hard-to-exploit, defense-in-depth gap, minor crash/DoS, weak validation with limited impact |
| Informational | Maintainability, clarity, test coverage, hardening suggestion |

### Evidence Rules

- Never report a vulnerability without code evidence
- If only suspicious, label it **Suspicious pattern / Needs validation** instead of a confirmed finding
- Do not inflate severity
- Memory/type/resource "safety" claims must be backed by evidence appropriate to the language's actual safety model: a memory-safe, garbage-collected language (TypeScript, Python, Go, C#, Kotlin, Swift's managed-memory paths) can still have logic-level "safety" issues — races, resource leaks, type confusion at dynamic boundaries — but do not claim raw memory corruption (buffer overflow, use-after-free, double-free) unless the code drops into native/unsafe territory (Rust `unsafe`, C/C++, native extensions, `ctypes`, P/Invoke, JNI, `UnsafePointer`) or a runtime/VM bug is independently confirmed
- For unsafe/native-interop code, analyze: what invariant is assumed, where it is established, whether callers can violate it, whether safety comments/docs are complete
- For dependency issues, distinguish known advisories (RUSTSEC, GHSA, CVE, OSV) from general supply-chain concern

## Unsafe Code Review Protocol

"Unsafe" means whatever construct in the language under review turns off compiler/runtime safety guarantees and hands correctness responsibility to the developer:

- **Rust:** `unsafe` blocks/fns/impls/traits
- **C/C++:** the entire language is inherently unsafe by default (manual memory, pointer arithmetic, no bounds checking) — treat every buffer, pointer, and manual allocation as in-scope, not just an "unsafe" subset
- **Go:** the `unsafe` package, cgo boundaries (`import "C"`)
- **C#:** `unsafe` code blocks, `P/Invoke` (`DllImport`), `Marshal` calls
- **Kotlin:** JNI boundaries, raw `external fun` declarations, direct `sun.misc.Unsafe` usage
- **Swift:** `Unsafe(Mutable)(Raw)?(Buffer)?Pointer` family, `@_silgen_name`, Objective-C bridging (`unmanaged`, `Any`/`AnyObject` casts)
- **Python:** C extensions, `ctypes`, `cffi`
- **TypeScript/JavaScript:** no direct equivalent — the closest analogs are `any`-typed boundaries (which silently disable the type checker), `eval`/`new Function()` (dynamic code execution), and native addons (N-API / node-gyp) that cross into C/C++

For every unsafe/native-interop block, function, or boundary, document:

1. **What invariant** the unsafe code assumes
2. **Where the invariant is established** — is it at the unsafe site, in a caller, or in an explicit safety comment/doc?
3. **Whether callers can violate it** — is the unsafe API reachable from safe/managed code? From external callers?
4. **Safety documentation completeness** — does the comment/doc explain *why* each unsafe operation is sound?
5. **Enforcement mechanism** — are there tests, type system constraints, or runtime assertions?
6. **Failure mode** — what corruption, crash, or unsoundness occurs if the invariant is violated?

A missing safety comment on currently sound internal unsafe code is normally Low hardening debt. An unsafe public API with undocumented caller obligations is at least Medium. Raise severity only when the missing or false contract permits an invariant violation with greater demonstrated impact.

## Diff Review Mode

When reviewing a PR or diff:

1. Run `git diff --stat` and identify changed files
2. Identify security-sensitive changes (unsafe/native code, FFI, parsing, auth, crypto, network, fs)
3. Review each changed file plus its callers and callees
4. Check that tests were updated with the change
5. Look for regression risk in adjacent code
6. Output blocking issues first, then recommendations

For diff review, include a section "Changed files and risk assessment" listing each changed file with its risk category.

## Orchestration Boundary

This skill owns review methodology and finding semantics only. `senior-developer/lead` owns agent IDs, partitioning, dispatch order, artifacts, retries, and synthesis. A leaf reviewer or audit worker never calls `task`; it returns `handoff_requests` through the lead-defined envelope.

Deep-audit workers emit stable `bug_class` values. Deduplication must not substitute the broad Category for that identifier. Adjudication assigns correctness and security verdicts independently so a real correctness defect is never dismissed solely for being outside an attacker threat model.

## Guardrails

- Do not rewrite code unless the user asked for fixes
- Do not run destructive commands (`rm`, `git reset --hard`, package-manager "clean" commands, etc.)
- Do not install tools or modify project config without user permission
- Do not expose secrets found in files; redact them in findings
- Do not assume all code is safe because it compiles/type-checks/passes lint
- Do not assume all unsafe/native code is wrong
- Do not focus on style over security/correctness
- Do not ignore tests, features, build scripts, or dependencies
- Do not invent command output; run the command or state that it was not run
- Do not copy any source methodology's text verbatim; adapt it to the actual code

## Output Format

### Security Review Report

#### Executive Summary

- **Review mode:** [Full Audit / Diff Review / Module Review / Unsafe Audit / Dependency Review / Fix Verification / Bug-Class Hunt]
- **Scope:** [What was reviewed]
- **Language(s):** [Rust / TypeScript / Python / Go / C# / Kotlin / C / C++ / Swift / mixed]
- **Overall risk:** [Critical / High / Medium / Low]
- **Blocking issues:** [Count and summary]
- **High-priority recommendations:** [Top 3-5]

#### Repository Context

- **Modules/packages:** [List]
- **Entry points:** [Binary entry, library root, service entry]
- **High-risk areas:** [Modules/files]
- **Tools run:** [List]
- **Tools unavailable:** [List]

#### Review Plan

| Area | Reason | Files/Modules | Status |
|---|---|---|---|

#### Findings

Confirmed findings sorted by severity (Critical first).

#### Suspicious Patterns / Needs Validation

Patterns that need runtime tests, fuzzing, deeper context, or maintainer confirmation.

#### Dependency and Supply Chain Notes

Vuln-scanner results or manual dependency review summary.

#### Unsafe/Native-Interop Code Review

Summary of unsafe/native locations, invariants, and risk assessment.

#### Test and Verification Gaps

Missing tests, fuzz targets, property tests, regression tests, or sanitizer checks.

#### Recommended Next Steps

- **Immediate fixes:** [...]
- **Follow-up review:** [...]
- **Tests to add:** [...]
- **Tooling improvements:** [...]

#### Appendix: Commands

List commands run and key results.

## Sources

Methodology influenced by Trail of Bits-style audit practices (deep unsafe/FFI review, invariant documentation, tool-assisted validation) generalized across languages, plus each language's own community security guidance (e.g. OWASP for web-facing code, language-specific CERT/secure-coding standards for C/C++).
