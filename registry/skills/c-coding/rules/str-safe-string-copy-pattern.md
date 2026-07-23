# str-safe-string-copy-pattern

> Standardize on one bounded, always-null-terminating copy helper and use it everywhere instead of ad hoc `strcpy`/`strncpy` calls

## Why It Matters

Every string copy in a codebase repeats the same three decisions — how much to copy, whether to null-terminate, what to do on truncation. Writing this out inline at every call site invites inconsistency (some call sites forget to null-terminate, some don't check for truncation). A single reusable helper makes the safe behavior the path of least resistance.

## Bad

```c
/* Every call site reinvents bounded copying slightly differently */
strncpy(a, src1, sizeof(a) - 1); a[sizeof(a) - 1] = '\0';
strncpy(b, src2, sizeof(b));       /* forgot to reserve space for the terminator here */
snprintf(c, sizeof(c), "%s", src3);
```

## Good

```c
/* string_util.h */

/* Copies at most dst_size - 1 bytes from src into dst, always null-terminating.
 * Returns the length of src, so the caller can detect truncation
 * (return value >= dst_size means truncation occurred), mirroring strlcpy. */
size_t safe_strcpy(char *dst, size_t dst_size, const char *src) {
    if (dst_size == 0) return strlen(src);
    size_t src_len = strlen(src);
    size_t copy_len = (src_len < dst_size - 1) ? src_len : dst_size - 1;
    memcpy(dst, src, copy_len);
    dst[copy_len] = '\0';
    return src_len;
}

char name[32];
if (safe_strcpy(name, sizeof(name), user_input) >= sizeof(name)) {
    fprintf(stderr, "warning: name truncated\n");
}
```

## Prefer the Platform's strlcpy When Available

```c
/* BSD libc, macOS, and increasingly Linux distros (via libbsd) provide
 * strlcpy/strlcat with exactly this contract; use them directly rather than
 * rolling your own if they're available on your target platforms. */
#include <bsd/string.h>
strlcpy(name, user_input, sizeof(name));
```

## See Also

- [str-strncpy-null-termination-footgun](str-strncpy-null-termination-footgun.md) - The specific bug this helper avoids
- [str-buffer-size-discipline](str-buffer-size-discipline.md) - Passing the destination size everywhere consistently
- [str-null-termination-invariant](str-null-termination-invariant.md) - The invariant this helper guarantees
