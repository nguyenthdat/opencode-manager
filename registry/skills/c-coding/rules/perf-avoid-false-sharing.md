# perf-avoid-false-sharing

> Pad or align per-thread data so independently-updated fields don't share the same CPU cache line

## Why It Matters

Cache coherency operates at the granularity of a cache line (commonly 64 bytes), not individual variables. If two threads each write to a *different* variable that happens to reside within the same cache line, the cache-coherency protocol still has to bounce that line between cores' caches on every write — "false sharing" — producing severe, non-obvious performance degradation that looks identical to genuine contention until you check the memory layout.

## Bad

```c
struct worker_stats {
    long count_a;   /* written frequently by thread A */
    long count_b;    /* written frequently by thread B, but likely on the same cache line as count_a */
};
struct worker_stats stats;   /* count_a and count_b are only 8 bytes apart: same 64-byte cache line */
```

## Good

```c
#define CACHE_LINE_SIZE 64

struct worker_stats {
    long count_a;
    char pad_a[CACHE_LINE_SIZE - sizeof(long)];   /* pads count_a out to its own cache line */

    long count_b;
    char pad_b[CACHE_LINE_SIZE - sizeof(long)];
};
struct worker_stats stats;   /* count_a and count_b now live on separate cache lines */
```

## C11 alignas for a Cleaner Expression of Intent

```c
#include <stdalign.h>

struct worker_stats {
    alignas(64) long count_a;
    alignas(64) long count_b;
};
```

## Measuring False Sharing

```sh
perf c2c record ./bench_binary   # perf's cache-to-cache tool directly identifies false-sharing hotspots on Linux
```

## See Also

- [conc-atomic-for-flags-counters](conc-atomic-for-flags-counters.md) - The per-thread counters most often affected by this
- [perf-cache-friendly-struct-layout](perf-cache-friendly-struct-layout.md) - Broader cache-layout considerations
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Confirming false sharing is the actual bottleneck before restructuring
