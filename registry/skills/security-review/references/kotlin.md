# Kotlin Bug-Class Reference

Companion to `SKILL.md`. Use the same finding format, severity guidance, and evidence rules defined there. This file is the Kotlin (JVM and Android) bug-class checklist — lighter than the Rust deep-dive under `references/rust/`, but each entry is specific and actionable. Kotlin inherits the full JVM deserialization/reflection risk surface from Java interop, plus its own null-safety-bypass footguns.

---

## Cluster: Null-Safety Bypass & Java Interop

### `KT-NOTNULLASSERT` — `!!` (not-null assertion) on a value that can genuinely be null
**Description:** The `!!` operator throws `KotlinNullPointerException` if the value is null, converting Kotlin's compile-time null-safety guarantee into a runtime crash. Overused on values from JSON parsing, Java interop, or `Map` lookups where null is a real, reachable case.
**Detection heuristic:** `!!` following a call to a Java-interop API, `JSONObject.get`, `Map.get` (non-`getValue`), or any function whose Kotlin-visible signature involves a platform type.
**Severity:** Medium (crash/DoS on untrusted input), higher on an internet-facing request path with no top-level exception handler.

### `KT-PLATFORMTYPE` — Unchecked platform type from Java interop treated as non-null
**Description:** A value returned from a Java method with no nullability annotation (`@Nullable`/`@NonNull`) is a Kotlin "platform type" (`String!`) — the compiler does not enforce a null check, so if the Java side actually returns null, using it directly (e.g. calling `.length`) throws an NPE at the use site rather than at the boundary.
**Detection heuristic:** Java library calls (especially older, unannotated libraries) whose return value flows directly into Kotlin code with no explicit `?.`/`requireNotNull`/`checkNotNull` at the interop boundary.
**Severity:** Medium.

### `KT-LATEINITUNINIT` — `lateinit var` accessed before initialization
**Description:** A `lateinit` property accessed before its initializer runs (common in Android when a field depends on `onCreate`/DI injection timing) throws `UninitializedPropertyAccessException`.
**Detection heuristic:** `lateinit var` fields read in a lifecycle callback that can run before the expected initialization point (e.g. a property set in `onViewCreated` read from `onCreate`).
**Severity:** Medium (crash).

