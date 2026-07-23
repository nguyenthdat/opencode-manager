# Go Bug-Class Reference

Companion to `SKILL.md`. Use the same finding format, severity guidance, and evidence rules defined there. This file is the Go bug-class checklist — lighter than the Rust deep-dive under `references/rust/`, but each entry is specific and actionable.

---

## Cluster: Concurrency & Goroutine Safety

### `GO-GOROUTINELEAK` — Goroutine leak from an unreceived channel or missing cancellation
**Description:** A goroutine blocks forever sending on a channel nobody ever reads from again (e.g. the receiver returned early on an error path), or a goroutine loops on a `context.Context` that is never cancelled. Each leaked goroutine holds its stack and captured variables for the life of the process.
**Detection heuristic:** `go func()` bodies with a channel send/receive with no corresponding `select` on `ctx.Done()`; functions that spawn a goroutine and return without a way to signal it to stop.
**Severity:** Medium, escalating to High under sustained request volume (memory-exhaustion DoS).

### `GO-UNBUFFEREDDEADLOCK` — Deadlock from unbuffered channel send/receive ordering
**Description:** A send on an unbuffered channel blocks until a receiver is ready; if the intended receiver goroutine already exited (e.g. due to an earlier error) or the send/receive order is wrong, the sender blocks forever.
**Detection heuristic:** `ch <- x` / `<-ch` on `make(chan T)` (no buffer size) with no `select`/timeout guard, especially in error-handling paths where the receiving goroutine may have already returned.
**Severity:** High — full request/worker hang.

### `GO-DATARACE` — Unsynchronized shared-state access across goroutines
**Description:** A struct field or map is read/written from multiple goroutines without a mutex or channel handoff, producing a data race (undefined ordering, possible torn reads on multi-word values, and in Go specifically maps are not safe for concurrent read+write and will panic or corrupt).
**Detection heuristic:** Shared package-level or captured variables mutated inside `go func()` without `sync.Mutex`/`sync.RWMutex`/`atomic`. Confirm by running `go test -race ./...` or `go run -race`.
**Severity:** High — undefined behavior, or an immediate `fatal error: concurrent map writes` panic (also DoS).

### `GO-WAITGROUPMISUSE` — `sync.WaitGroup.Add` called from the wrong goroutine, or `Add` after `Wait`
**Description:** Calling `wg.Add(1)` inside the spawned goroutine (rather than before `go func()`) creates a race where `Wait()` may return before `Add` executes; calling `Add` after `Wait()` has already returned panics or under-counts.
**Detection heuristic:** `wg.Add(` appearing textually inside the `go func(){ ... }()` body rather than immediately before the `go` statement.
**Severity:** Medium to High (missed synchronization, or panic).

### `GO-CONTEXTLEAK` — `context.WithCancel`/`WithTimeout` created without calling `cancel()`
**Description:** Every `context.WithCancel`/`WithTimeout`/`WithDeadline` returns a `cancel` function that must be called (typically via `defer cancel()`) to release the timer/goroutine associated with the context, even if the context expires naturally.
**Detection heuristic:** `context\.With(Cancel|Timeout|Deadline)\(` with no adjacent `defer cancel()` (or equivalent explicit call) in the same function.
**Severity:** Low to Medium (resource leak, compounds under load).

---

## Cluster: Input Validation & Injection

### `GO-SQLI` — SQL injection via `fmt.Sprintf`-built queries
**Description:** Building a query string with `fmt.Sprintf`/string concatenation and passing it to `db.Query`/`db.Exec` instead of using `?`/`$1` placeholders with argument parameters.
**Detection heuristic:** `db\.(Query|Exec|QueryRow)\(fmt\.Sprintf\(|db\.(Query|Exec)\(.*\+.*\)`. Confirm the interpolated value flows from request input.
**Severity:** Critical.

### `GO-CMDINJ` — Command injection via `os/exec` with shell interpretation
**Description:** Passing a user-controlled string to `exec.Command("sh", "-c", userInput)` (or building the argv slice by splitting an untrusted string on spaces, allowing argument injection) executes attacker-controlled commands/flags.
**Detection heuristic:** `exec\.Command\(\s*"sh"|exec\.Command\(\s*"/bin/`, or `exec.Command` with an argument slice built via `strings.Split` on untrusted input.
**Severity:** Critical.

