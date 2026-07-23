# mem-flexible-array-member

> Use a C99 flexible array member for variable-length trailing data instead of a fixed oversized buffer or two allocations

## Why It Matters

A flexible array member (`T arr[];` as the last struct field) lets you allocate the header and its variable-length payload in a single `malloc`, improving cache locality and removing an entire class of "did I free both parts" bugs compared to a struct that holds a separate pointer to heap data.

## Bad

```c
struct packet {
    size_t len;
    char  *data;      /* second allocation, second free, extra indirection */
};

struct packet *packet_new(size_t len) {
    struct packet *p = malloc(sizeof(*p));
    if (!p) return NULL;
    p->data = malloc(len);          /* two allocations to track */
    if (!p->data) { free(p); return NULL; }
    p->len = len;
    return p;
}

void packet_free(struct packet *p) {
    free(p->data);   /* must remember both frees, in the right order */
    free(p);
}
```

## Good

```c
struct packet {
    size_t len;
    char   data[];    /* flexible array member: must be last */
};

struct packet *packet_new(size_t len) {
    struct packet *p = malloc(sizeof(*p) + len);   /* one allocation */
    if (!p) return NULL;
    p->len = len;
    return p;
}

void packet_free(struct packet *p) {
    free(p);          /* one free covers header + payload */
}
```

## Rules for Flexible Array Members

- Must be the last member of the struct, and the struct must have at least one other member.
- `sizeof(struct packet)` does not include the flexible array's storage; always allocate `sizeof(*p) + n * sizeof(p->data[0])`.
- Do not embed a struct with a flexible array member inside another struct or array.

## See Also

- [mem-sizeof-pointer-pitfall](mem-sizeof-pointer-pitfall.md) - Correct `sizeof` usage for allocation math
- [mem-arena-allocator](mem-arena-allocator.md) - Batching multiple allocations another way
- [ub-out-of-bounds-access](ub-out-of-bounds-access.md) - Overrunning the flexible array is still UB
