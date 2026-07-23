# str-null-termination-invariant

> Maintain the C string invariant everywhere: every byte buffer treated as a string must have a `'\0'` within its bounds before any `str*` function touches it

## Why It Matters

Every function in `<string.h>` that doesn't take an explicit length (`strlen`, `strcpy`, `strcmp`, `strcat`, ...) determines where a string ends purely by scanning for a null byte. If that invariant is broken — a buffer that was never terminated, or was overwritten past its logical end without re-terminating — these functions read past the intended data (and potentially past the allocation) looking for a terminator that isn't there.

## Bad

```c
char buf[16];
memcpy(buf, data, 16);   /* fills the full buffer with exactly 16 bytes, no room for '\0' */
printf("%s\n", buf);       /* strlen/printf scan past buf's end looking for a terminator */
```

## Good

```c
char buf[17];                       /* one extra byte reserved for the terminator */
size_t n = (data_len < 16) ? data_len : 16;
memcpy(buf, data, n);
buf[n] = '\0';                        /* invariant restored explicitly */
printf("%s\n", buf);
```

## Every Write Path Must Preserve the Invariant

```c
/* Truncating or modifying a string in place must re-terminate at the new end: */
void truncate_at(char *s, size_t max_len) {
    if (strlen(s) > max_len) {
        s[max_len] = '\0';   /* invariant preserved after truncation */
    }
}
```

## Binary Data Is Not a C String

Data that may legitimately contain embedded `'\0'` bytes (binary blobs, some network protocols) must never be passed to `str*` functions at all — track its length explicitly and use the `mem*` family (`memcpy`, `memcmp`, `memchr`) instead.

## See Also

- [str-strncpy-null-termination-footgun](str-strncpy-null-termination-footgun.md) - A common way this invariant gets broken
- [ub-out-of-bounds-access](ub-out-of-bounds-access.md) - The consequence of scanning past the buffer
- [str-safe-string-copy-pattern](str-safe-string-copy-pattern.md) - A helper that preserves this invariant automatically
