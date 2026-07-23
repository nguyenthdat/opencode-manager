# str-string-building-dynamic

> Build large or unbounded strings with a growable buffer that tracks length and capacity, not repeated fixed-size `strcat`/`snprintf` into a static buffer

## Why It Matters

A fixed-size buffer forces you to guess a maximum output size up front, and every additional `strcat` re-scans from the start to find the current end (O(n) per call, O(n²) overall for n appends). A dynamic buffer that tracks its own length lets appends be O(1) amortized and removes the arbitrary size ceiling.

## Bad

```c
char result[1024];               /* arbitrary cap: what if the real output is longer? */
result[0] = '\0';
for (size_t i = 0; i < count; i++) {
    strcat(result, items[i]);    /* re-scans from result's start every single call */
    strcat(result, ", ");
}
```

## Good

```c
typedef struct {
    char  *data;
    size_t len;
    size_t cap;
} strbuf;

void strbuf_append(strbuf *b, const char *s) {
    size_t s_len = strlen(s);
    if (b->len + s_len + 1 > b->cap) {
        size_t new_cap = (b->cap ? b->cap * 2 : 64);
        while (new_cap < b->len + s_len + 1) new_cap *= 2;
        char *tmp = realloc(b->data, new_cap);
        if (!tmp) return;   /* real code should propagate this failure */
        b->data = tmp;
        b->cap = new_cap;
    }
    memcpy(b->data + b->len, s, s_len + 1);   /* copies the '\0' too */
    b->len += s_len;
}

strbuf sb = {0};
for (size_t i = 0; i < count; i++) {
    strbuf_append(&sb, items[i]);
    strbuf_append(&sb, ", ");
}
puts(sb.data);
free(sb.data);
```

## See Also

- [mem-realloc-temp-pointer](mem-realloc-temp-pointer.md) - Safe growth pattern used above
- [str-strlen-cost-awareness](str-strlen-cost-awareness.md) - The O(n^2) cost this rule avoids
- [perf-avoid-alloc-in-hot-loop](perf-avoid-alloc-in-hot-loop.md) - Amortized growth strategy in general
