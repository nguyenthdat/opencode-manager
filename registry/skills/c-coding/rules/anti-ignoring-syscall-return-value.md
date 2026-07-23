# anti-ignoring-syscall-return-value

> Don't ignore the return value of system calls like `write`, `read`, `close`, and `fork`; each can fail or partially complete

## Why It Matters

POSIX system calls routinely do less than requested (a "short write/read") or fail outright, and unlike a typical library function, the reasons are often environmental (disk full, signal interruption, resource limits) rather than a caller bug — exactly the kind of failure real production code needs to detect and handle, not the kind that's safe to assume away.

## Bad

```c
write(fd, buf, len);        /* return value ignored: a short write or failure goes unnoticed */
read(fd, buf, len);           /* same: caller assumes len bytes were read, but may have gotten fewer or an error */
close(fd);                     /* buffered write errors, and even simple close() failures, are silently dropped */
```

## Good

```c
size_t written = 0;
while (written < len) {
    ssize_t n = write(fd, buf + written, len - written);
    if (n < 0) {
        if (errno == EINTR) continue;   /* interrupted by a signal: retry */
        return -errno;
    }
    written += (size_t)n;
}

if (close(fd) != 0) {
    perror("close");
    return -errno;
}
```

## Marking These Calls warn_unused_result at the Wrapper Level

```c
#define MUST_CHECK __attribute__((warn_unused_result))

MUST_CHECK ssize_t write_all(int fd, const void *buf, size_t len);
/* forces every call site of your own wrapper to handle the result explicitly */
```

## See Also

- [err-check-return-values](err-check-return-values.md) - The general rule this anti-pattern violates
- [err-errno-usage](err-errno-usage.md) - Correctly reading errno after a failed syscall
- [err-perror-strerror](err-perror-strerror.md) - Reporting the failure in a useful way
