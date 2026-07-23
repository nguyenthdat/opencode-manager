# mem-stack-vs-heap

> Prefer stack allocation for small, short-lived, bounded-size data over heap allocation

## Why It Matters

Stack allocation is essentially free (a pointer bump on function entry/exit) and needs no `free()`, so it cannot leak or be double-freed. Reaching for `malloc` by default adds allocator overhead and an ownership/lifetime contract to track for data that never needs to outlive the function.

## Bad

```c
void print_formatted(int value) {
    char *buf = malloc(32);     /* heap alloc for a tiny, function-local buffer */
    snprintf(buf, 32, "%d", value);
    puts(buf);
    free(buf);                    /* extra bookkeeping for no benefit */
}
```

## Good

```c
void print_formatted(int value) {
    char buf[32];                /* stack: freed automatically on return */
    snprintf(buf, sizeof(buf), "%d", value);
    puts(buf);
}
```

## When Heap Is the Right Choice

```c
/* 1. Size not known until runtime and potentially large */
char *load_file(const char *path, size_t *out_len);

/* 2. Data must outlive the current function (returned, stored, or handed to another thread) */
struct request *req = malloc(sizeof(*req));

/* 3. Large data that would blow the stack (a few KB is typically the practical ceiling
 *    per frame in multi-threaded programs with bounded stack sizes) */
```

## Variable-Length Arrays: Use With Care

C99 VLAs (`int buf[n];` with runtime `n`) put unbounded, attacker-influenced sizes on the stack with no overflow check — this is exactly the scenario that leads to stack exhaustion. Prefer a fixed-size buffer with an explicit bound check, or heap-allocate when `n` is untrusted.

## See Also

- [mem-arena-allocator](mem-arena-allocator.md) - Bulk heap allocation when many small stack allocations aren't feasible
- [perf-avoid-alloc-in-hot-loop](perf-avoid-alloc-in-hot-loop.md) - Stack reuse avoids repeated heap churn
- [anti-return-stack-address](anti-return-stack-address.md) - Never return a pointer to a stack variable