### `GO-SSRF` — Server-side request forgery via `net/http` client
**Description:** `http.Get(userSuppliedURL)` or building a request from a user-controlled host without an allowlist, letting an attacker reach internal services or cloud metadata endpoints.
**Detection heuristic:** `http\.(Get|Post|NewRequest)\(` where the URL is built from request parameters, with no host/scheme allowlist and no `net.Dial` hook blocking private IP ranges.
**Severity:** High to Critical.

### `GO-PATHTRAVERSAL` — Path traversal via `filepath.Join` with unsanitized input
**Description:** `filepath.Join(baseDir, userInput)` does not prevent `../` from escaping `baseDir` — `Join` cleans the path but does not enforce containment.
**Detection heuristic:** `filepath\.Join\(.*r\.URL|filepath\.Join\(.*request\.` with no subsequent check that the resolved path (`filepath.Clean`+`strings.HasPrefix` or `filepath.Rel` non-`..`-prefixed check) stays under `baseDir`.
**Severity:** High.

### `GO-XMLENTITY` — XXE via `encoding/xml` combined with a vulnerable decoder configuration
**Description:** Go's stdlib `encoding/xml` does not resolve external entities by default (safer than many languages), but wrapping libraries or manual DTD processing (e.g. custom entity expansion, or shelling out to `libxml2` via cgo) can reintroduce XXE. Confirm any non-stdlib XML parsing path.
**Detection heuristic:** Non-stdlib XML libraries, or cgo bindings to C XML parsers, applied to untrusted XML.
**Severity:** Medium to High depending on the parser used.

---

## Cluster: Error Handling & Panic-Induced DoS

### `GO-ERRORIGNORED` — Discarded error return value
**Description:** Go's multi-return error convention is opt-in — `result, _ := riskyCall()` or simply not checking the second return value silently drops failure information, which can hide a failed security check (e.g. a failed signature verification treated as success because the zero-value result looked valid).
**Detection heuristic:** `_ = ` or bare discard of an `error`-typed return value, especially from crypto/auth/parsing calls; `go vet`/`errcheck` findings.
**Severity:** Medium, higher when the discarded error is from an auth/crypto operation.

### `GO-NILPANIC` — Nil pointer/map/interface dereference reachable from untrusted input
**Description:** Dereferencing a pointer or calling a method on an interface value that can be `nil` because an earlier lookup/parse failed and the code didn't check for it, causing a panic (process crash without a `recover`).
**Detection heuristic:** A map lookup (`v, ok := m[key]`) where `ok` is ignored and `v` is used as a pointer; JSON-unmarshaled struct pointer fields dereferenced without a nil check.
**Severity:** Medium to High if reachable per-request with no `recover()` middleware (full process crash = DoS).

### `GO-MISSINGRECOVER` — No `recover()` in goroutines spawned per-request
**Description:** An HTTP framework's top-level `recover()` middleware only protects the goroutine it runs in; a panic inside a separately spawned `go func()` (e.g. for async processing) is not caught by that middleware and crashes the entire process.
**Detection heuristic:** `go func()` bodies handling per-request work with no `defer func() { recover() }()` inside that specific goroutine.
**Severity:** High — single malformed request can take down the whole service.

### `GO-INTEGEROVERFLOW` — Unchecked integer overflow in size/length arithmetic
**Description:** Adding/multiplying attacker-influenced lengths (e.g. computing a buffer size from two untrusted length fields) can wrap around on overflow, leading to an undersized allocation followed by an out-of-bounds write, or an infinite/huge loop bound.
**Detection heuristic:** Arithmetic on `int`/`uint` values derived from parsed/untrusted length fields flowing into `make([]byte, n)` or a loop bound, with no overflow check.
**Severity:** Medium to High.

---

## Cluster: Resource Safety

### `GO-UNBOUNDEDCHANNELGROWTH` — Unbounded buffered channel or slice growth from untrusted input
**Description:** A channel/slice/map that grows per incoming message with no cap and no backpressure mechanism lets an attacker who can generate many messages exhaust memory.
**Detection heuristic:** `make(chan T, n)` with a very large or attacker-influenced `n`, or unbounded `append` in a loop driven by network input with no size limit.
**Severity:** Medium to High.

