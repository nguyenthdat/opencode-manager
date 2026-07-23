# mem-avoid-buffer-overflow

> Never write or read past the bounds of an allocated buffer

## Why It Matters

Writing past a buffer's end corrupts adjacent memory — other variables, heap metadata, or a saved return address on the stack. This is undefined behavior and, in the stack case, is the foundation of classic stack-smashing exploits. Reading past the end can leak adjacent memory contents or crash on an unmapped page.

## Bad

```c
char name[16];
strcpy(name, user_input);          /* no bound check: overflow if input >= 16 bytes */

int scores[10];
for (int i = 0; i <= 10; i++) {    /* off-by-one: writes scores[10], out of bounds */
    scores[i] = 0;
}
```

## Good

```c
char name[16];
size_t n = strlcpy(name, user_input, sizeof(name));  /* or snprintf(name, sizeof name, "%s", user_input) */
if (n >= sizeof(name)) {
    /* input was truncated; handle as needed */
}

int scores[10];
for (size_t i = 0; i < sizeof(scores) / sizeof(scores[0]); i++) {
    scores[i] = 0;
}
```

## Bound-Checked Copy Helper

```c
int safe_copy(void *dst, size_t dst_size, const void *src, size_t src_size) {
    if (src_size > dst_size) {
        return -1;   /* refuse instead of truncating silently */
    }
    memcpy(dst, src, src_size);
    return 0;
}
```

## Defense in Depth

Compile with `-D_FORTIFY_SOURCE=2 -O2` to get runtime bounds checks inserted into `memcpy`/`strcpy`/`sprintf` calls where the destination size is known at compile time, and run tests under AddressSanitizer to catch overflows that fortification misses.

## See Also

- [str-avoid-strcpy-strcat](str-avoid-strcpy-strcat.md) - Bounded string copy alternatives
- [ptr-bounds-before-index](ptr-bounds-before-index.md) - Bounds-check before indexing
- [lint-address-sanitizer](lint-address-sanitizer.md) - Runtime detection of overflows
