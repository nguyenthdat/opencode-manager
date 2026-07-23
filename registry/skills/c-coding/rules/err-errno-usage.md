# err-errno-usage

> Read `errno` only immediately after a call that failed, and never assume it was reset to zero on success

## Why It Matters

`errno` is a thread-local (since C11's `<threads.h>`/POSIX) global that library functions set on failure but generally do **not** clear on success. Checking `errno` without first checking the function's own failure indicator, or checking it long after the call, can read a stale value left over from an unrelated earlier call.

## Bad

```c
errno = 0;              /* often skipped */
long v = strtol(input, &end, 10);
if (errno) {              /* might be stale from a previous unrelated call if not reset */
    handle_error();
}

FILE *fp = fopen(path, "r");
do_other_stuff();          /* may itself set errno */
if (errno == ENOENT) {      /* errno might no longer reflect the fopen() call */
    handle_missing_file();
}
```

## Good

```c
errno = 0;                    /* reset immediately before the call, since strtol only sets errno on error */
long v = strtol(input, &end, 10);
if (errno == ERANGE) {
    handle_out_of_range();
} else if (end == input) {
    handle_no_digits();
}

FILE *fp = fopen(path, "r");
if (!fp) {
    if (errno == ENOENT) {     /* checked immediately, still valid */
        handle_missing_file();
    } else {
        perror("fopen");
    }
}
```

## Key Rules

- Check `errno` only after a call whose documentation says it sets `errno` on failure, and only after you've confirmed the call failed (`fp == NULL`, return `-1`, etc.).
- Don't rely on `errno == 0` to mean "success" unless the specific function you're calling promises to reset it (most don't).
- `strerror(errno)` (or `strerror_r` for thread-safety) converts it to a message.

## See Also

- [err-perror-strerror](err-perror-strerror.md) - Reporting errno-based errors to the user
- [err-consistent-return-codes](err-consistent-return-codes.md) - Alternatives to relying on errno at all
- [conc-thread-local-storage](conc-thread-local-storage.md) - Why errno is safe across threads