### `GO-UNBOUNDEDREADALL` — `io.ReadAll`/`ioutil.ReadAll` on an untrusted body with no size limit
**Description:** Reading an entire request/response body into memory with no cap allows memory-exhaustion DoS from a large or slow-drip payload.
**Detection heuristic:** `io\.ReadAll\(r\.Body\)`/`ioutil\.ReadAll\(` with no prior `http.MaxBytesReader` wrapping.
**Severity:** Medium.

### `GO-DEFERINLOOP` — `defer` inside a long-running loop accumulating resources
**Description:** `defer file.Close()` inside a `for` loop that processes many items doesn't run until the *enclosing function* returns, not each loop iteration — holding every file descriptor/connection open until the function exits, which can exhaust FDs on large inputs.
**Detection heuristic:** `defer` statements textually inside a `for`/`range` loop body that opens a resource per iteration.
**Severity:** Medium.

---

## Cluster: Auth, Secrets & Trust Boundaries

### `GO-WEAKRANDOM` — `math/rand` used for security-sensitive values
**Description:** `math/rand` is a deterministic PRNG (predictable from its seed); using it for tokens, session IDs, or password-reset codes makes them guessable. Use `crypto/rand` instead.
**Detection heuristic:** `math/rand"` import combined with output flowing into a token/secret/session-id variable.
**Severity:** High to Critical.

### `GO-TLSINSECURE` — TLS certificate verification disabled
**Description:** `tls.Config{InsecureSkipVerify: true}` disables certificate validation, making the connection vulnerable to MITM. Often left in from debugging.
**Detection heuristic:** `InsecureSkipVerify:\s*true` in production code paths (as opposed to test helpers).
**Severity:** Critical for production network code.

### `GO-HARDCODEDSECRET` — Hardcoded credentials or API keys in source
**Description:** Secrets committed directly in `.go` files or config checked into VCS rather than loaded from environment/secret manager.
**Detection heuristic:** String literals matching key-like patterns, or `const apiKey = "..."` with a non-placeholder value.
**Severity:** Critical.

---

## Cluster: Supply Chain

### `GO-MODUNPINNED` — `go.sum` missing or module proxy/checksum verification disabled
**Description:** `GONOSUMCHECK`/`GOFLAGS=-insecure` or a missing `go.sum` disables Go's built-in module checksum verification, allowing a compromised module proxy or MITM to substitute malicious module code silently.
**Detection heuristic:** Missing `go.sum` in the repo, or `GONOSUMCHECK=1`/`GOFLAGS` disabling verification in CI config.
**Severity:** High.

### `GO-BUILDTAGINJECT` — Build tags or `//go:generate`/cgo directives execute untrusted code at build time
**Description:** A build script or generator invoked via `go generate` that shells out based on repo content (rather than fixed, trusted commands) can be hijacked by a malicious PR to run arbitrary code during CI build.
**Detection heuristic:** `//go:generate` directives that call a script whose behavior depends on file contents from an untrusted contributor.
**Severity:** Medium to High (supply-chain/CI compromise).

---

## Cluster: Logic Correctness

### `GO-SLICEALIASING` — Unintended slice aliasing/mutation via shared backing array
**Description:** Slicing an existing slice (`s[a:b]`) shares the same backing array; mutating the sub-slice mutates the original, and `append` on a sub-slice can silently overwrite adjacent data in the original if capacity allows — a frequent source of subtle data corruption.
**Detection heuristic:** `append(subSlice, ...)` where `subSlice` was derived via a slice expression from a larger slice that's still in use, with no explicit copy (`copy(dst, src)`).
**Severity:** Medium (correctness), higher if it corrupts security-relevant data.

### `GO-LOOPVARCAPTURE` — Loop variable captured by reference in a closure/goroutine (pre-Go 1.22)
**Description:** Prior to Go 1.22, `for _, v := range items { go func() { use(v) }() }` captures the *same* loop variable across iterations, so goroutines may all observe the final value of `v` rather than the value at their own iteration.
**Detection heuristic:** `go func()` or deferred closures referencing a `for`/`range` loop variable directly (not passed as a parameter), combined with a `go.mod` declaring a Go version below 1.22.
**Severity:** Medium (logic bug producing wrong per-item behavior).