### `KT-SMARTCASTRACE` — Smart-cast invalidated by concurrent mutation
**Description:** Kotlin's smart-cast (`if (x != null) { x.foo() }`) is only valid if the compiler can prove `x` isn't reassigned between the check and the use; for a `var` accessible from another thread, the value can change between the null-check and the use even though the compiler allowed the smart-cast (or forced a local copy that's now stale).
**Detection heuristic:** Mutable `var` properties (not `val`) smart-cast and then used across a point where another thread could plausibly mutate them (no `synchronized`/`@Volatile`/immutable snapshot).
**Severity:** Medium.

---

## Cluster: JVM Deserialization & Reflection

### `KT-JAVADESERIAL` — Native Java deserialization (`ObjectInputStream`) on untrusted data
**Description:** `ObjectInputStream.readObject()` on attacker-controlled bytes can trigger gadget-chain RCE via classes already on the classpath (Apache Commons Collections and similar are classic gadget sources) — this is a JVM-wide risk, not Kotlin-specific, but Kotlin projects commonly pull in vulnerable Java libraries transitively.
**Detection heuristic:** `ObjectInputStream(` / `readObject()` on a stream sourced from network, file upload, or cache/session storage that isn't fully server-controlled.
**Severity:** Critical.

### `KT-JACKSONPOLYMORPHIC` — Jackson/Gson polymorphic deserialization without a type allowlist
**Description:** `@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS)` (or Gson `RuntimeTypeAdapterFactory` misuse) lets the JSON payload specify the concrete class to instantiate; without a strict allowlist of permitted subtypes, this is the JSON analog of `BinaryFormatter`/pickle deserialization RCE.
**Detection heuristic:** `JsonTypeInfo.Id.CLASS` or `enableDefaultTyping()` on a Jackson `ObjectMapper` that deserializes untrusted request bodies.
**Severity:** Critical.

### `KT-REFLECTIONBYPASS` — Reflection used to bypass Kotlin visibility/immutability guarantees
**Description:** `field.isAccessible = true` followed by reflective mutation of a `private val`/`val` (including data class copy-and-mutate-via-reflection patterns) defeats Kotlin's compile-time immutability and encapsulation guarantees, which security-relevant invariants may rely on.
**Detection heuristic:** `isAccessible = true` combined with `.set(...)` on fields backing security-relevant state (auth tokens, permission flags).
**Severity:** Medium to High depending on what invariant is broken.

---

## Cluster: Concurrency (Coroutines & JVM Threads)

### `KT-GLOBALSCOPELEAK` — `GlobalScope.launch` with no lifecycle tie, leaking coroutines
**Description:** Coroutines launched in `GlobalScope` run for the life of the process/app with no structured-concurrency cancellation; if the enclosing component (Activity, request handler) is destroyed/completes, the coroutine keeps running and can hold references that prevent garbage collection (Android: classic Activity leak).
**Detection heuristic:** `GlobalScope.launch`/`GlobalScope.async` calls, especially inside a class with its own lifecycle (Android `Activity`/`Fragment`, a per-request handler) instead of a scoped `CoroutineScope` tied to that lifecycle.
**Severity:** Medium (resource/memory leak, compounds under load or repeated navigation).

### `KT-DISPATCHERSMAINBLOCKING` — Blocking I/O on `Dispatchers.Main`/the UI thread
**Description:** Network calls, disk I/O, or heavy computation launched with `Dispatchers.Main` (or no explicit dispatcher inside a `suspend fun` that ends up on Main) blocks the UI thread, causing ANRs (Android) or stalling the event loop.
**Detection heuristic:** `withContext(Dispatchers.Main)` wrapping a blocking call, or a `suspend fun` with no explicit `withContext(Dispatchers.IO)` around blocking network/file APIs.
**Severity:** Medium to High (Android: ANR is a hard crash-adjacent failure).

### `KT-EXCEPTIONSWALLOWEDCOROUTINE` — Exception in a coroutine silently swallowed by scope structure
**Description:** An exception thrown inside a `launch` inside a `supervisorScope`/`SupervisorJob` is isolated to that child coroutine and, without an installed `CoroutineExceptionHandler`, can be silently dropped (never logged, never surfacing to the user) — including exceptions from a failed security check.
**Detection heuristic:** `SupervisorJob()`/`supervisorScope` usage with no `CoroutineExceptionHandler` installed on the scope.
**Severity:** Medium (silent failure masking a real error).

### `KT-SHAREDMUTABLESTATE` — Shared mutable state across coroutines without synchronization
**Description:** A `var` captured by multiple coroutines launched on a multi-threaded dispatcher (`Dispatchers.Default`/`IO`) and mutated without a `Mutex`/`AtomicInteger`/confinement to a single coroutine, producing a data race identical in nature to a multi-threaded race in any JVM language.
**Detection heuristic:** Captured `var` mutated inside multiple `launch`/`async` blocks on a non-single-threaded dispatcher, with no `Mutex.withLock`/atomic type.
**Severity:** Medium to High depending on what state is corrupted.

---

## Cluster: Input Validation & Injection

### `KT-SQLI` — SQL injection via string-templated queries
**Description:** Kotlin string templates (`"SELECT * FROM users WHERE id = $id"`) passed directly to a JDBC `Statement`/Exposed/Room raw query instead of a `PreparedStatement`/parameterized query builder.
**Detection heuristic:** `createStatement().executeQuery("...${` or Room `@Query` annotations with string-concatenated dynamic SQL.
**Severity:** Critical.

### `KT-INTENTINJ` (Android) — Implicit `Intent` handling untrusted data without validation
**Description:** An exported `Activity`/`Service`/`BroadcastReceiver` reads extras from an incoming `Intent` and uses them (e.g. as a URL, file path, or class name for reflection) without validating the sender or the data, allowing a malicious app to inject attacker-controlled values.
**Detection heuristic:** `android:exported="true"` components reading `intent.getStringExtra(...)` and using the value in a sensitive sink (file path, WebView URL, `Class.forName`) without validation.
**Severity:** High.

### `KT-WEBVIEWJSINTERFACE` (Android) — `addJavascriptInterface` exposed to untrusted web content
**Description:** Exposing a Kotlin/Java object via `WebView.addJavascriptInterface` to a `WebView` that can load untrusted/attacker-influenced URLs lets that page's JavaScript call into native app code, potentially reaching sensitive APIs.
**Detection heuristic:** `addJavascriptInterface(` combined with a `WebView` that loads non-fixed URLs (from intents, deep links, or user input) without `@JavascriptInterface`-level access restriction and origin checks.
**Severity:** High to Critical.

---

## Cluster: Auth, Secrets & Crypto

### `KT-HARDCODEDSECRET` — Hardcoded API keys/secrets in source or resources
**Description:** Secrets embedded directly in Kotlin source, `strings.xml`, or `BuildConfig` fields — trivially extractable from a compiled APK/JAR via decompilation.
**Detection heuristic:** String literals matching key patterns in source or resource files; `buildConfigField` with a literal secret value.
**Severity:** Critical (Android APKs are easily decompiled, so this is directly exploitable).

### `KT-WEAKRANDOM` — `java.util.Random`/`kotlin.random.Random` used for security-sensitive values
**Description:** `java.util.Random` (and Kotlin's default `Random`) is not cryptographically secure; using it for tokens or session identifiers makes them predictable. Use `java.security.SecureRandom`.
**Detection heuristic:** `Random()`/`Random.nextInt()` (not `SecureRandom`) flowing into a token/secret/session-id variable.
**Severity:** High to Critical.

### `KT-CERTPINNINGDISABLED` — TLS certificate/hostname verification disabled
**Description:** A custom `X509TrustManager`/`HostnameVerifier` that accepts all certificates (common in code copy-pasted to "fix" a dev-cert error) makes the app vulnerable to MITM in production.
**Detection heuristic:** `TrustManager` implementations whose `checkServerTrusted` is a no-op, or `HostnameVerifier { _, _ -> true }`.
**Severity:** Critical for production network code.

---

## Cluster: Resource Safety & Crash-Induced DoS

### `KT-UNCLOSEDRESOURCE` — Resource not closed (missing `use`/try-with-resources equivalent)
**Description:** `Closeable` resources (streams, cursors, JDBC connections) opened without Kotlin's `.use { }` block leak the underlying OS handle if an exception occurs before an explicit `close()`.
**Detection heuristic:** `FileInputStream(`, `Cursor` from a `ContentResolver` query, or JDBC `Connection`/`Statement` opened with no `.use { }` wrapper and no `try/finally`.
**Severity:** Medium.

### `KT-DATACLASSCOPYLEAK` — Sensitive field exposed via auto-generated `toString()`/logging of a `data class`
**Description:** Kotlin `data class` auto-generates `toString()` including every constructor property; a class holding a password, token, or PII field gets that value written to logs/crash reports/UI any time the object is logged or `Timber`/`Log.d`-printed, without explicit intent.
**Detection heuristic:** `data class` with a field named `password`/`token`/`secret`/`ssn` and no custom `toString()` override or `@Transient`/exclusion.
**Severity:** Medium to High depending on what's logged and where logs are stored/shipped.

### `KT-UNBOUNDEDRECURSION` — Recursive parsing/traversal with no depth limit on untrusted input
**Description:** A recursive JSON/tree traversal function with no explicit depth counter can exhaust the JVM stack (`StackOverflowError`) on deeply nested attacker-supplied input.
**Detection heuristic:** Recursive functions traversing parsed structures (JSON, XML, nested DTOs) with no depth parameter or limit check.
**Severity:** Medium.
