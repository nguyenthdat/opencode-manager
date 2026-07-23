# str-avoid-sprintf-use-snprintf

> Use `snprintf` instead of `sprintf`, and always check its return value against the destination buffer size

## Why It Matters

`sprintf` has no notion of the destination buffer's size and will write however many bytes the formatted output requires, overflowing the buffer if the formatted result is longer than expected — easy to happen when formatting user-supplied strings or numbers whose width isn't bounded at compile time. `snprintf` takes the buffer size and never writes past it, and its return value tells you whether truncation occurred.

## Bad

```c
char msg[64];
sprintf(msg, "Error in %s at line %d: %s", filename, line, description);
/* if filename + description together exceed ~50 bytes, this overflows msg */
```

## Good

```c
char msg[64];
int n = snprintf(msg, sizeof(msg), "Error in %s at line %d: %s", filename, line, description);
if (n < 0) {
    /* encoding error */
} else if ((size_t)n >= sizeof(msg)) {
    /* output was truncated to fit; msg is still null-terminated and safe to use,
     * but decide whether truncation is acceptable for this call site */
}
```

## snprintf's Return Value Tells You the Untruncated Length

```c
/* snprintf returns the number of characters that *would have been written*
 * if the buffer were big enough — useful for computing an exact allocation: */
int needed = snprintf(NULL, 0, "%s: %d", name, value);   /* dry run, no buffer */
char *buf = malloc(needed + 1);
if (buf) {
    snprintf(buf, needed + 1, "%s: %d", name, value);
}
```

## See Also

- [str-avoid-strcpy-strcat](str-avoid-strcpy-strcat.md) - The equivalent problem for plain copies/concatenation
- [str-buffer-size-discipline](str-buffer-size-discipline.md) - General discipline for tracking buffer sizes
- [anti-not-checking-snprintf-truncation](anti-not-checking-snprintf-truncation.md) - The specific anti-pattern of ignoring the return value
