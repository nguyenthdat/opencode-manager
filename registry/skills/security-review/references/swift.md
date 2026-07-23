# Swift Bug-Class Reference

Companion to `SKILL.md`. Use the same finding format, severity guidance, and evidence rules defined there. This file is the Swift bug-class checklist — lighter than the Rust deep-dive under `references/rust/`, but each entry is specific and actionable. Swift is memory-safe by default; review focuses on force-unwrap crashes, unsafe pointer misuse at explicit escape hatches, and Objective-C bridging hazards.

---

## Cluster: Force-Unwrap & Optional-Safety Crashes

### `SW-FORCEUNWRAP` — `!` force-unwrap on an Optional that can genuinely be `nil`
**Description:** `value!` traps (crashes the process, unrecoverable) if `value` is `nil` at that point. Common on values from JSON decoding, dictionary lookups, `URL(string:)`, or user input where `nil` is a real, reachable case rather than a truly-impossible invariant.
**Detection heuristic:** `!` immediately after a call to `URL(string:`, a dictionary subscript, `as?` cast, or any decoded/parsed value, with no preceding `guard let`/`if let`/`??` nearby.
**Severity:** Medium (crash/DoS on untrusted input), higher if reachable from network-received data with no top-level crash-recovery (a crash is often a hard stop for that request/session, and repeatable crashes on a server-side Swift service are a DoS vector).

### `SW-IMPLICITLYUNWRAPPEDOPTIONAL` — `!`-typed property (`var x: T!`) accessed before it's set
**Description:** An implicitly-unwrapped-optional property declared to defer initialization (common for `@IBOutlet`s or dependency-injected properties) traps if read before the deferred assignment happens — the same crash risk as `SW-FORCEUNWRAP` but harder to spot because there's no explicit `!` at the use site.
**Detection heuristic:** `var x: T!` properties read in a lifecycle method that can run before the expected assignment point (e.g. read in `viewDidLoad` when actually assigned later in a configure/inject call).
**Severity:** Medium.

### `SW-TRYFORCE` — `try!` swallowing a real, reachable error into a crash
**Description:** `try!` converts any thrown error into a runtime trap rather than propagating it; used on operations that can fail based on untrusted input (JSON decoding, file I/O, regex compilation from a dynamic pattern) it turns an ordinary error condition into a crash.
**Detection heuristic:** `try!` on `JSONDecoder().decode`, file/network I/O, or any throwing call whose failure mode is data-dependent rather than a true programmer-error invariant.
**Severity:** Medium to High depending on reachability from untrusted input.

### `SW-ARRAYINDEXOOB` — Array/collection subscript access without bounds checking
**Description:** `array[index]` traps on an out-of-range index (Swift arrays are bounds-checked, but checked *at runtime via a trap*, not gracefully — this is a crash, not silent corruption, but still a DoS if `index` is attacker-influenced and unvalidated).
**Detection heuristic:** Subscript access with an index derived from untrusted input (parsed data, user-controlled count) with no `indices.contains(index)`/`array.count` check beforehand.
**Severity:** Medium.

---

## Cluster: Unsafe Pointers & Native Interop

### `SW-UNSAFEPOINTERLIFETIME` — `UnsafePointer`/`UnsafeMutablePointer` used past its guaranteed valid lifetime
**Description:** Pointers obtained from `withUnsafeBytes`/`withUnsafeMutableBytes`/`Array.withUnsafeBufferPointer` are only valid for the duration of that closure — Swift does not guarantee (and in practice will not preserve) the pointer's validity if it escapes the closure via capture into a stored property or a background queue.
**Detection heuristic:** An `Unsafe(Mutable)?(Raw)?(Buffer)?Pointer` captured into a variable/property/closure that outlives the `withUnsafe...` block that produced it, or passed to an async/dispatched callback.
**Severity:** High to Critical (use-after-free-equivalent memory corruption once the underlying storage moves or is released).

### `SW-BUFFERPOINTERBOUNDS` — Manual pointer arithmetic on an `UnsafeBufferPointer` without bounds validation
**Description:** Indexing/advancing a raw pointer by an attacker-influenced offset/count without checking it against the buffer's actual `count`/`byteCount` reads or writes out of bounds — the exact same hazard class as a C buffer overflow, since this is Swift's explicit escape hatch into unchecked memory access.
**Detection heuristic:** `.baseAddress?.advanced(by:` or manual index arithmetic on an `UnsafeBufferPointer`/`UnsafeRawBufferPointer` where the offset/count derives from parsed/untrusted data with no bounds check against `.count`.
**Severity:** Critical.

