# C Bug-Class Reference

Companion to `SKILL.md`. Use the same finding format, severity guidance, and evidence rules defined there. This file is the C bug-class checklist — lighter than the Rust deep-dive under `references/rust/`, but each entry is specific and actionable. Unlike managed languages, **all C code is effectively unsafe by default** — there is no safe/unsafe boundary to map; every buffer, pointer, and manual allocation is in scope for memory-safety review.

---

## Cluster: Buffer & Memory Safety

### `C-BOF` — Buffer overflow via unchecked copy/write
**Description:** `strcpy`, `strcat`, `sprintf`, `gets`, or a manual loop/`memcpy` writes more bytes than the destination buffer holds, corrupting adjacent stack/heap memory — the classic C vulnerability class, still the leading cause of memory-safety CVEs.
**Detection heuristic:** `\bstrcpy\(|\bstrcat\(|\bsprintf\(|\bgets\(` (all inherently unbounded); `memcpy`/`memmove`/manual loops where the length argument is attacker-influenced and not validated against the destination's actual capacity.
**Severity:** Critical when the source is untrusted input and the overflow is stack-based (RCE via return-address overwrite) or corrupts heap metadata.

### `C-UAF` — Use-after-free
**Description:** A pointer is dereferenced, or its address is reused, after the memory it points to has been `free()`d — the freed chunk may already be reallocated for something else, so the read/write corrupts unrelated data (or the attacker groom-allocates the freed slot with attacker-controlled content).
**Detection heuristic:** `free(ptr)` with no subsequent `ptr = NULL;`, followed by any later dereference of `ptr` on a code path that doesn't obviously return immediately. Grep for `free(` and trace each freed variable's remaining lifetime in the function/struct.
**Severity:** Critical — a top gadget-chain primitive for exploitation.

### `C-DFREE` — Double free
**Description:** Calling `free()` twice on the same pointer (directly, or via two different owners believing they each own it) corrupts heap allocator metadata, often exploitable for arbitrary write.
**Detection heuristic:** Two `free(x)` calls reachable on the same pointer without an intervening reallocation, especially across error-handling paths where a cleanup `goto fail` runs after a partial failure already freed the same resource.
**Severity:** Critical.

### `C-OOBREAD` — Out-of-bounds read
**Description:** Indexing an array/buffer past its allocated length (off-by-one in a loop bound, unchecked attacker-supplied index) reads adjacent memory — can leak secrets (info disclosure) or crash (DoS), and is often the read-primitive half of an exploit chain.
**Detection heuristic:** Array/pointer indexing with a bound derived from `<=` instead of `<` against a length, or an index taken directly from untrusted input with no range check before use.
**Severity:** High (info leak) to Critical (crash on a fault or a component of a larger exploit).

