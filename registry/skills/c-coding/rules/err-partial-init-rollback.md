# err-partial-init-rollback

> When a multi-step initialization fails partway through, roll back exactly the steps that already succeeded

## Why It Matters

A constructor-like function that acquires several resources in sequence must undo only what it actually acquired if a later step fails — freeing a resource that was never allocated is its own bug, and leaving an acquired one unfreed is a leak. Getting this exactly right requires either careful step-by-step rollback or the `goto`-cleanup pattern.

## Bad

```c
struct server *server_create(const char *addr) {
    struct server *s = malloc(sizeof(*s));
    s->socket = create_socket(addr);
    s->log = log_open("server.log");
    if (!s->log) {
        free(s);              /* leaks s->socket! rollback is incomplete */
        return NULL;
    }
    return s;
}
```

## Good

```c
struct server *server_create(const char *addr) {
    struct server *s = calloc(1, sizeof(*s));   /* zero so unset fields are NULL/-1, safe to "free" */
    if (!s) return NULL;

    s->socket = create_socket(addr);
    if (s->socket < 0) {
        free(s);
        return NULL;
    }

    s->log = log_open("server.log");
    if (!s->log) {
        close(s->socket);       /* roll back the step that did succeed */
        free(s);
        return NULL;
    }

    return s;
}
```

## Same Problem, goto-Cleanup Style

```c
struct server *server_create(const char *addr) {
    struct server *s = calloc(1, sizeof(*s));
    if (!s) return NULL;
    s->socket = -1;

    s->socket = create_socket(addr);
    if (s->socket < 0) goto fail;

    s->log = log_open("server.log");
    if (!s->log) goto fail;

    return s;

fail:
    if (s->socket >= 0) close(s->socket);
    free(s);
    return NULL;
}
```

## See Also

- [err-goto-cleanup-single-exit](err-goto-cleanup-single-exit.md) - The general pattern for this
- [mem-single-owner-free](mem-single-owner-free.md) - Ownership discipline needed to roll back safely
- [api-init-cleanup-pair](api-init-cleanup-pair.md) - Pairing create/destroy at the API level
