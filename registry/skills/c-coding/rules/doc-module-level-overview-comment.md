# doc-module-level-overview-comment

> Give every module (a header plus its `.c` file(s)) a top-level overview comment describing its responsibilities, key types, and how it fits into the larger system

## Why It Matters

A file-level comment (see `doc-header-comment-convention`) covers one file; a module-level overview covers the module as a whole — its public header, its relationship to neighboring modules, its key invariants — usually placed at the top of the public header where anyone integrating with the module will read it first.

## Bad

```c
/* connection_pool.h */
struct pool *pool_create(int max_conns);
int pool_acquire(struct pool *p, struct connection **out);
void pool_release(struct pool *p, struct connection *c);
/* no explanation of the pool's sizing behavior, thread-safety guarantees,
 * or how callers are expected to use acquire/release together */
```

## Good

```c
/*
 * connection_pool.h — bounded pool of reusable TCP connections.
 *
 * Overview:
 *   - The pool holds at most `max_conns` live connections; pool_acquire()
 *     blocks if the pool is exhausted until a connection is released.
 *   - Thread-safe: pool_acquire/pool_release may be called concurrently
 *     from multiple threads.
 *   - Connections are lazily created on first acquire, not eagerly at
 *     pool_create() time.
 *
 * Typical usage:
 *   struct connection *c;
 *   pool_acquire(pool, &c);
 *   use(c);
 *   pool_release(pool, c);
 */

struct pool *pool_create(int max_conns);
int pool_acquire(struct pool *p, struct connection **out);
void pool_release(struct pool *p, struct connection *c);
```

## See Also

- [doc-header-comment-convention](doc-header-comment-convention.md) - The per-file counterpart to this module-level overview
- [doc-thread-safety-notes](doc-thread-safety-notes.md) - The thread-safety details called out above, in more depth
- [proj-one-module-per-file](proj-one-module-per-file.md) - The module boundary this comment describes
