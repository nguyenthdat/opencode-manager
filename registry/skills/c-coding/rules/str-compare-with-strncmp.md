# str-compare-with-strncmp

> Use `strncmp`/`memcmp` with an explicit, known length when comparing strings whose length you already control, instead of unbounded `strcmp`

## Why It Matters

`strcmp` scans both strings until it finds a difference or a null terminator — unbounded relative to any length you may already know. When you're comparing a fixed-length prefix, a length-known token, or data from an untrusted source that might not be null-terminated at all, an unbounded scan can read past the intended data.

## Bad

```c
/* Checking a prefix by hand with strcmp on a truncated copy — extra copy, extra risk */
char prefix[5];
memcpy(prefix, input, 4);
prefix[4] = '\0';
if (strcmp(prefix, "GET ") == 0) { ... }

/* Comparing possibly non-null-terminated network data with strcmp */
if (strcmp(recv_buf, "PING") == 0) { ... }   /* recv_buf may not be null-terminated at all */
```

## Good

```c
if (strncmp(input, "GET ", 4) == 0) { ... }     /* no extra copy, bounded to exactly 4 bytes */

if (recv_len == 4 && memcmp(recv_buf, "PING", 4) == 0) { ... }  /* length-checked before comparing raw bytes */
```

## strncmp Still Requires a Null Terminator Within n Bytes (Unlike memcmp)

```c
/* strncmp stops early at a '\0' in either string, same as strcmp, just capped
 * at n bytes — it is not safe on non-null-terminated buffers the way memcmp is. */
strncmp(a, b, n);   /* fine for two proper C strings, bounded to at most n bytes */
memcmp(a, b, n);      /* the right choice for raw/binary/non-terminated buffers of known length n */
```

## See Also

- [str-null-termination-invariant](str-null-termination-invariant.md) - Why unterminated buffers need `mem*`, not `str*`
- [mem-avoid-buffer-overflow](mem-avoid-buffer-overflow.md) - The out-of-bounds read this rule helps avoid
- [ub-out-of-bounds-access](ub-out-of-bounds-access.md) - The formal hazard being mitigated
