# doc-header-comment-convention

> Start every source and header file with a brief comment stating its purpose, and keep it current as the file's role changes

## Why It Matters

A file-level comment is the first thing a new contributor reads when opening a file for the first time — it orients them ("this is the connection-pooling logic," "this is the platform-specific I/O shim") before they read a single line of implementation, saving the time of reverse-engineering purpose from code alone.

## Bad

```c
/* connection.c */
#include "connection.h"
/* no indication of what this file is responsible for, what its boundaries
 * are, or how it relates to the other files in the module */
```

## Good

```c
/*
 * connection.c — TCP connection lifecycle management.
 *
 * Owns creation, teardown, and reconnection logic for `struct connection`.
 * Does not handle protocol-level framing (see protocol.c) or connection
 * pooling (see pool.c).
 */
#include "connection.h"
```

## Keep It Brief and Focused on "Why This File Exists"

```c
/*
 * ring_buffer.c — fixed-capacity, single-producer/single-consumer ring buffer.
 * Thread-safe only between exactly one producer thread and one consumer
 * thread; see docs/concurrency.md for the full contract.
 */
```

Avoid duplicating information that belongs in per-function documentation (parameters, return values) — the file header states scope and responsibility, not API details.

## See Also

- [doc-module-level-overview-comment](doc-module-level-overview-comment.md) - Related, broader module-level documentation
- [doc-doxygen-function-comments](doc-doxygen-function-comments.md) - Per-function documentation this complements
- [proj-one-module-per-file](proj-one-module-per-file.md) - The module boundaries this comment describes
