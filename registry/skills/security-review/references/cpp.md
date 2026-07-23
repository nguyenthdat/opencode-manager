# C++ Bug-Class Reference

Companion to `SKILL.md`. Use the same finding format, severity guidance, and evidence rules defined there. This file is the C++ bug-class checklist — lighter than the Rust deep-dive under `references/rust/`, but each entry is specific and actionable. C++ inherits every C memory-safety hazard in `references/c.md` (buffer overflow, UAF, double-free, format string, integer overflow — review both files for C++ codebases with a C-interop or legacy C-style layer) plus its own object-lifetime, RAII, and template hazards.

---

## Cluster: Object Lifetime & Memory Safety

### `CPP-UAFRAII` — Use-after-free via a raw pointer/reference outliving its RAII owner
**Description:** A raw pointer or reference is extracted from a `unique_ptr`/`shared_ptr`/container (`.get()`, `&vec[i]`, `.data()`) and used after the owning object is destroyed or the container reallocates (e.g. a `vector::push_back` invalidating previously taken references/iterators/pointers into the vector's old buffer).
**Detection heuristic:** `.get()`/`&*ptr`/`.data()` extraction whose result is stored in a variable that outlives the current scope, or used after a subsequent mutating call (`push_back`, `resize`, `erase`) on the same container.
**Severity:** Critical — same exploitation potential as any C-level UAF.

### `CPP-DANGLINGREF` — Reference/pointer to a temporary
**Description:** Binding a reference to a temporary object's member or return value (`const std::string& s = getTempString().substr(0,3);`, or storing `&t` where `t` is a function-local temporary in an initializer list) creates a dangling reference the instant the temporary's lifetime ends (immediately, except for the narrow lifetime-extension rule for a `const&`/`&&` bound *directly* to the temporary itself, not to a subobject or through a function call).
**Detection heuristic:** `const auto&`/`const T&` bindings to the result of a function call chain (`.method().submethod()`) rather than a plain temporary; struct/lambda captures storing `&` or `const&` to a parameter that is itself a temporary at the call site.
**Severity:** High to Critical.

### `CPP-SLICING` — Object slicing through pass-by-value of a polymorphic type
**Description:** Passing or storing a derived-class object by value through a base-class-typed parameter/container (`std::vector<Base>` instead of `std::vector<std::unique_ptr<Base>>`, or `void f(Base b)`) truncates it to the base subobject, silently discarding derived state and breaking virtual dispatch on the sliced copy.
**Detection heuristic:** A polymorphic class hierarchy (has virtual functions) stored/passed by value rather than by pointer/reference/smart pointer.
**Severity:** Medium (correctness), higher if a security decision depends on the derived type's overridden behavior.

### `CPP-DOUBLEFREEOWNERSHIP` — Double free from ambiguous/duplicated ownership
**Description:** A raw pointer is wrapped in two independent `unique_ptr`s (or a `shared_ptr` is constructed twice from the same raw pointer instead of copied), so both destructors call `delete` on the same address.
**Detection heuristic:** `std::unique_ptr<T>(rawPtr)` or `std::shared_ptr<T>(rawPtr)` constructed more than once from the same raw pointer variable, or manual `delete` alongside a smart pointer that also owns the same object.
**Severity:** Critical.

### `CPP-VIRTUALDESTRUCTORMISSING` — Non-virtual destructor in a polymorphic base class
**Description:** Deleting a derived object through a `Base*`/`unique_ptr<Base>` when `~Base()` is not `virtual` only runs `~Base()`, skipping the derived destructor — leaking any resources the derived class owns and constituting undefined behavior per the standard.
**Detection heuristic:** A base class with at least one `virtual` method but a non-virtual (or absent, implicitly non-virtual) destructor, combined with `delete basePtr;` or a smart pointer typed as the base.
**Severity:** High (resource leak; UB per spec even when it "seems to work").

---

## Cluster: Move Semantics & Resource Management

### `CPP-USEAFTERMOVE` — Use of an object after `std::move`
**Description:** After `std::move(x)` is passed to a function/constructor, `x` is left in a valid-but-unspecified state; reading `x`'s value afterward (rather than only reassigning or destroying it) is a logic bug and, for types with pointer members not nulled by their move constructor, can be a use-after-free-adjacent hazard.
**Detection heuristic:** A variable used (read, not just reassigned/destructed) textually after a `std::move(var)` call earlier in the same scope.
**Severity:** Medium (correctness) to High if the moved-from state exposes a dangling internal pointer.

### `CPP-SELFMOVEASSIGN` — Move assignment operator not self-move-safe
**Description:** A hand-written move assignment operator (`T& operator=(T&& other)`) that doesn't guard against `this == &other` can destroy its own resources before "moving" them from itself, corrupting the object (self-move is technically legal and does occur via generic/templated code and container algorithms).
**Detection heuristic:** Custom move-assignment operators with no `if (this != &other)` guard, freeing/resetting members before copying from `other`.
**Severity:** Medium.

### `CPP-EXCEPTIONUNSAFE` — Resource leak on an exception path due to missing RAII
**Description:** A `new`/manual resource acquisition followed by code that can throw before the matching `delete`/release, with no RAII wrapper (`unique_ptr`, `lock_guard`) or `try/catch`, leaks the resource whenever an exception unwinds through that scope.
**Detection heuristic:** `new T(...)` (bare, not immediately wrapped in a smart pointer constructor) followed by other statements that can throw (allocations, further calls) before the corresponding `delete`.
**Severity:** Medium to High depending on the resource (memory vs. a lock, which becomes a permanent deadlock if never released).

### `CPP-DESTRUCTORTHROW` — Exception thrown from a destructor
**Description:** A destructor that throws during stack unwinding (while another exception is already propagating) calls `std::terminate` immediately, crashing the process — destructors are implicitly `noexcept` since C++11 unless explicitly marked otherwise, so this is doubly dangerous.
**Detection heuristic:** Destructors containing operations that can throw (container operations, explicit `throw`, calling code that isn't documented `noexcept`) with no internal `try/catch` swallowing the exception.
**Severity:** High (process-wide crash/DoS).

---

## Cluster: Concurrency

### `CPP-DATARACE` — Unsynchronized shared memory access across threads
**Description:** Same fundamental hazard as C (`C-DATARACE`) — a data race is undefined behavior in the C++ memory model. Also includes `std::shared_ptr` reference-count races: copying/destroying the *same* `shared_ptr` instance (not the control block, the instance itself) from multiple threads without synchronization is a race, even though the control block's atomic refcount is itself thread-safe.
**Detection heuristic:** Shared variables mutated across `std::thread` bodies without `std::mutex`/`std::atomic`; the same `shared_ptr` object (not two copies) accessed non-atomically from multiple threads. Confirm with ThreadSanitizer.
**Severity:** High.

### `CPP-LOCKORDERDEADLOCK` — Inconsistent lock acquisition order (ABBA deadlock)
**Description:** Thread A locks mutex 1 then mutex 2; thread B locks mutex 2 then mutex 1 — if they interleave, each holds one lock while waiting for the other, deadlocking permanently.
**Detection heuristic:** Multiple `std::mutex`/`std::lock_guard` pairs acquired in different orders across different functions/threads; prefer `std::scoped_lock`/`std::lock` (which acquire multiple mutexes atomically in a deadlock-avoiding order) and flag manual sequential locking of 2+ mutexes as suspicious.
**Severity:** High.

### `CPP-ATOMICORDERINGMISUSE` — Incorrect memory-order argument on an atomic operation
**Description:** Using `memory_order_relaxed` where acquire/release ordering is required to publish data safely between threads (e.g. a relaxed store of a "ready" flag with the actual payload written via a plain, non-atomic store beforehand) can let another thread observe the flag before the payload write is visible.
**Detection heuristic:** `std::atomic<T>` operations with `memory_order_relaxed` guarding publication of other, non-atomic shared data.
**Severity:** High (rare to trigger, hard to debug, genuinely a race when it happens).

---

## Cluster: Templates, Casts & Undefined Behavior

### `CPP-REINTERPRETCAST` — `reinterpret_cast`/C-style cast bypassing type safety
**Description:** Reinterpreting one type's bytes as another (e.g. casting a `Base*` to an unrelated `Derived*` without a `dynamic_cast` check, or punning through `reinterpret_cast<int*>` on a `float*`) is undefined behavior unless the types satisfy strict aliasing / layout compatibility rules.
**Detection heuristic:** `reinterpret_cast<` or a C-style cast `(T*)ptr` between unrelated pointer types, especially crossing from network/file byte buffers directly into a typed struct pointer without using `memcpy` (which is the standard-compliant way to reinterpret bytes).
**Severity:** High (real miscompilation risk under optimization, especially with strict aliasing enabled).

### `CPP-DYNAMICCASTUNCHECKED` — `dynamic_cast` result used without a null check
**Description:** `dynamic_cast<Derived*>(basePtr)` returns `nullptr` on failure (for pointer casts) but the result is dereferenced without checking, causing a null-pointer dereference when the actual object isn't of the expected derived type.
**Detection heuristic:** `dynamic_cast<T*>(` whose result is used without a preceding `if (result)`/`nullptr` check on the same line or shortly after.
**Severity:** Medium to High (crash, or logic bypass if used in a security-relevant type check).

### `CPP-TEMPLATEINSTANTIATIONUB` — Undefined behavior hidden behind a template that "just compiles" for the tested type
**Description:** Generic template code that assumes a property not guaranteed by the type constraint (e.g. assuming a trivially-copyable type when instantiated with a non-trivial one, or assuming a fixed size) can silently misbehave when instantiated for a different type at a call site the author didn't test.
**Detection heuristic:** Templates performing `memcpy`/raw-byte operations on a generic `T` with no `static_assert(std::is_trivially_copyable_v<T>)` or equivalent constraint.
**Severity:** Medium to High depending on the misuse's consequence.

---

## Cluster: Input Validation & Injection

### `CPP-CMDINJ` — Command injection via `system()`/`popen()`
**Description:** Same as `C-CMDINJ` — passing untrusted, unsanitized input to `system()`/`popen()` allows shell metacharacter injection. Common in C++ codebases that still shell out for convenience.
**Detection heuristic:** `system(`/`popen(` with concatenated/formatted untrusted input, including via `std::string` concatenation rather than a raw C string.
**Severity:** Critical.

### `CPP-DESERIALIZEUNCHECKEDLENGTH` — Deserializing a length-prefixed buffer without validating the length against the actual buffer size
**Description:** Reading a length field from a network/file protocol and then reading/copying that many bytes without checking it against the actual remaining buffer size causes an out-of-bounds read — a very common vulnerability class in hand-rolled binary protocol parsers written in C++.
**Detection heuristic:** A parsed integer length field flowing directly into a `memcpy`/`std::copy`/loop bound with no `if (length > remaining_bytes)` check beforehand.
**Severity:** Critical for network-facing parsers.

---

## Cluster: Resource Safety

### `CPP-CONTAINERITERATORINVALIDATION` — Iterator/reference invalidated by a container mutation used afterward
**Description:** Erasing from a `vector`/`map` while iterating without using the returned updated iterator (`it = container.erase(it)`), or continuing to use an iterator into a `vector` after a `push_back`/`resize` that may have reallocated, uses an invalidated iterator — undefined behavior, frequently manifesting as a crash or silent corruption.
**Detection heuristic:** `.erase(it)` inside a loop with `++it` still executed on the now-invalid iterator afterward instead of reassigning from `erase`'s return value; iterators/pointers taken before a `push_back`/`insert`/`resize` and used after it.
**Severity:** High.

### `CPP-RESOURCELEAKNORAII` — Bare `new[]`/`malloc`-style resource without an owning RAII wrapper
**Description:** Manual `new T[]` or C-API resource acquisition (file handles, sockets) stored in a raw pointer with manual `delete[]`/`close()` calls scattered across multiple exit paths is fragile — any missed path leaks the resource, and any exception between acquisition and release leaks it (see `CPP-EXCEPTIONUNSAFE`).
**Detection heuristic:** `new T[` or C resource-acquisition APIs not immediately wrapped in `unique_ptr`/`vector`/a dedicated RAII class.
**Severity:** Medium.
