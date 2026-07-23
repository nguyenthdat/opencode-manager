# C# / .NET Bug-Class Reference

Companion to `SKILL.md`. Use the same finding format, severity guidance, and evidence rules defined there. This file is the C#/.NET bug-class checklist — lighter than the Rust deep-dive under `references/rust/`, but each entry is specific and actionable.

---

## Cluster: Deserialization & Injection

### `CS-BINARYFORMATTER` — Insecure deserialization via `BinaryFormatter`/`SoapFormatter`/`NetDataContractSerializer`
**Description:** `BinaryFormatter.Deserialize` (and its siblings) can instantiate arbitrary types from the serialized stream and invoke their constructors/property setters, enabling gadget-chain RCE on untrusted input. Microsoft has deprecated `BinaryFormatter` for this exact reason (removed by default in modern .NET).
**Detection heuristic:** `BinaryFormatter\(\)|SoapFormatter\(\)|NetDataContractSerializer\(` followed by `.Deserialize(` on a stream sourced from network/file/user input.
**Severity:** Critical.

### `CS-JSONTYPENAMEHANDLING` — `Json.NET` `TypeNameHandling` not `None` on untrusted input
**Description:** `JsonConvert.DeserializeObject` with `TypeNameHandling.Auto/All/Objects` embeds and trusts a `$type` field in the JSON to pick the concrete type to instantiate, enabling the same gadget-chain RCE class as `BinaryFormatter` when the JSON source is untrusted.
**Detection heuristic:** `TypeNameHandling\.(All|Auto|Objects)` in `JsonSerializerSettings` used to deserialize request bodies or external data.
**Severity:** Critical.

### `CS-SQLI` — SQL injection via string-concatenated queries
**Description:** Building SQL with string concatenation/interpolation (`$"SELECT ... WHERE id = {id}"`) instead of parameterized `SqlCommand` parameters or a parameterized ORM query, including EF Core's `FromSqlRaw`/`ExecuteSqlRaw` with interpolated strings (as opposed to `FromSqlInterpolated`, which parameterizes automatically).
**Detection heuristic:** `SqlCommand\(.*\+|SqlCommand\(\$"|FromSqlRaw\(\$"|ExecuteSqlRaw\(\$"`. Confirm the interpolated value flows from request input.
**Severity:** Critical.

### `CS-XXE` — XXE via `XmlDocument`/`XmlReader` with external entities enabled
**Description:** Older .NET Framework defaults (`XmlDocument` pre-4.5.2, or explicit `XmlResolver` set to a non-null resolver) resolve external entities, enabling local file read or SSRF via a crafted `<!DOCTYPE>`.
**Detection heuristic:** `new XmlDocument()` with `XmlResolver` explicitly set, or a target framework predating the safe-by-default change, applied to untrusted XML.
**Severity:** High.

### `CS-CMDINJ` — Command injection via `Process.Start` with shell interpretation
**Description:** `Process.Start(new ProcessStartInfo { FileName = "cmd.exe", Arguments = $"/c {userInput}" })` or `UseShellExecute = true` with untrusted arguments allows shell metacharacter injection.
**Detection heuristic:** `ProcessStartInfo` with `FileName` set to a shell (`cmd.exe`, `/bin/sh`) and `Arguments` built via string interpolation from request input.
**Severity:** Critical.

