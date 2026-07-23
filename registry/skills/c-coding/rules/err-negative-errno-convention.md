# err-negative-errno-convention

> When adopting the negative-errno return convention, return `-errno_value` on failure and never mix it with `-1`/`errno` in the same API

## Why It Matters

The negative-errno convention (used throughout the Linux kernel and many userspace libraries) lets a function return `0` for success and a specific negative error code otherwise, all in a single `int` — no global `errno` read required, and thread-safe by construction. Mixing it with the traditional "`-1`, check global `errno`" convention in the same library is a frequent source of caller confusion.

## Bad

```c
int conn_open(const char *host) {
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (fd < 0) {
        return -1;          /* caller must separately check errno here */
    }
    if (connect(fd, ...) < 0) {
        return -errno;       /* ...but here, the function already returns -errno. Inconsistent! */
    }
    return fd;
}
```

## Good

```c
/* Consistently: 0 or positive == success/handle, negative == -errno */
int conn_open(const char *host, int *out_fd) {
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (fd < 0) {
        return -errno;
    }
    if (connect(fd, ...) < 0) {
        int err = errno;
        close(fd);
        return -err;
    }
    *out_fd = fd;
    return 0;
}

int rc = conn_open("example.com", &fd);
if (rc < 0) {
    fprintf(stderr, "conn_open: %s\n", strerror(-rc));
    return rc;
}
```

## Why Capture errno Before Cleanup

```c
if (connect(fd, ...) < 0) {
    int err = errno;    /* close() below could itself change errno; capture first */
    close(fd);
    return -err;
}
```

## See Also

- [err-consistent-return-codes](err-consistent-return-codes.md) - Choosing and sticking to one convention
- [err-errno-usage](err-errno-usage.md) - Correct errno reading discipline
- [err-perror-strerror](err-perror-strerror.md) - Converting error codes to messages
