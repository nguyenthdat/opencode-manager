# mem-arena-allocator

> Use arena/pool allocation for batches of allocations that share a lifetime

## Why It Matters

Calling `malloc`/`free` per object is slow (allocator locking, metadata overhead, fragmentation) and error-prone (every object needs its own matching free). An arena allocates a large block up front and hands out slices with a bump pointer; the whole arena is freed in one call, eliminating per-object frees and most use-after-free/leak bugs for that lifetime.

## Bad

```c
/* Parsing a request allocates hundreds of small, individually-freed nodes */
struct node *parse(const char *input) {
    struct node *head = NULL, **tail = &head;
    for (const char *tok = next_token(&input); tok; tok = next_token(&input)) {
        struct node *n = malloc(sizeof(*n));   /* one malloc per token */
        n->text = strdup(tok);                  /* one more malloc */
        n->next = NULL;
        *tail = n; tail = &n->next;
    }
    return head;   /* caller must walk and free every node and n->text */
}
```

## Good

```c
typedef struct arena {
    unsigned char *base;
    size_t         used;
    size_t         cap;
} arena;

void *arena_alloc(arena *a, size_t size) {
    size = (size + 15) & ~(size_t)15;      /* 16-byte align */
    if (a->used + size > a->cap) return NULL;
    void *p = a->base + a->used;
    a->used += size;
    return p;
}

struct node *parse(const char *input, arena *a) {
    struct node *head = NULL, **tail = &head;
    for (const char *tok = next_token(&input); tok; tok = next_token(&input)) {
        struct node *n = arena_alloc(a, sizeof(*n));
        size_t len = strlen(tok) + 1;
        n->text = arena_alloc(a, len);
        memcpy(n->text, tok, len);
        n->next = NULL;
        *tail = n; tail = &n->next;
    }
    return head;
}

/* Caller: */
arena a = { .base = malloc(64 * 1024), .used = 0, .cap = 64 * 1024 };
struct node *ast = parse(input, &a);
use(ast);
free(a.base);   /* one free for the entire tree */
```

## When to Use an Arena

| Situation | Arena? |
|-----------|--------|
| Parser / AST / request-scoped data | Yes |
| Data that must outlive the batch | No — copy out first |
| Frequent individual frees within the batch | No — use a free-list pool instead |
| Long-lived, rarely-changing global state | No |

## See Also

- [mem-free-list-pool](mem-free-list-pool.md) - Reusable fixed-size slot allocator
- [mem-stack-vs-heap](mem-stack-vs-heap.md) - Prefer stack for small, short-lived data
- [perf-avoid-alloc-in-hot-loop](perf-avoid-alloc-in-hot-loop.md) - Batch allocation avoids per-iteration malloc