### `CS-LDAPINJ` — LDAP injection via unsanitized filter strings
**Description:** Building an LDAP search filter via string concatenation with user input allows filter-syntax injection (`*)(uid=*))(|(uid=*`), bypassing intended search constraints.
**Detection heuristic:** `DirectorySearcher` / `DirectoryEntry` filter strings built via `+`/`$"..."` from request input with no escaping of `()`, `*`, `\`, NUL.
**Severity:** High.

---

## Cluster: Memory & Unsafe/Native Interop

### `CS-UNSAFEBLOCK` — `unsafe` block with pointer arithmetic on unvalidated lengths
**Description:** `unsafe` code doing pointer arithmetic (`fixed`, `Span<T>` bypassed via raw pointers) based on an attacker-controlled length/offset without bounds checking can read/write outside the buffer.
**Detection heuristic:** `unsafe` blocks with `*(ptr + offset)` where `offset` traces to parsed/untrusted input, with no prior bounds check.
**Severity:** High to Critical (memory corruption).

### `CS-PINVOKEMARSHAL` — Incorrect P/Invoke marshaling of buffers or strings
**Description:** A `[DllImport]` signature that mismatches the native function's actual calling convention, buffer size, or ownership contract (e.g. declaring a fixed-size buffer smaller than what the native side can write, or freeing memory the native side owns) causes memory corruption or double-free across the managed/native boundary.
**Detection heuristic:** `[DllImport]` declarations where the C# parameter types (size, `StringBuilder` capacity, `[MarshalAs]` attributes) don't match the native header; missing `SetLastError = true` where the native API sets errno-equivalent state that's then ignored.
**Severity:** High — treat like an FFI review (see `references/rust/prompts/clusters/ffi-cross-language.md` for the general methodology, adapted to P/Invoke).

### `CS-GCHANDLELEAK` — `GCHandle.Alloc` without matching `Free`, or a pinned handle held too long
**Description:** `GCHandle.Alloc(obj, GCHandleType.Pinned)` prevents the GC from moving/collecting the object until `.Free()` is called; a missing `Free()` (e.g. on an exception path) leaks memory and can fragment the pinned heap under load.
**Detection heuristic:** `GCHandle.Alloc(` with no `try/finally` ensuring `.Free()` runs on all paths.
**Severity:** Medium.

---

## Cluster: Auth, Secrets & Trust Boundaries

### `CS-HARDCODEDSECRET` — Hardcoded credentials/connection strings in source or config
**Description:** Secrets committed directly in `appsettings.json`/source rather than loaded from `IConfiguration`-backed secret stores (Azure Key Vault, User Secrets, environment variables).
**Detection heuristic:** Connection strings or API keys as literal values in tracked `appsettings.json`/`.cs` files (not `appsettings.Development.json` which is gitignored by convention, and even that should be checked).
**Severity:** Critical.

### `CS-WEAKRANDOM` — `System.Random` used for security-sensitive values
**Description:** `System.Random` is a deterministic PRNG seeded from the clock by default; using it for tokens, password-reset codes, or session identifiers makes them predictable. Use `RandomNumberGenerator`/`Rfc2898DeriveBytes` (crypto namespace) instead.
**Detection heuristic:** `new Random()` flowing into a token/secret/session-id variable.
**Severity:** High to Critical.

### `CS-JWTVALIDATIONWEAK` — JWT validation missing algorithm/issuer/audience pinning
**Description:** `TokenValidationParameters` with `ValidateIssuer = false`/`ValidateAudience = false`, or no `ValidAlgorithms` restriction, allowing algorithm-confusion or cross-service token replay attacks.
**Detection heuristic:** `TokenValidationParameters` construction with validation flags explicitly disabled, or missing `ValidAlgorithms`/`IssuerSigningKey` pinning.
**Severity:** Critical.

### `CS-CORSWILDCARD` — Overly permissive CORS with credentials
**Description:** `.AllowAnyOrigin().AllowCredentials()` — actually rejected at runtime by ASP.NET Core (throws), but `.SetIsOriginAllowed(_ => true).AllowCredentials()` achieves the same unsafe effect by reflecting any origin, defeating the browser's same-origin protections for authenticated requests.
**Detection heuristic:** `SetIsOriginAllowed(_ => true)` or a custom origin predicate that always returns true, combined with `AllowCredentials()`.
**Severity:** High.

---

## Cluster: Concurrency & Async

### `CS-ASYNCVOID` — `async void` methods outside event handlers
**Description:** `async void` methods can't be awaited by callers and any exception thrown inside them crashes the process (on .NET Core, an unhandled exception in an `async void` method terminates the app) instead of propagating to a caller's `try/catch`.
**Detection heuristic:** `async void` method signatures that are not UI event handlers (`_Click`, `_Loaded`).
**Severity:** Medium to High (crash/DoS potential).

### `CS-DEADLOCKSYNCOVERASYNC` — Blocking on async code with `.Result`/`.Wait()` causing deadlock
**Description:** Calling `.Result` or `.Wait()` on a `Task` from a context with a captured `SynchronizationContext` (classic ASP.NET, WPF/WinForms UI thread) can deadlock because the continuation needs that same context to resume, which is blocked waiting.
**Detection heuristic:** `.Result`/`.Wait()` on a `Task` returned by an `async` method, inside code that runs in a UI or ASP.NET (non-Core) request context, with no `ConfigureAwait(false)` upstream.
**Severity:** High (full request/UI hang).

### `CS-SHAREDSTATERACE` — Static/shared mutable state accessed without synchronization in a multi-request web app
**Description:** A `static` field or singleton-scoped service holds mutable state (cache, counter, in-progress flag) mutated per-request without a lock, causing data races under concurrent request handling.
**Detection heuristic:** `static` mutable fields (not `readonly`, not thread-safe collection types) mutated inside controller actions or singleton-lifetime services with no `lock`/`Interlocked`/concurrent collection.
**Severity:** Medium to High depending on what state is corrupted.

---

## Cluster: Resource Safety & Crash-Induced DoS

### `CS-DISPOSABLELEAK` — `IDisposable` not disposed (missing `using`)
**Description:** Objects implementing `IDisposable` (DB connections, file streams, `HttpClient` misuse patterns) created without a `using` statement/declaration leak the underlying OS handle until GC finalization, which for scarce resources (connections, file handles) can exhaust the pool under load.
**Detection heuristic:** `new SqlConnection(`, `new FileStream(`, `new StreamReader(` etc. with no enclosing `using` and no `try/finally` calling `.Dispose()`.
**Severity:** Medium.

### `CS-HTTPCLIENTPERREQUEST` — New `HttpClient` instantiated per request instead of reused/pooled
**Description:** `HttpClient` is intended to be reused (it pools underlying sockets); creating a new instance per request can exhaust available sockets under load (`SocketException: address already in use` / port exhaustion) even though each instance is individually disposed correctly.
**Detection heuristic:** `new HttpClient()` inside a request-handling method rather than injected via `IHttpClientFactory` or held as a static/singleton.
**Severity:** Medium (DoS under sustained load).

### `CS-UNBOUNDEDREQUESTBODY` — No request body/upload size limit configured
**Description:** ASP.NET Core with no `[RequestSizeLimit]`/`Kestrel MaxRequestBodySize` configured (or explicitly disabled) allows a large payload to exhaust memory/disk.
**Detection heuristic:** Missing `RequestSizeLimit`/`IISServerOptions.MaxRequestBodySize`/`KestrelServerOptions.Limits.MaxRequestBodySize` configuration, or an explicit override to `null`/very large.
**Severity:** Medium.

---

## Cluster: Supply Chain

### `CS-PACKAGEVULN` — Vulnerable/outdated NuGet package
**Description:** Transitive or direct NuGet dependencies with known CVEs (check via `dotnet list package --vulnerable`), especially in serialization/crypto/parsing libraries.
**Detection heuristic:** `dotnet list package --vulnerable --include-transitive` output; absence of `<PackageReference>` version pinning (floating `*` versions).
**Severity:** Varies with the underlying CVE — treat per-advisory.

### `CS-NUGETCONFUSION` — Internal package name resolvable from a public feed
**Description:** An internal package name without a scoped/private feed configured in `nuget.config` can be shadowed by a same-named malicious public package (dependency confusion).
**Detection heuristic:** Internal-looking `<PackageReference>` names with no corresponding `<packageSourceMapping>` in `nuget.config` restricting them to the private feed.
**Severity:** High.

---

## Cluster: Logic Correctness

### `CS-NULLFORGIVING` — Null-forgiving operator (`!`) suppressing a real nullability risk
**Description:** `value!.SomeMethod()` silences the nullable-reference-type warning without adding a runtime check, so if the assumption is wrong the code throws `NullReferenceException` at runtime instead of being caught at compile time — the exact hazard nullable reference types were meant to prevent.
**Detection heuristic:** `!` null-forgiving operator on values sourced from deserialization, `TryGetValue`-style patterns, or external API results, with no adjacent null check.
**Severity:** Low to Medium (crash/DoS on unexpected null), higher if it's on a security-decision path.

### `CS-EQUALITYOVERRIDE` — `Equals`/`GetHashCode` inconsistency
**Description:** Overriding `Equals` without a matching `GetHashCode` override (or vice versa) breaks hash-based collection invariants (`Dictionary`, `HashSet`), causing lookups to silently fail or duplicate entries to appear equal-but-distinct.
**Detection heuristic:** A class/struct overriding one of `Equals`/`GetHashCode` but not the other.
**Severity:** Medium (correctness), higher if used as a cache/authorization key.

### `CS-STRINGCOMPARISONCULTURE` — Culture-sensitive string comparison on security-relevant identifiers
**Description:** Default `string.Equals`/`==`/`ToLower()` uses the current culture, which can produce unexpected equalities (the classic Turkish-`I` problem) for usernames, tokens, or file extensions used in security checks.
**Detection heuristic:** `.ToLower()`/`.ToUpper()` (no `Invariant` variant) or `string.Compare` without `StringComparison.Ordinal`/`OrdinalIgnoreCase` on identifiers, tokens, or path/extension checks.
**Severity:** Medium.
