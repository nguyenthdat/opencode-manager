# mem-free-list-pool

> Use a free-list pool allocator for objects that are frequently created and destroyed in a fixed size

## Why It Matters

When a program repeatedly allocates and frees objects of the same size (connection structs, tree nodes, events), the general-purpose allocator's bookkeeping and fragmentation overhead dominates. A free-list pool preallocates a block of fixed-size slots and recycles them in O(1), avoiding the round-trip to `malloc`/`free` entirely for the common path.

## Bad

```c
struct event *events_pending[MAX];

struct event *event_new(void) {
    return malloc(sizeof(struct event));   /* thousands of times per second */
}
void event_release(struct event *e) {
    free(e);                                /* fragments the heap over time */
}
```

## Good

```c
typedef struct pool_slot {
    struct pool_slot *next_free;
    struct event      value;
} pool_slot;

typedef struct pool {
    pool_slot *free_list;
    pool_slot *slots;      /* backing storage */
} pool;

void pool_init(pool *p, pool_slot *backing, size_t n) {
    p->slots = backing;
    p->free_list = NULL;
    for (size_t i = 0; i < n; i++) {
        backing[i].next_free = p->free_list;
        p->free_list = &backing[i];
    }
}

struct event *pool_alloc(pool *p) {
    if (!p->free_list) return NULL;   /* pool exhausted */
    pool_slot *s = p->free_list;
    p->free_list = s->next_free;
    return &s->value;
}

void pool_release(pool *p, struct event *e) {
    pool_slot *s = (pool_slot *)((char *)e - offsetof(pool_slot, value));
    s->next_free = p->free_list;
    p->free_list = s;
}
```

## Trade-offs

- Fixed capacity: `pool_alloc` must handle exhaustion (grow, block, or reject).
- Only suitable when all objects share one size (or a small number of size classes).
- Pairs well with an arena for the backing storage itself.

## See Also

- [mem-arena-allocator](mem-arena-allocator.md) - Bump allocation for batch, non-recycled objects
- [perf-avoid-false-sharing](perf-avoid-false-sharing.md) - Pool layout matters for multi-threaded pools
- [conc-mutex-protect-shared-state](conc-mutex-protect-shared-state.md) - Guard a shared pool across threads
