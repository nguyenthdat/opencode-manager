# doc-example-usage-in-header

> Include a short, realistic usage example in the header comment for any non-trivial public API, especially ones with a specific required call order

## Why It Matters

A list of function signatures tells a reader *what* is available but not *how the pieces fit together* — especially for APIs with a required sequence (create, then configure, then start) or subtle interactions between calls. A concrete example answers "how do I actually use this" faster than reverse-engineering it from the signatures alone, and doubles as a lightweight regression check if it's kept in sync (or, better, extracted into an actual compiled example/test).

## Bad

```c
/* server.h */
struct server *server_create(const struct server_config *cfg);
int server_start(struct server *s);
int server_stop(struct server *s);
void server_destroy(struct server *s);
/* Is start() blocking? Must stop() be called before destroy()? Unclear
 * without reading the implementation. */
```

## Good

```c
/*
 * server.h
 *
 * Example usage:
 *
 *   struct server_config cfg = { .port = 8080 };
 *   struct server *s = server_create(&cfg);
 *   if (!s) { handle_error(); }
 *
 *   if (server_start(s) != 0) { handle_error(); }   // non-blocking; returns once listening
 *   ...
 *   server_stop(s);      // must be called before destroy() if start() succeeded
 *   server_destroy(s);
 */

struct server *server_create(const struct server_config *cfg);
int  server_start(struct server *s);   /* non-blocking */
int  server_stop(struct server *s);
void server_destroy(struct server *s);
```

## Keep Examples Honest by Compiling Them

Where practical, move the example into an actual `examples/` directory that's built and run in CI, and reference it from the header comment — this guarantees the example never silently drifts out of sync with the real API.

## See Also

- [doc-module-level-overview-comment](doc-module-level-overview-comment.md) - The broader module documentation this example illustrates
- [api-init-cleanup-pair](api-init-cleanup-pair.md) - The create/destroy call-order convention examples often need to show
- [test-integration-test-separate-binary](test-integration-test-separate-binary.md) - Turning an example into an executable check
