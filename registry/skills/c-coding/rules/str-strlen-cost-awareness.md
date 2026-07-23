# str-strlen-cost-awareness

> Remember `strlen()` is O(n); cache the length instead of recomputing it repeatedly in a loop

## Why It Matters

`strlen` scans the string byte-by-byte until it finds the null terminator; it is not a constant-time operation. Calling it inside a loop condition, or repeatedly on the same unmodified string, turns an intended O(n) algorithm into O(n²) — a mistake that's invisible on small test inputs and only shows up as a performance cliff on large ones.

## Bad

```c
/* Recomputes strlen(s) on every iteration: O(n^2) overall */
for (size_t i = 0; i < strlen(s); i++) {
    process(s[i]);
}

/* Repeated on unchanged data across multiple calls in a hot path */
void log_line(const char *msg) {
    if (strlen(msg) > 0) { ... }
    write(fd, msg, strlen(msg));   /* computed twice here alone */
}
```

## Good

```c
size_t len = strlen(s);   /* computed once */
for (size_t i = 0; i < len; i++) {
    process(s[i]);
}

void log_line(const char *msg) {
    size_t len = strlen(msg);
    if (len > 0) { ... }
    write(fd, msg, len);
}
```

## Track Length Alongside the String When It's Built Incrementally

```c
struct dynbuf {
    char  *data;
    size_t len;   /* tracked explicitly; never recompute via strlen after every append */
};

void dynbuf_append(struct dynbuf *b, const char *s) {
    size_t s_len = strlen(s);   /* unavoidable for a fresh C string input, but only once */
    /* ... grow b->data, memcpy s into b->data + b->len ... */
    b->len += s_len;             /* subsequent appends don't need to strlen(b->data) */
}
```

## See Also

- [perf-avoid-alloc-in-hot-loop](perf-avoid-alloc-in-hot-loop.md) - Related hot-loop performance discipline
- [str-string-building-dynamic](str-string-building-dynamic.md) - Tracking length while building strings incrementally
- [perf-loop-invariant-hoisting](perf-loop-invariant-hoisting.md) - The general optimization this rule is an instance of
