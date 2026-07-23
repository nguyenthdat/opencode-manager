# perf-cache-friendly-struct-layout

> Order struct fields and lay out arrays so the data actually accessed together in hot code lives close together in memory

## Why It Matters

Modern CPUs fetch memory in cache-line-sized chunks (typically 64 bytes); accessing data scattered across memory forces repeated cache-line loads, while accessing tightly packed, sequentially-laid-out data lets the prefetcher and cache do their job. This can be a larger performance factor than algorithmic micro-optimizations for data-heavy hot loops.

## Bad

```c
/* Every element is large, but the hot loop only touches `active` — the rest
 * of each element is loaded into cache anyway and wasted. */
struct entity {
    char  name[64];
    float transform[16];
    bool  active;
    char  description[256];
};
struct entity entities[10000];

for (int i = 0; i < 10000; i++) {
    if (entities[i].active) count++;   /* touches ~340 bytes of cache to read 1 byte */
}
```

## Good — Struct of Arrays for Hot Fields

```c
struct entities {
    bool  active[10000];      /* hot field, packed tightly: 10000 bytes, cache-friendly scan */
    char  name[10000][64];
    float transform[10000][16];
    char  description[10000][256];
};

for (int i = 0; i < 10000; i++) {
    if (entities.active[i]) count++;   /* sequential scan over a small, dense array */
}
```

## Field Ordering Within a Struct Still Matters

```c
/* Group fields accessed together in the same hot path adjacently, and put
 * cold, rarely-touched fields (like a large descriptive buffer) last. */
struct connection {
    int    fd;             /* hot: checked/used every loop iteration */
    int    state;           /* hot */
    size_t bytes_sent;       /* warm */
    char   debug_label[128];  /* cold: only used for logging */
};
```

## See Also

- [mem-struct-padding-awareness](mem-struct-padding-awareness.md) - Layout considerations that interact with cache-friendliness
- [perf-struct-of-arrays](perf-struct-of-arrays.md) - The SoA pattern shown above, covered in more depth
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Confirm this is actually your bottleneck before restructuring
