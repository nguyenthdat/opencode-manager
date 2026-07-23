# ptr-bounds-before-index

> Validate an index against the buffer's bounds before using it to index or offset a pointer

## Why It Matters

C performs no automatic bounds checking on array indexing or pointer arithmetic. An index derived from user input, a network message, or a miscounted loop that exceeds the buffer's bounds reads or writes outside the allocation — undefined behavior that is a leading cause of security vulnerabilities in C code.

## Bad

```c
int get_item(const int *arr, size_t len, size_t index) {
    return arr[index];   /* index never checked against len */
}

char *advance(char *p, ptrdiff_t offset) {
    return p + offset;   /* caller-supplied offset, no bound check */
}
```

## Good

```c
int get_item(const int *arr, size_t len, size_t index, int *out) {
    if (index >= len) {
        return -1;         /* reject rather than read out of bounds */
    }
    *out = arr[index];
    return 0;
}

char *advance(char *base, size_t buf_len, ptrdiff_t offset) {
    if (offset < 0 || (size_t)offset > buf_len) {
        return NULL;
    }
    return base + offset;
}
```

## Checked Indexing Helper

```c
static inline bool in_bounds(size_t index, size_t len) {
    return index < len;
}

#define CHECKED_AT(arr, len, idx, fallback) \
    (in_bounds((idx), (len)) ? (arr)[(idx)] : (fallback))
```

## See Also

- [ptr-no-arithmetic-past-bounds](ptr-no-arithmetic-past-bounds.md) - Pointer arithmetic-specific bound rules
- [mem-avoid-buffer-overflow](mem-avoid-buffer-overflow.md) - Consequences of skipping this check
- [ub-out-of-bounds-access](ub-out-of-bounds-access.md) - Formal undefined-behavior classification
