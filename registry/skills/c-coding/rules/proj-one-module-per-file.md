# proj-one-module-per-file

> Keep each `.c`/`.h` pair focused on a single, cohesive responsibility; split a file once it accumulates more than one clear reason to change

## Why It Matters

A file that mixes unrelated responsibilities (network I/O and business logic; parsing and rendering) forces every reader to load all of that unrelated context just to understand one part, and makes the file's own `static` helpers and includes balloon over time. Splitting along module boundaries keeps each file's purpose statable in one sentence (see `doc-header-comment-convention`) and makes dependencies between modules explicit through their headers.

## Bad

```c
/* app.c — 4000 lines covering networking, config parsing, business logic,
 * and CLI argument handling, all in one file */
int parse_config(const char *path, struct config *cfg) { ... }
int connect_to_server(const char *host) { ... }
int run_business_logic(struct config *cfg, int fd) { ... }
int parse_cli_args(int argc, char **argv) { ... }
```

## Good

```
config.c / config.h     # parse_config and related helpers only
network.c / network.h    # connect_to_server and related helpers only
app_logic.c / app_logic.h  # run_business_logic only
cli.c / cli.h              # parse_cli_args only
main.c                      # wires the above together; stays minimal
```

## A Practical Signal It's Time to Split

If you can't summarize a file's responsibility in one sentence without using "and," or if two unrelated features both require editing the same file for unrelated reasons, that's a strong signal the file covers more than one module's worth of responsibility.

## See Also

- [doc-header-comment-convention](doc-header-comment-convention.md) - Stating a file's single responsibility explicitly
- [api-single-responsibility-function](api-single-responsibility-function.md) - The same principle applied at the function level
- [proj-header-source-split](proj-header-source-split.md) - The header/source split each module follows
