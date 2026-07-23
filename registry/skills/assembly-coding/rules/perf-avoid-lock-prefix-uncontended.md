# perf-avoid-lock-prefix-uncontended

> Reserve the `lock` prefix (and other atomic read-modify-write instructions) for genuinely shared, contended state; avoid it on data that's actually thread-local or uncontended

## Why It Matters

`lock`-prefixed instructions enforce cache-coherency guarantees across all cores, which costs meaningfully more than a plain (non-atomic) instruction even when there's no actual contention, because the CPU must still ensure the operation is globally atomic. Using `lock` reflexively on data that's provably only touched by one thread — or serializing access to data via a `lock`ed operation where a coarser, less frequent synchronization point would do — pays that cost for no correctness benefit.

## Bad

```asm
# x86-64 AT&T - lock-prefixed increment on a counter that's actually thread-local
.global increment_local_counter_wrong
increment_local_counter_wrong:
    lock incq (%rdi)   # BUG-ish: unnecessary lock overhead if this counter is never shared
    ret
```

## Good

```asm
# x86-64 AT&T - plain increment; safe because this counter is confirmed thread-local
.global increment_local_counter
increment_local_counter:
    incq (%rdi)     # no lock prefix needed; only this thread ever touches this memory
    ret
```

## When lock Is Genuinely Required

```asm
# x86-64 AT&T - a counter that IS shared across threads legitimately needs the atomic increment
.global increment_shared_counter
increment_shared_counter:
    lock incq (%rdi)    # correct and necessary: multiple threads really do race on this memory
    ret
```

## Reducing Contention Instead of Just Removing the Lock

When data genuinely is shared but contention is the actual bottleneck (not the mere presence of `lock`), consider per-thread partial counters combined periodically, or padding shared atomics to their own cache lines (see `mem-cache-line-alignment`) to avoid false sharing compounding the atomic overhead.

## Verifying a Variable Really Is Thread-Local

Before removing a `lock` prefix, confirm — via the actual threading model of the surrounding program, not assumption — that no other thread can ever observe or modify the same memory concurrently; getting this wrong reintroduces a genuine data race for a small, often barely-measurable performance gain.

## See Also

- [mem-cache-line-alignment](mem-cache-line-alignment.md) - Reducing false-sharing-driven contention
- [interop-asm-memory-clobber](interop-asm-memory-clobber.md) - Telling the compiler about memory-ordering-relevant asm
- [perf-profile-before-hand-tuning](perf-profile-before-hand-tuning.md) - Confirm this is actually a bottleneck before changing it
