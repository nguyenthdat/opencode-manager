# perf-avoid-alloc-in-hot-loop

> Hoist allocation out of hot loops; allocate once before the loop and reuse the buffer, or use a pool/arena

## Why It Matters

`malloc`/`free` are not free — even a fast allocator implementation involves bookkeeping, and a slower one may involve a lock or a system call. Allocating and freeing inside a loop that runs thousands or millions of times turns what should be a cheap iteration into one dominated by allocator overhead, and can fragment the heap over a long-running process's lifetime.

## Bad

```c
void process_items(struct item *items, size_t n) {
    for (size_t i = 0; i < n; i++) {
        char *scratch = malloc(256);   /* allocated and freed n times */
        format_item(&items[i], scratch, 256);
        handle(scratch);
        free(scratch);
    }
}
```

## Good

```c
void process_items(struct item *items, size_t n) {
    char scratch[256];   /* stack-allocated once, reused every iteration */
    for (size_t i = 0; i < n; i++) {
        format_item(&items[i], scratch, sizeof(scratch));
        handle(scratch);
    }
}
```

## When the Buffer Must Be Heap-Allocated (Size Not Known at Compile Time)

```c
void process_items(struct item *items, size_t n, size_t scratch_cap) {
    char *scratch = malloc(scratch_cap);   /* one allocation, outside the loop */
    if (!scratch) return;
    for (size_t i = 0; i < n; i++) {
        format_item(&items[i], scratch, scratch_cap);
        handle(scratch);
    }
    free(scratch);
}
```

## See Also

- [mem-stack-vs-heap](mem-stack-vs-heap.md) - When stack reuse (as shown above) is the right call
- [mem-arena-allocator](mem-arena-allocator.md) - A pool-based alternative for variable-size, per-iteration allocations
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Confirm the loop is hot before restructuring it
