# err-assert-vs-runtime-check

> Use `assert()` for programmer errors and invariants you control; use runtime error handling for anything derived from external input

## Why It Matters

`assert()` is typically compiled out entirely when `NDEBUG` is defined (standard release builds), so any check that must hold in production — validating user input, network data, file contents, or syscall results — must never be an `assert`. Conflating the two means either release builds silently skip a needed check, or debug builds crash on conditions a real caller can legitimately trigger.

## Bad

```c
void set_volume(int level) {
    assert(level >= 0 && level <= 100);   /* level came from a config file / network — this vanishes in release builds */
    apply_volume(level);
}

int divide(int a, int b) {
    if (b == 0) {
        return 0;   /* silently wrong instead of asserting a real programmer bug */
    }
    return a / b;
}
```

## Good

```c
int set_volume(int level) {
    if (level < 0 || level > 100) {
        return -EINVAL;         /* real runtime check: input came from outside this module */
    }
    apply_volume(level);
    return 0;
}

int divide(int a, int b, int *out) {
    assert(out != NULL);        /* programmer error: a caller passing NULL is a bug to fix, not a runtime condition */
    if (b == 0) {
        return -EINVAL;          /* legitimate runtime condition, must be checked in release builds too */
    }
    *out = a / b;
    return 0;
}
```

## Rule of Thumb

| Condition source | Mechanism |
|-------------------|-----------|
| Internal invariant ("this can't happen if my code is correct") | `assert()` |
| Function precondition violated only by a caller bug | `assert()` |
| User input, file contents, network data | Runtime check + error return |
| Allocation / syscall result | Runtime check + error return |

## See Also

- [err-check-return-values](err-check-return-values.md) - Runtime checking of fallible operations
- [type-static-assert-invariants](type-static-assert-invariants.md) - Compile-time invariants via `static_assert`
- [err-fail-fast-invariant](err-fail-fast-invariant.md) - When crashing immediately is the right response