### `C-UNINITREAD` — Read of uninitialized memory
**Description:** A stack or heap variable is read before being assigned a value, exposing whatever bytes happened to be there previously (potentially a prior request's secret data on the same stack frame/heap chunk).
**Detection heuristic:** Local variables/struct fields used (especially passed to `printf`, sent over a socket, or written to a response buffer) before any assignment on all code paths; `malloc` (not `calloc`) followed by a use before a full-struct memset.
**Severity:** Medium (info leak) to High depending on what's exposed.

### `C-DANGLINGSTACKPTR` — Returning a pointer to a local (stack) variable
**Description:** A function returns `&local_var` (or a pointer stored into an out-parameter that points at a stack local); once the function returns, that stack frame is invalid, and the caller dereferences garbage/overwritten memory.
**Detection heuristic:** `return &` of a non-`static` local, or an out-parameter assigned the address of a local variable.
**Severity:** High.

---

## Cluster: Integer & Arithmetic Safety

### `C-INTOVERFLOW` — Integer overflow feeding an allocation size
**Description:** `malloc(count * size)` where `count` and `size` are both attacker-influenced can overflow to a small value, causing an undersized allocation followed by writes computed against the (large, un-overflowed) logical size — classic integer-overflow-to-buffer-overflow.
**Detection heuristic:** `malloc(`/`calloc(`-adjacent multiplication of two variables at least one of which is attacker-controlled, with no overflow check (`calloc` itself checks internally — prefer it — but manual `malloc(a*b)` does not).
**Severity:** Critical.

### `C-SIGNEDUNSIGNEDCONFUSION` — Signed/unsigned comparison or conversion bug
**Description:** Comparing a `signed int` (which can be negative, e.g. an unchecked `read()`/`recv()` return value indicating an error) against a `size_t` promotes the signed value to a huge unsigned number, silently defeating an intended bounds check (`if (len < buf_size)` where `len` is a corrupted negative int).
**Detection heuristic:** Comparisons between `int`/`ssize_t` and `size_t`/`unsigned int` where the signed operand can plausibly be negative (return values from `read`, `recv`, `strtol` without error checking).
**Severity:** High.

### `C-TRUNCATION` — Narrowing conversion silently truncates a length/size value
**Description:** Assigning a `size_t`/`long` length into a smaller type (`int`, `short`, or a fixed-width protocol field) truncates the value, so a later bounds check against the truncated value passes while the actual copy uses the full (larger) original length.
**Detection heuristic:** Length values assigned across a narrower type boundary between the point they're validated and the point they're used in a copy/allocation.
**Severity:** High.

---

## Cluster: Format String & String Handling

### `C-FORMATSTRING` — Attacker-controlled format string
**Description:** `printf(user_input)` (instead of `printf("%s", user_input)`) lets an attacker supply format directives; `%x` leaks stack memory, and `%n` can write to memory, making this a read-and-write primitive.
**Detection heuristic:** Any `printf`/`fprintf`/`sprintf`/`syslog`-family call whose first (format) argument is a variable rather than a string literal.
**Severity:** Critical if the format string is attacker-influenced and `%n` is not disabled/rejected by the platform's libc hardening.

### `C-STRNCPYMISUSE` — `strncpy` misuse leaving the buffer unterminated
**Description:** `strncpy(dst, src, n)` does not NUL-terminate `dst` if `src` is `n` bytes or longer, and it zero-pads the remainder if `src` is shorter (wasted cycles, and a common source of the "forgot the manual terminator" bug) — any subsequent `strlen`/`printf("%s", dst)` reads past the buffer until it happens to hit a NUL.
**Detection heuristic:** `strncpy(` with no immediately following explicit `dst[n-1] = '\0';` (or equivalent).
**Severity:** Medium to High (OOB read via the missing terminator).

### `C-OFFBYONETERMINATOR` — Off-by-one omitting space for the NUL terminator
**Description:** Allocating/copying exactly `strlen(src)` bytes for a C string forgets the extra byte for the terminating NUL, causing a one-byte buffer overflow when the terminator is written (or a missing terminator if it isn't).
**Detection heuristic:** `malloc(strlen(s))` (no `+ 1`) followed by `strcpy`, or a fixed buffer sized exactly to an expected max content length with no `+1`.
**Severity:** High.

---

## Cluster: Concurrency

### `C-DATARACE` — Unsynchronized shared memory access across threads
**Description:** A global/heap variable read and written from multiple `pthread`s without a mutex/atomic produces a data race — in C this is undefined behavior per the standard, not just "unpredictable output"; the compiler is permitted to assume no data races and may miscompile in ways that surprise even careful reviewers.
**Detection heuristic:** Global/static variables mutated inside thread entry functions with no `pthread_mutex_lock`/`atomic_*` operations; confirm with ThreadSanitizer (`-fsanitize=thread`).
**Severity:** High.

### `C-SIGNALASYNCUNSAFE` — Non-async-signal-safe function called from a signal handler
**Description:** Calling `malloc`, `printf`, or most libc functions from inside a signal handler can deadlock or corrupt state if the signal interrupted the same function mid-execution (e.g. `malloc` interrupted by a signal that itself calls `malloc` re-enters a non-reentrant lock).
**Detection heuristic:** Signal handlers (registered via `signal()`/`sigaction()`) that call anything outside the POSIX async-signal-safe list (`write`, `_exit`, a small allowlist).
**Severity:** Medium to High (rare but genuine crash/hang condition).

### `C-TOCTOU` — Time-of-check to time-of-use race on filesystem operations
**Description:** Checking a file's existence/permissions/type (`access()`, `stat()`) and then separately opening/operating on it by name leaves a window where an attacker with local access can swap the target (symlink race), so the operation acts on a different object than the one checked.
**Detection heuristic:** `access(`/`stat(`/`lstat(` on a path followed by a separate `open(`/`fopen(`/`unlink(` on the same path string, with no `O_NOFOLLOW`/`O_EXCL` or fd-based recheck (`fstat` on the already-open fd).
**Severity:** High for setuid/privileged programs or shared-tmp-directory usage.

---

## Cluster: Resource & Error Handling

### `C-UNCHECKEDRETURN` — Return value of a fallible libc call ignored
**Description:** `malloc`, `read`, `write`, `snprintf` and similar can fail or return partial results; ignoring the return value (using a NULL pointer from a failed `malloc`, assuming `read()` filled the whole buffer, ignoring `snprintf`'s truncation-indicating return) leads to a null-deref, uninitialized-data use, or silently truncated output.
**Detection heuristic:** `malloc(` with no adjacent NULL check before use; `read(`/`write(` return value discarded when a short read/write is possible (sockets, pipes); `snprintf(` return value ignored where truncation matters.
**Severity:** Medium (crash) to High (if a truncated/partial buffer is then used as if complete, e.g. building a path or command).

### `C-DOUBLEUNLOCK` / `C-MISSINGUNLOCK` — Lock imbalance on an error path
**Description:** `pthread_mutex_lock` on one path and an early `return`/`goto` on an error branch skips the matching `pthread_mutex_unlock`, deadlocking the next locker; conversely unlocking twice is undefined behavior.
**Detection heuristic:** Every `pthread_mutex_lock`/`unlock` pair should be traceable on all control-flow paths including early returns and `goto` cleanup labels; missing a matching unlock on an error branch is the most common form.
**Severity:** High (deadlock is a full DoS of whatever the lock protects).

### `C-FILEDESCRIPTORLEAK` — File descriptor not closed on an error path
**Description:** `open()`/`socket()` succeeds, then an error-handling `return` skips the matching `close()`, leaking the fd; under sustained attacker-triggerable errors this exhausts the process's fd limit (DoS).
**Detection heuristic:** `open(`/`socket(`/`accept(` with a success path close but an error/early-return path that doesn't close the already-acquired fd.
**Severity:** Medium.

---

## Cluster: Input Validation & Injection

### `C-CMDINJ` — Command injection via `system()`/`popen()`
**Description:** Passing a string built from untrusted input to `system()` or `popen(..., "w")` executes it through `/bin/sh`, letting shell metacharacters inject additional commands.
**Detection heuristic:** `system(`/`popen(` where the argument contains concatenated/formatted untrusted input.
**Severity:** Critical.

### `C-PATHTRAVERSAL` — Path traversal via unsanitized filename concatenation
**Description:** Building a file path with `snprintf(path, sizeof(path), "%s/%s", base, user_input)` without rejecting `../` sequences or absolute paths in `user_input` lets an attacker escape `base`.
**Detection heuristic:** Path-building `snprintf`/`strcat` calls incorporating untrusted input with no `..`-segment rejection or `realpath()`-based containment check.
**Severity:** High.

### `C-ENVTRUST` — Trusting environment variables in a privileged/setuid context
**Description:** A setuid/setgid binary (or one invoked by a higher-privilege caller) reads `PATH`, `LD_PRELOAD`, `IFS`, or other environment variables without sanitizing them, letting an unprivileged invoker influence privileged execution.
**Detection heuristic:** `getenv(` used in a binary installed setuid/setgid, or before an `execve`/`system` call, with no explicit environment sanitization (`clearenv`/allowlist).
**Severity:** Critical for setuid binaries.
