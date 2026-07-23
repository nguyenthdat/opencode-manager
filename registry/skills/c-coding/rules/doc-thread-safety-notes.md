# doc-thread-safety-notes

> State explicitly, for every public function and type, whether it is safe to call/access concurrently from multiple threads

## Why It Matters

Thread-safety is invisible in a C function's signature — nothing distinguishes a function that's safe to call from any thread from one that requires external synchronization or is only safe from a single "owning" thread. Without an explicit statement, callers either assume safety incorrectly (introducing a data race) or add unnecessary locking around something that was already safe, both of which are avoidable with one sentence of documentation.

## Bad

```c
/** Appends an entry to the log. */
void log_append(struct logger *l, const char *msg);
/* Safe to call from multiple threads at once? Unknown without reading the
 * implementation (and re-checking after every refactor). */
```

## Good

```c
/**
 * Appends an entry to the log.
 *
 * Thread-safety: safe to call concurrently from multiple threads; internally
 * synchronized with a mutex. Do not call from a signal handler (not
 * async-signal-safe).
 */
void log_append(struct logger *l, const char *msg);

/**
 * Advances the iterator to the next element.
 *
 * Thread-safety: NOT thread-safe. A given `iterator` must only be used from
 * a single thread at a time; callers must supply their own synchronization
 * if sharing one across threads.
 */
int iterator_next(struct iterator *it, void **out);
```

## A Short, Consistent Vocabulary Helps

| Phrase | Meaning |
|--------|---------|
| "thread-safe" | Safe to call concurrently from multiple threads without external locking |
| "not thread-safe" | Caller must serialize access themselves |
| "async-signal-safe" | Safe to call from within a signal handler (a much stricter, separate guarantee) |
| "thread-compatible" | Safe if each instance is used by only one thread at a time (common per-object convention) |

## See Also

- [conc-mutex-protect-shared-state](conc-mutex-protect-shared-state.md) - The synchronization such notes often describe
- [doc-module-level-overview-comment](doc-module-level-overview-comment.md) - Where module-wide thread-safety guarantees belong
- [conc-avoid-data-races](conc-avoid-data-races.md) - The hazard these notes exist to prevent
