# test-mock-via-function-pointers

> Inject dependencies (I/O, time, randomness) through function pointers or a small interface struct so tests can substitute fakes

## Why It Matters

C has no built-in mocking or dependency-injection mechanism, so code that calls `read()`, `time()`, or a network function directly is hard to unit test without touching the real filesystem, clock, or network. Accepting a function pointer (or a struct of them) for the dependency lets tests substitute a deterministic fake, making the test fast, repeatable, and independent of the environment.

## Bad

```c
bool is_token_expired(struct token *t) {
    return time(NULL) > t->expiry;   /* directly calls the real system clock: untestable without waiting */
}
```

## Good

```c
typedef time_t (*clock_fn)(time_t *);

bool is_token_expired(struct token *t, clock_fn now_fn) {
    return now_fn(NULL) > t->expiry;
}

/* Production: */
bool expired = is_token_expired(t, time);

/* Test: fully deterministic, no waiting */
static time_t fake_clock(time_t *out) {
    time_t fixed = 1700000000;   /* fixed point in time */
    if (out) *out = fixed;
    return fixed;
}
assert(is_token_expired(&expired_token, fake_clock) == true);
```

## Interface Struct for Multiple Related Dependencies

```c
struct io_ops {
    ssize_t (*read)(int fd, void *buf, size_t n);
    ssize_t (*write)(int fd, const void *buf, size_t n);
};

int save_data(const struct io_ops *io, int fd, const void *data, size_t len) {
    return io->write(fd, data, len) == (ssize_t)len ? 0 : -1;
}

/* Tests supply a struct io_ops with fake read/write implementations that
 * record calls and return controlled results, without touching real fds. */
```

## See Also

- [ptr-function-pointer-typedef](ptr-function-pointer-typedef.md) - Typedef discipline for these injected function types
- [test-unit-test-framework](test-unit-test-framework.md) - CMocka in particular has built-in mocking macros for this pattern
- [api-avoid-global-state](api-avoid-global-state.md) - Avoiding globals makes dependencies injectable in the first place