### `SW-BITCASTMISUSE` — `unsafeBitCast`/`withMemoryRebound` between layout-incompatible types
**Description:** `unsafeBitCast(x, to: T.self)` reinterprets the bit pattern of `x` as type `T` with zero validation; if the two types differ in size or layout, this is undefined behavior — Swift's equivalent of Rust's `mem::transmute` misuse or a C `reinterpret_cast` between incompatible types.
**Detection heuristic:** `unsafeBitCast(`/`withMemoryRebound(to:` where the source and destination types are not confirmed to have identical size and layout (e.g. via `MemoryLayout<T>.size` equality).
**Severity:** High to Critical.

### `SW-CBRIDGINGOWNERSHIP` — Incorrect ownership transfer across a C/Swift bridging boundary
**Description:** Passing a Swift-managed pointer to a C API that takes ownership (frees it later), or vice versa — accepting a C-allocated pointer into Swift and letting ARC/Swift's deallocation also try to free it — causes a double-free or use-after-free at the boundary, same fundamental hazard as Rust's `foreign-drop`/C#'s P/Invoke marshaling issues.
**Detection heuristic:** `withUnsafePointer`/C function imports (`@_silgen_name`, generated Objective-C/C headers) where the ownership contract (who calls `free`) isn't explicit and matching on both sides.
**Severity:** High to Critical.

---

## Cluster: Objective-C Bridging & Dynamic Typing

### `SW-OBJCANYCAST` — Force-cast (`as!`) on a bridged `Any`/`AnyObject` from Objective-C
**Description:** Objective-C APIs surface as `Any`/`AnyObject` in Swift with no compile-time type guarantee; force-casting the result (`obj as! ExpectedType`) traps if the actual runtime type differs — common when the underlying value came from an untyped Objective-C collection (`NSArray`, `NSDictionary`, a KVO callback) whose contents aren't guaranteed by the type system.
**Detection heuristic:** `as!` on a value whose static type is `Any`/`AnyObject`/`NSObject`, especially from `NSDictionary`/`NSArray`/`UserDefaults`/plist decoding, with no `as?` fallback.
**Severity:** Medium (crash), higher on a security-decision path.

### `SW-KVOOBJCSELECTOR` — `@objc` dynamic dispatch / selector-based calls bypassing Swift's type/access checks
**Description:** `perform(Selector(...))`/`NSSelectorFromString(userControlledString)` invokes a method by name looked up at runtime, bypassing Swift's compile-time visibility and argument-type checking entirely; if the selector name is influenced by untrusted input, this is effectively a dynamic-dispatch injection primitive.
**Detection heuristic:** `NSSelectorFromString(` / `perform(Selector(` where the string argument is built from or equals untrusted input (deep link parameters, server-provided config).
**Severity:** High to Critical if the selector string is attacker-influenced.

### `SW-CODABLELENIENTDECODE` — `Decodable` conformance silently accepting or defaulting malformed/missing security-relevant fields
**Description:** A custom `init(from decoder:)` that uses `decodeIfPresent` with a default value for a security-relevant field (e.g. a `role`/`isAdmin`/`permissions` field defaulting to a permissive value when absent from the JSON) means a request that simply omits the field gets the default rather than being rejected.
**Detection heuristic:** `decodeIfPresent(..., forKey:) ?? <permissive default>` on fields that gate authorization/trust decisions.
**Severity:** High.

---

## Cluster: Concurrency (GCD, Structured Concurrency, Actors)

### `SW-DATARACEOUTSIDEACTOR` — Mutable shared state accessed from multiple `DispatchQueue`s/threads without isolation
**Description:** A class with mutable stored properties accessed both from a background `DispatchQueue` and the main thread (or two background queues) with no `actor` isolation, lock, or serial-queue confinement is a classic data race — Swift's compiler cannot catch this outside of Swift Concurrency's actor isolation checks (and even those can be bypassed via `@unchecked Sendable`).
**Detection heuristic:** Mutable class properties mutated from closures dispatched to `DispatchQueue.global()`/a concurrent queue from more than one call site, with no `actor`, `NSLock`, or serial-queue confinement; any `@unchecked Sendable` conformance deserves a manual audit of why the compiler's safety check was bypassed.
**Severity:** High.

