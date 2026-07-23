# ptr-function-pointer-typedef

> Typedef function pointer types instead of spelling out raw function-pointer syntax at every use site

## Why It Matters

Raw function-pointer declarations (`int (*fn)(int, int)`) are hard to read and easy to get wrong, especially in struct fields, parameter lists, or `_Generic` selections. A typedef gives the type a name that documents intent and makes signatures consistent across a codebase.

## Bad

```c
struct handlers {
    int (*on_open)(int fd, void *ctx);
    void (*on_close)(int fd, void *ctx);
};

void register_handler(int (*cb)(int, void *), void *ctx);
int (*lookup(const char *name))(int, void *);   /* nearly unreadable */
```

## Good

```c
typedef int  (*open_handler_fn)(int fd, void *ctx);
typedef void (*close_handler_fn)(int fd, void *ctx);

struct handlers {
    open_handler_fn  on_open;
    close_handler_fn on_close;
};

void register_handler(open_handler_fn cb, void *ctx);
open_handler_fn lookup(const char *name);   /* clear return type */
```

## Callback Registration Pattern

```c
typedef void (*log_sink_fn)(const char *msg, void *user_data);

void log_set_sink(log_sink_fn sink, void *user_data);

static void write_to_stderr(const char *msg, void *user_data) {
    (void)user_data;
    fputs(msg, stderr);
}

log_set_sink(write_to_stderr, NULL);
```

## See Also

- [api-callback-with-userdata](api-callback-with-userdata.md) - The `void *` context-pointer pattern used above
- [type-generic-macro](type-generic-macro.md) - `_Generic` dispatch, another place raw types get unwieldy
- [name-struct-typedef-convention](name-struct-typedef-convention.md) - General typedef naming conventions
