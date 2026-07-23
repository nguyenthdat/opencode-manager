# ptr-no-uninitialized-pointer

> Always initialize pointer variables, even to `NULL`, at declaration

## Why It Matters

An uninitialized pointer holds an indeterminate value — not necessarily `NULL` — so a `NULL` check on it is meaningless and dereferencing it is undefined behavior that can jump to or write to an arbitrary address. Initializing every pointer to `NULL` (or a valid target) at declaration makes "not yet set" a state your code can actually detect.

## Bad

```c
struct config *cfg;         /* indeterminate value */
if (want_config) {
    cfg = load_config();
}
use(cfg);                    /* if !want_config, cfg is garbage, not NULL */

void process(void) {
    char *buf;                /* uninitialized */
    if (need_buffer()) {
        buf = malloc(256);
    }
    free(buf);                 /* UB if need_buffer() was false */
}
```

## Good

```c
struct config *cfg = NULL;
if (want_config) {
    cfg = load_config();
}
if (cfg) {
    use(cfg);
}

void process(void) {
    char *buf = NULL;
    if (need_buffer()) {
        buf = malloc(256);
    }
    free(buf);   /* free(NULL) is a safe no-op if buf was never set */
}
```

## Struct Members Too

```c
struct node {
    int value;
    struct node *next;
};

struct node n = { .value = 42, .next = NULL };   /* explicit, not left indeterminate */
```

## See Also

- [mem-init-before-use](mem-init-before-use.md) - General uninitialized-variable discipline
- [ptr-null-check-before-deref](ptr-null-check-before-deref.md) - Why NULL checks only work if NULL is the true "unset" state
- [ub-uninitialized-variable-read](ub-uninitialized-variable-read.md) - The formal undefined-behavior rule