### `SW-ACTORREENTRANCYSTALE` — Actor method reads stale state across an `await` due to reentrancy
**Description:** Swift actors are reentrant: if an `actor` method does work, then `await`s something, another call into the same actor can run and mutate state in between — code that assumes its own state is unchanged across an `await` (a "check-then-act" pattern spanning a suspension point) can act on stale data.
**Detection heuristic:** An `actor` method that reads a property, `await`s a call, then uses the earlier-read value afterward instead of re-reading it — the classic TOCTOU-within-an-actor pattern.
**Severity:** Medium to High depending on what invariant the stale read violates.

### `SW-MAINACTORVIOLATION` — UI/state update crossing off the `@MainActor` without hopping back
**Description:** Code in a background `Task`/`DispatchQueue` callback updates `@MainActor`-isolated UI state directly (bypassing the isolation via `@unchecked Sendable` closures or old-style completion handlers not yet migrated to structured concurrency), risking UI corruption or a runtime crash on debug builds with actor-isolation checking enabled.
**Detection heuristic:** UI property mutations inside a `DispatchQueue.global()`/detached `Task` closure with no `await MainActor.run { }` / `Task { @MainActor in }` wrapper.
**Severity:** Medium.

---

## Cluster: Auth, Secrets & Crypto

### `SW-KEYCHAINMISCONFIG` — Sensitive data stored in `UserDefaults`/plist instead of Keychain
**Description:** Tokens, passwords, or session credentials stored via `UserDefaults` (backed by an unencrypted plist on disk) rather than the Keychain are readable by anyone with filesystem access to the device/backup (jailbreak, unencrypted backup extraction).
**Detection heuristic:** `UserDefaults.standard.set(` with a value/key name suggesting a token/password/secret.
**Severity:** High.

### `SW-WEAKRANDOM` — `arc4random_uniform`/`Int.random` misuse or a non-cryptographic RNG for a security token
**Description:** While `arc4random`/`SystemRandomNumberGenerator` (backing `Int.random(in:)`) are actually CSPRNGs on Apple platforms, hand-rolled or third-party non-cryptographic generators (a custom LCG, or a fixed-seed `SplitMix`-style PRNG for "reproducibility") used for tokens/keys are not. Confirm the actual generator, don't assume by API name alone.
**Detection heuristic:** Any custom RNG implementation (not `SystemRandomNumberGenerator`/`arc4random`/`SecRandomCopyBytes`) feeding a token, nonce, or key.
**Severity:** High to Critical if confirmed non-cryptographic.

### `SW-CERTPINNINGDISABLED` — TLS trust evaluation bypassed in `URLSession` delegate
**Description:** A `URLSessionDelegate` implementing `urlSession(_:didReceive:completionHandler:)` that calls the completion handler with `.useCredential`/`.performDefaultHandling` unconditionally (or constructs a credential from the server's own untrusted certificate) disables certificate validation, exposing the app to MITM.
**Detection heuristic:** Challenge-handling delegate methods that don't validate `challenge.protectionSpace.serverTrust` against a pinned certificate/public key before accepting, especially any that unconditionally call the completion handler with success.
**Severity:** Critical for production network code.

---

## Cluster: Resource Safety

### `SW-RETAINCYCLE` — Strong reference cycle via closures capturing `self`
**Description:** A closure stored as a property (or handed to a long-lived API like a timer, notification observer, or delegate callback) that captures `self` strongly, while `self` also (transitively) holds a strong reference back to that closure, creates a retain cycle — neither is ever deallocated, leaking memory for the app's lifetime.
**Detection heuristic:** Closures stored in properties or passed to `Timer.scheduledTimer`/`NotificationCenter.addObserver`/completion handlers that reference `self.` without `[weak self]`/`[unowned self]` in the capture list.
**Severity:** Medium (memory leak, compounds under repeated navigation/screen pushes).

### `SW-UNCLOSEDOBSERVER` — `NotificationCenter`/KVO observer never removed
**Description:** Registering an observer (`addObserver`, KVO `observe(_:options:changeHandler:)`) without holding/invalidating the returned token, or without removing it in `deinit`, keeps the observed object referencing the (possibly deallocated on older APIs) observer, causing crashes or leaked callbacks.
**Detection heuristic:** `addObserver(` calls with no corresponding `removeObserver`/token invalidation in `deinit`, particularly on pre-block-based KVO APIs where a deallocated observer causes a crash on the next notification.
**Severity:** Medium.
